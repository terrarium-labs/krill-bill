import { useRef, useEffect, useCallback } from "react"

interface Particle {
    theta: number
    phi: number
    baseRadius: number
    speed: number
    offset: number
    freqX: number
    freqY: number
    freqZ: number
    noisePhase: number
    noiseSeed: number
}

interface ParticleSphereProps {
    size?: number
    particleCount?: number
    className?: string
}

function smoothNoise(x: number, seed: number): number {
    const s = Math.sin(x * 127.1 + seed * 311.7) * 43758.5453
    return s - Math.floor(s)
}

function organicNoise(t: number, seed: number): number {
    const i = Math.floor(t)
    const f = t - i
    const u = f * f * (3 - 2 * f)
    return smoothNoise(i, seed) * (1 - u) + smoothNoise(i + 1, seed) * u
}

export default function ParticleSphere({
    size = 200,
    particleCount = 500,
    className,
}: ParticleSphereProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationRef = useRef<number>(0)
    const particlesRef = useRef<Particle[]>([])
    const rotationRef = useRef({ x: 0, y: 0 })

    const initParticles = useCallback(() => {
        const particles: Particle[] = []
        const goldenAngle = Math.PI * (3 - Math.sqrt(5))

        for (let i = 0; i < particleCount; i++) {
            const y = 1 - (i / (particleCount - 1)) * 2
            const theta = goldenAngle * i
            const phi = Math.acos(y)

            particles.push({
                theta,
                phi,
                baseRadius: 0.8 + Math.random() * 0.2,
                speed: 0.3 + Math.random() * 0.7,
                offset: Math.random() * Math.PI * 2,
                freqX: 1 + Math.random() * 3,
                freqY: 1 + Math.random() * 3,
                freqZ: 1 + Math.random() * 2,
                noisePhase: Math.random() * 100,
                noiseSeed: Math.random() * 1000,
            })
        }

        particlesRef.current = particles
    }, [particleCount])

    const render = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const dpr = window.devicePixelRatio || 1
        const w = canvas.width / dpr
        const h = canvas.height / dpr

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.save()
        ctx.scale(dpr, dpr)

        const cx = w / 2
        const cy = h / 2
        const baseR = Math.min(w, h) * 0.32
        const time = performance.now() * 0.001

        rotationRef.current.y += 0.003
        rotationRef.current.x = Math.sin(time * 0.2) * 0.15

        const cosRx = Math.cos(rotationRef.current.x)
        const sinRx = Math.sin(rotationRef.current.x)
        const cosRy = Math.cos(rotationRef.current.y)
        const sinRy = Math.sin(rotationRef.current.y)

        const projected: { x: number; y: number; z: number; alpha: number }[] = []

        for (const p of particlesRef.current) {
            const noise1 = organicNoise(time * 0.4 + p.noisePhase, p.noiseSeed)
            const noise2 = organicNoise(time * 0.7 + p.noisePhase + 50, p.noiseSeed + 100)

            const wave1 = Math.sin(p.phi * p.freqX + time * p.speed + p.offset) * 0.2
            const wave2 = Math.sin(p.theta * p.freqY + time * p.speed * 0.7) * 0.14
            const wave3 = Math.sin((p.phi + p.theta) * p.freqZ + time * p.speed * 1.3) * 0.1
            const pulse = Math.sin(time * 0.6 + p.offset) * 0.07
            const breathe = Math.sin(time * 0.3) * 0.05
            const organic = (noise1 - 0.5) * 0.15 + (noise2 - 0.5) * 0.1

            const r = baseR * p.baseRadius * (1 + wave1 + wave2 + wave3 + pulse + breathe + organic)

            const sinPhi = Math.sin(p.phi)
            const cosPhi = Math.cos(p.phi)
            const sinTheta = Math.sin(p.theta)
            const cosTheta = Math.cos(p.theta)

            const x = r * sinPhi * cosTheta
            const y = r * cosPhi
            const z = r * sinPhi * sinTheta

            const y1 = y * cosRx - z * sinRx
            const z1 = y * sinRx + z * cosRx
            const x1 = x * cosRy + z1 * sinRy
            const z2 = -x * sinRy + z1 * cosRy

            const depth = (z2 + baseR) / (2 * baseR)

            projected.push({
                x: cx + x1,
                y: cy + y1,
                z: z2,
                alpha: 0.15 + depth * 0.85,
            })
        }

        projected.sort((a, b) => a.z - b.z)

        const connectionDist = baseR * 0.25
        const connectionDistSq = connectionDist * connectionDist
        ctx.lineCap = "round"
        for (let i = 0; i < projected.length; i++) {
            const a = projected[i]
            for (let j = i + 1; j < projected.length; j++) {
                const b = projected[j]
                const dx = a.x - b.x
                const dy = a.y - b.y
                const distSq = dx * dx + dy * dy
                if (distSq < connectionDistSq) {
                    const fade = 1 - Math.sqrt(distSq) / connectionDist
                    const avgAlpha = (a.alpha + b.alpha) * 0.5
                    const hue = 155 + (a.z + b.z) * 0.15
                    ctx.beginPath()
                    ctx.moveTo(a.x, a.y)
                    ctx.lineTo(b.x, b.y)
                    ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${fade * avgAlpha * 0.25})`
                    ctx.lineWidth = 0.5
                    ctx.stroke()
                }
            }
        }

        for (const pt of projected) {
            const hue = 155 + pt.z * 0.3 + Math.sin(time + pt.x * 0.01) * 15
            const saturation = 60 + pt.alpha * 30
            const lightness = 45 + pt.alpha * 30
            const dotSize = 0.6 + pt.alpha * 0.8

            ctx.beginPath()
            ctx.arc(pt.x, pt.y, dotSize, 0, Math.PI * 2)
            ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${pt.alpha * 0.9})`
            ctx.fill()
        }

        ctx.restore()
        animationRef.current = requestAnimationFrame(render)
    }, [])

    useEffect(() => {
        initParticles()
    }, [initParticles])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const dpr = window.devicePixelRatio || 1
        canvas.width = size * dpr
        canvas.height = size * dpr
        canvas.style.width = `${size}px`
        canvas.style.height = `${size}px`

        animationRef.current = requestAnimationFrame(render)

        return () => {
            cancelAnimationFrame(animationRef.current)
        }
    }, [size, render])

    return null;

    // return (
    //     <canvas
    //         ref={canvasRef}
    //         className={className}
    //         style={{ width: size, height: size }}
    //     />
    // )
}
