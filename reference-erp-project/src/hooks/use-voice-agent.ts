import { useState, useRef, useCallback, useEffect } from "react"
import { baseApiUrl } from "@/api/0.core/url"
import { supabase } from "@/lib/supabase"

export type VoiceAgentStatus = "idle" | "connecting" | "connected" | "error"

const SAMPLE_RATE = 16000
const NUM_BARS = 40

const WORKLET_CODE = `
class VoiceStreamProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this._buffer = new Float32Array(0)
    this._chunkSize = 1600  // 100ms at 16kHz

    // Noise gate thresholds
    this._openThreshold = 0.015
    this._closeThreshold = 0.008
    this._holdChunks = 12         // ~1.2s hold after last speech detected
    this._holdCounter = 0
    this._gateOpen = false

    // Initial calibration: measure ambient noise for first ~1s
    this._calibrating = true
    this._calibrationChunks = 0
    this._calibrationTarget = 10  // 10 chunks = ~1s
    this._noiseFloorSum = 0
    this._noiseFloor = 0
    this._minNoiseFloor = 0.001    // absolute minimum to avoid zero thresholds
    this._manualThreshold = null   // non-null when user sets a manual threshold

    // Slow drift of noise floor while gate is closed (EMA on silence RMS)
    this._floorEmaAlpha = 0.03
    this._silenceChunksForUi = 0
    this._uiNotifyInterval = 35   // ~3.5s of continuous silence between UI updates

    // Pre-buffer: keep last N chunks so we don't clip word onsets
    this._preBufferSize = 3  // ~300ms lookback
    this._preBuffer = []

    this.port.onmessage = (e) => {
      // manual: true => fixed gate from slider; otherwise one-shot sync, auto thresholds from cal
      if (e.data && typeof e.data.threshold === 'number') {
        this._openThreshold = e.data.threshold
        this._closeThreshold = e.data.threshold * 0.55
        this._manualThreshold = e.data.manual === true ? e.data.threshold : null
      }
      if (e.data && e.data.recalibrate) {
        this._calibrating = true
        this._calibrationChunks = 0
        this._noiseFloorSum = 0
        this._silenceChunksForUi = 0
        this._manualThreshold = null
      }
    }
  }

  _toInt16(chunk) {
    const int16 = new Int16Array(chunk.length)
    for (let i = 0; i < chunk.length; i++) {
      const s = Math.max(-1, Math.min(1, chunk[i]))
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
    }
    return int16
  }

  _updateThresholdsFromFloor() {
    const margin = Math.max(this._noiseFloor * 2.5, 0.008)
    this._openThreshold = this._noiseFloor + margin
    this._closeThreshold = this._noiseFloor + margin * 0.55
  }

  process(inputs) {
    const input = inputs[0]
    if (!input || !input[0]) return true
    const samples = input[0]

    const newBuf = new Float32Array(this._buffer.length + samples.length)
    newBuf.set(this._buffer)
    newBuf.set(samples, this._buffer.length)
    this._buffer = newBuf

    while (this._buffer.length >= this._chunkSize) {
      const chunk = this._buffer.slice(0, this._chunkSize)
      this._buffer = this._buffer.slice(this._chunkSize)

      let sumSq = 0
      for (let i = 0; i < chunk.length; i++) sumSq += chunk[i] * chunk[i]
      const rms = Math.sqrt(sumSq / chunk.length)

      // Initial calibration phase
      if (this._calibrating) {
        this._noiseFloorSum += rms
        this._calibrationChunks++
        if (this._calibrationChunks >= this._calibrationTarget) {
          this._noiseFloor = Math.max(
            this._noiseFloorSum / this._calibrationChunks,
            this._minNoiseFloor
          )
          this._updateThresholdsFromFloor()
          this._calibrating = false
          this.port.postMessage({
            calibrated: true,
            noiseFloor: this._noiseFloor,
            openThreshold: this._openThreshold,
          })
        }
        const int16 = new Int16Array(chunk.length)
        this.port.postMessage({ buffer: int16.buffer, gate: false }, [int16.buffer])
        continue
      }

      // Gate logic with hysteresis
      const wasOpen = this._gateOpen
      if (rms >= this._openThreshold) {
        this._gateOpen = true
        this._holdCounter = this._holdChunks
      } else if (this._gateOpen && rms < this._closeThreshold) {
        if (this._holdCounter > 0) {
          this._holdCounter--
        } else {
          this._gateOpen = false
        }
      } else if (this._gateOpen) {
        this._holdCounter = Math.min(this._holdCounter, this._holdChunks)
        if (this._holdCounter > 0) this._holdCounter--
        else this._gateOpen = false
      }

      if (this._gateOpen) {
        this._silenceChunksForUi = 0
        if (!wasOpen && this._preBuffer.length > 0) {
          for (const prev of this._preBuffer) {
            const int16 = this._toInt16(prev)
            this.port.postMessage({ buffer: int16.buffer, gate: true }, [int16.buffer])
          }
          this._preBuffer = []
        }

        const int16 = this._toInt16(chunk)
        this.port.postMessage({ buffer: int16.buffer, gate: true }, [int16.buffer])
      } else {
        if (this._manualThreshold === null) {
          this._noiseFloor = Math.max(
            this._floorEmaAlpha * rms + (1 - this._floorEmaAlpha) * this._noiseFloor,
            this._minNoiseFloor
          )
          this._updateThresholdsFromFloor()
          this._silenceChunksForUi++
          if (this._silenceChunksForUi >= this._uiNotifyInterval) {
            this._silenceChunksForUi = 0
            this.port.postMessage({
              noiseFloorUpdate: true,
              noiseFloor: this._noiseFloor,
              openThreshold: this._openThreshold,
            })
          }
        }

        this._preBuffer.push(chunk)
        if (this._preBuffer.length > this._preBufferSize) {
          this._preBuffer.shift()
        }
        const int16 = new Int16Array(chunk.length)
        this.port.postMessage({ buffer: int16.buffer, gate: false }, [int16.buffer])
      }
    }
    return true
  }
}
registerProcessor('voice-stream-processor', VoiceStreamProcessor)
`

let workletBlobUrl: string | null = null
function getWorkletUrl(): string {
  if (!workletBlobUrl) {
    workletBlobUrl = URL.createObjectURL(
      new Blob([WORKLET_CODE], { type: "application/javascript" })
    )
  }
  return workletBlobUrl
}

function buildWsUrl(orgId: string, token: string): string {
  if (!baseApiUrl) throw new Error("API URL not configured")
  const url = new URL(`/orgs/${orgId}/voice-agent`, baseApiUrl)
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:"
  url.searchParams.set("token", token)
  return url.toString()
}

function decodePcmBase64(base64: string): Float32Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const int16 = new Int16Array(bytes.buffer)
  const float32 = new Float32Array(int16.length)
  for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768
  return float32
}

export function useVoiceAgent(orgId?: string) {
  const [status, setStatus] = useState<VoiceAgentStatus>("idle")
  const [userTranscript, setUserTranscript] = useState("")
  const [committedTranscript, setCommittedTranscript] = useState("")
  const [agentText, setAgentText] = useState("")
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false)
  const [audioLevels, setAudioLevels] = useState<number[]>(
    new Array(NUM_BARS).fill(0)
  )
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>(
    []
  )
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ── Refs (mutable state for callbacks) ─────────────────────
  const wsRef = useRef<WebSocket | null>(null)
  const micCtxRef = useRef<AudioContext | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const workletRef = useRef<AudioWorkletNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number>(0)

  const playCtxRef = useRef<AudioContext | null>(null)
  const playQueueRef = useRef<AudioBufferSourceNode[]>([])
  const nextPlayTimeRef = useRef(0)

  const agentTextAccRef = useRef("")
  const speakingRef = useRef(false)
  const deviceIdRef = useRef<string | null>(null)
  const [isMicOpen, setIsMicOpen] = useState(false)
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [noiseFloor, setNoiseFloor] = useState<number | null>(null)
  const noiseGateRef = useRef(0.015)

  useEffect(() => {
    deviceIdRef.current = currentDeviceId
  }, [currentDeviceId])

  // ── Mic helpers ────────────────────────────────────────────

  const stopMic = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = 0
    workletRef.current?.disconnect()
    workletRef.current = null
    micCtxRef.current?.close()
    micCtxRef.current = null
    micStreamRef.current?.getTracks().forEach((t) => t.stop())
    micStreamRef.current = null
    analyserRef.current = null
    setAudioLevels(new Array(NUM_BARS).fill(0))
  }, [])

  const startMic = useCallback(async (deviceId?: string | null) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: SAMPLE_RATE,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
      },
    })
    micStreamRef.current = stream

    const ctx = new AudioContext({ sampleRate: SAMPLE_RATE })
    micCtxRef.current = ctx
    const source = ctx.createMediaStreamSource(stream)

    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.7
    source.connect(analyser)
    analyserRef.current = analyser

    await ctx.audioWorklet.addModule(getWorkletUrl())
    const worklet = new AudioWorkletNode(ctx, "voice-stream-processor")
    workletRef.current = worklet

    // Don't send threshold here — that would lock manual mode. Thresholds follow calibration/recalibrate until the gate slider is used.
    setIsCalibrating(true)
    worklet.port.onmessage = (e: MessageEvent) => {
      const data = e.data as {
        buffer?: ArrayBuffer
        gate?: boolean
        calibrated?: boolean
        noiseFloorUpdate?: boolean
        noiseFloor?: number
        openThreshold?: number
      }
      if (data.calibrated) {
        setIsCalibrating(false)
        setNoiseFloor(data.noiseFloor ?? null)
        return
      }
      if (data.noiseFloorUpdate) {
        setNoiseFloor(data.noiseFloor ?? null)
        return
      }
      if (data.buffer !== undefined) {
        setIsMicOpen(!!data.gate)
        const ws = wsRef.current
        if (ws?.readyState === WebSocket.OPEN) ws.send(data.buffer)
      }
    }
    source.connect(worklet)

    const tick = () => {
      if (!analyserRef.current) return
      const data = new Uint8Array(analyserRef.current.frequencyBinCount)
      analyserRef.current.getByteFrequencyData(data)
      const step = Math.max(1, Math.floor(data.length / NUM_BARS))
      const levels: number[] = []
      for (let i = 0; i < NUM_BARS; i++) levels.push(data[i * step] / 255)
      setAudioLevels(levels)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  // ── TTS playback helpers ───────────────────────────────────

  const flushPlayback = useCallback(() => {
    for (const n of playQueueRef.current) {
      try {
        n.stop()
      } catch {
        /* already stopped */
      }
    }
    playQueueRef.current = []
    nextPlayTimeRef.current = 0
    speakingRef.current = false
    setIsAgentSpeaking(false)
  }, [])

  const scheduleChunk = useCallback((pcm: Float32Array) => {
    const ctx = playCtxRef.current
    if (!ctx) return
    if (ctx.state === "suspended") ctx.resume()

    const buf = ctx.createBuffer(1, pcm.length, SAMPLE_RATE)
    buf.getChannelData(0).set(pcm)

    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(ctx.destination)

    const now = ctx.currentTime
    const t = Math.max(now, nextPlayTimeRef.current)
    src.start(t)
    nextPlayTimeRef.current = t + buf.duration

    playQueueRef.current.push(src)
    src.onended = () => {
      playQueueRef.current = playQueueRef.current.filter((n) => n !== src)
      if (playQueueRef.current.length === 0 && !speakingRef.current) {
        setIsAgentSpeaking(false)
      }
    }
  }, [])

  // ── Connect ────────────────────────────────────────────────

  const connect = useCallback(async () => {
    if (!orgId || wsRef.current) return

    setStatus("connecting")
    setError(null)
    setUserTranscript("")
    setCommittedTranscript("")
    setAgentText("")
    agentTextAccRef.current = ""

    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const inputs = devices.filter((d) => d.kind === "audioinput")
      setAvailableDevices(inputs)
      if (inputs.length > 0 && !deviceIdRef.current) {
        setCurrentDeviceId(inputs[0].deviceId)
        deviceIdRef.current = inputs[0].deviceId
      }

      let token = localStorage.getItem("x-auth-token")
      if (!token) {
        const { data } = await supabase.auth.refreshSession()
        if (data?.session) {
          token = data.session.access_token
          localStorage.setItem("x-auth-token", token)
        }
      }
      if (!token) throw new Error("Not authenticated")

      playCtxRef.current = new AudioContext({ sampleRate: SAMPLE_RATE })

      const ws = new WebSocket(buildWsUrl(orgId, token))
      wsRef.current = ws

      ws.onmessage = async (event: MessageEvent) => {
        let msg: Record<string, unknown>
        try {
          msg = JSON.parse(event.data as string)
        } catch {
          return
        }

        switch (msg.type) {
          case "ready":
            setStatus("connected")
            setError(null)
            try {
              await startMic(deviceIdRef.current)
            } catch {
              setError("Microphone access denied")
              setStatus("error")
            }
            break

          case "transcript_partial":
            setUserTranscript(msg.text as string)
            if (speakingRef.current || playQueueRef.current.length > 0) {
              flushPlayback()
              agentTextAccRef.current = ""
              setAgentText("")
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "interrupt" }))
              }
            }
            break

          case "transcript_committed":
            setCommittedTranscript(msg.text as string)
            setUserTranscript("")
            agentTextAccRef.current = ""
            setAgentText("")
            break

          case "agent_text_delta":
            agentTextAccRef.current += msg.text as string
            setAgentText(agentTextAccRef.current)
            speakingRef.current = true
            setIsAgentSpeaking(true)
            break

          case "agent_text_done":
            agentTextAccRef.current = msg.text as string
            setAgentText(msg.text as string)
            break

          case "tts_audio":
            scheduleChunk(decodePcmBase64(msg.audio_base_64 as string))
            speakingRef.current = true
            setIsAgentSpeaking(true)
            break

          case "tts_done":
            speakingRef.current = false
            if (playQueueRef.current.length === 0) setIsAgentSpeaking(false)
            break

          case "interrupted":
            flushPlayback()
            agentTextAccRef.current = ""
            setAgentText("")
            break

          case "error":
            setError(msg.message as string)
            break
        }
      }

      ws.onerror = () => {
        setError("WebSocket connection failed")
      }

      ws.onclose = (e) => {
        if (!wsRef.current) return
        wsRef.current = null
        stopMic()
        flushPlayback()
        if (e.code === 1008) setError("Authentication failed")
        setStatus(e.wasClean ? "idle" : "error")
      }
    } catch (err) {
      setStatus("error")
      setError(err instanceof Error ? err.message : "Connection failed")
    }
  }, [orgId, startMic, stopMic, scheduleChunk, flushPlayback])

  // ── Disconnect ─────────────────────────────────────────────

  const disconnect = useCallback(() => {
    const ws = wsRef.current
    wsRef.current = null
    if (ws) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "close" }))
      }
      ws.close()
    }
    stopMic()
    flushPlayback()
    playCtxRef.current?.close()
    playCtxRef.current = null
    setStatus("idle")
    setUserTranscript("")
    setCommittedTranscript("")
    setAgentText("")
    agentTextAccRef.current = ""
    setError(null)
  }, [stopMic, flushPlayback])

  // ── Device switch ──────────────────────────────────────────

  const switchDevice = useCallback(
    async (deviceId: string) => {
      setCurrentDeviceId(deviceId)
      deviceIdRef.current = deviceId
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        stopMic()
        try {
          await startMic(deviceId)
        } catch {
          setError("Failed to switch microphone")
        }
      }
    },
    [stopMic, startMic]
  )

  // ── Send config / commit ───────────────────────────────────

  const sendConfig = useCallback(
    (config: { voice_id?: string; language_code?: string }) => {
      const ws = wsRef.current
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "config", ...config }))
      }
    },
    []
  )

  const commit = useCallback(() => {
    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "commit" }))
    }
  }, [])

  const setNoiseGate = useCallback((threshold: number) => {
    noiseGateRef.current = threshold
    workletRef.current?.port.postMessage({ threshold, manual: true })
  }, [])

  const recalibrate = useCallback(() => {
    setIsCalibrating(true)
    setNoiseFloor(null)
    workletRef.current?.port.postMessage({ recalibrate: true })
  }, [])

  // ── Cleanup on unmount ─────────────────────────────────────

  useEffect(
    () => () => {
      const ws = wsRef.current
      wsRef.current = null
      if (ws) {
        if (ws.readyState === WebSocket.OPEN)
          ws.send(JSON.stringify({ type: "close" }))
        ws.close()
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      workletRef.current?.disconnect()
      micCtxRef.current?.close()
      micStreamRef.current?.getTracks().forEach((t) => t.stop())
      playCtxRef.current?.close()
    },
    []
  )

  return {
    status,
    connect,
    disconnect,
    userTranscript,
    committedTranscript,
    agentText,
    isAgentSpeaking,
    audioLevels,
    availableDevices,
    currentDeviceId,
    switchDevice,
    error,
    sendConfig,
    commit,
    isMicOpen,
    isCalibrating,
    noiseFloor,
    setNoiseGate,
    recalibrate,
  }
}
