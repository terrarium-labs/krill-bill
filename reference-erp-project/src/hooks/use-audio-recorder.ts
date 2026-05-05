import { useState, useRef, useCallback, useEffect } from "react"

export type RecordingState = "idle" | "recording" | "processing"

interface UseAudioRecorderReturn {
    state: RecordingState
    start: () => Promise<void>
    stop: () => Promise<Blob | null>
    cancel: () => void
    error: string | null
    audioLevels: number[]
}

const NUM_BARS = 80
const SAMPLE_RATE = 16000

const WORKLET_CODE = `
class AudioProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0]
    if (input && input[0]) {
      this.port.postMessage(new Float32Array(input[0]))
    }
    return true
  }
}
registerProcessor('audio-processor', AudioProcessor)
`

// Create blob URL for the worklet (cached)
let workletBlobUrl: string | null = null
function getWorkletUrl(): string {
    if (!workletBlobUrl) {
        const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' })
        workletBlobUrl = URL.createObjectURL(blob)
    }
    return workletBlobUrl
}

// Convert Float32Array PCM to WAV Blob
function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
    const buffer = new ArrayBuffer(44 + samples.length * 2)
    const view = new DataView(buffer)

    // WAV header
    const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i))
        }
    }

    writeString(0, "RIFF")
    view.setUint32(4, 36 + samples.length * 2, true)
    writeString(8, "WAVE")
    writeString(12, "fmt ")
    view.setUint32(16, 16, true) // PCM chunk size
    view.setUint16(20, 1, true) // PCM format
    view.setUint16(22, 1, true) // Mono
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * 2, true) // Byte rate
    view.setUint16(32, 2, true) // Block align
    view.setUint16(34, 16, true) // Bits per sample
    writeString(36, "data")
    view.setUint32(40, samples.length * 2, true)

    // Convert float samples to 16-bit PCM
    let offset = 44
    for (let i = 0; i < samples.length; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]))
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
        offset += 2
    }

    return new Blob([buffer], { type: "audio/wav" })
}

export function useAudioRecorder(): UseAudioRecorderReturn {
    const [state, setState] = useState<RecordingState>("idle")
    const [error, setError] = useState<string | null>(null)
    const [audioLevels, setAudioLevels] = useState<number[]>(new Array(NUM_BARS).fill(0))
    const streamRef = useRef<MediaStream | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const workletNodeRef = useRef<AudioWorkletNode | null>(null)
    const animationFrameRef = useRef<number | null>(null)
    const samplesRef = useRef<Float32Array[]>([])

    const cleanup = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
        }
        if (workletNodeRef.current) {
            workletNodeRef.current.disconnect()
            workletNodeRef.current = null
        }
        if (audioContextRef.current) {
            audioContextRef.current.close()
            audioContextRef.current = null
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        analyserRef.current = null
        samplesRef.current = []
        setAudioLevels(new Array(NUM_BARS).fill(0))
    }, [])

    // Audio analysis loop
    const updateAudioLevels = useCallback(() => {
        if (!analyserRef.current) return

        const analyser = analyserRef.current
        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(dataArray)

        // Sample frequency data to match our bar count
        const levels: number[] = []
        const step = Math.floor(dataArray.length / NUM_BARS)

        for (let i = 0; i < NUM_BARS; i++) {
            const index = i * step
            // Normalize to 0-1 range
            levels.push(dataArray[index] / 255)
        }

        setAudioLevels(levels)
        animationFrameRef.current = requestAnimationFrame(updateAudioLevels)
    }, [])

    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [])

    const start = useCallback(async () => {
        setError(null)
        samplesRef.current = []

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: SAMPLE_RATE,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                }
            })
            streamRef.current = stream

            // Set up audio context with target sample rate
            const audioContext = new AudioContext({ sampleRate: SAMPLE_RATE })
            audioContextRef.current = audioContext
            const source = audioContext.createMediaStreamSource(stream)

            // Analyser for visualization
            const analyser = audioContext.createAnalyser()
            analyser.fftSize = 256
            analyser.smoothingTimeConstant = 0.7
            source.connect(analyser)
            analyserRef.current = analyser

            // Load and create AudioWorklet for capturing samples
            await audioContext.audioWorklet.addModule(getWorkletUrl())
            const workletNode = new AudioWorkletNode(audioContext, 'audio-processor')
            workletNodeRef.current = workletNode

            workletNode.port.onmessage = (e) => {
                samplesRef.current.push(e.data)
            }

            source.connect(workletNode)

            // Start audio level updates
            updateAudioLevels()
            setState("recording")
        } catch (err) {
            const message = err instanceof Error ? err.message : "Microphone access denied"
            setError(message)
            cleanup()
            throw err
        }
    }, [cleanup, updateAudioLevels])

    const stop = useCallback(async (): Promise<Blob | null> => {
        if (state !== "recording") {
            cleanup()
            setState("idle")
            return null
        }

        setState("processing")

        // Combine all sample chunks into one Float32Array
        const totalLength = samplesRef.current.reduce((acc, chunk) => acc + chunk.length, 0)
        const allSamples = new Float32Array(totalLength)
        let offset = 0
        for (const chunk of samplesRef.current) {
            allSamples.set(chunk, offset)
            offset += chunk.length
        }

        // Get sample rate before cleanup
        const sampleRate = audioContextRef.current?.sampleRate || SAMPLE_RATE

        // Encode to WAV
        const wavBlob = encodeWAV(allSamples, sampleRate)

        cleanup()
        setState("idle")
        return wavBlob
    }, [state, cleanup])

    const cancel = useCallback(() => {
        cleanup()
        setState("idle")
        setError(null)
    }, [cleanup])

    return { state, start, stop, cancel, error, audioLevels }
}
