import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PhoneOff, Mic, Settings2, MicOff, RotateCw, RefreshCw } from "lucide-react"
import { useVoiceAgent, VoiceAgentStatus } from "@/hooks/use-voice-agent"
import { useParams } from "react-router-dom"
import { cn } from "@/lib/utils"

interface VoiceModeProps {
  open: boolean
  onClose: () => void
}

type LogEntry = {
  ts: number
  type: string
  text: string
}

const STATUS_COLORS: Record<VoiceAgentStatus, string> = {
  idle: "bg-muted-foreground",
  connecting: "bg-yellow-500 animate-pulse",
  connected: "bg-green-500",
  error: "bg-destructive",
}

export default function VoiceMode({ open, onClose }: VoiceModeProps) {
  const { orgId } = useParams()
  const {
    status,
    connect,
    disconnect,
    switchDevice,
    userTranscript,
    committedTranscript,
    agentText,
    isAgentSpeaking,
    audioLevels,
    availableDevices,
    currentDeviceId,
    error,
    sendConfig,
    commit,
    isMicOpen,
    isCalibrating,
    noiseFloor,
    setNoiseGate,
    recalibrate,
  } = useVoiceAgent(orgId)

  const [showConfig, setShowConfig] = useState(true)
  const [noiseThreshold, setNoiseThreshold] = useState(0.024)
  const [voiceId, setVoiceId] = useState("H6bZE3vdUcn6ksY6zH1x")
  const [languageCode, setLanguageCode] = useState("es")
  const [logs, setLogs] = useState<LogEntry[]>([])
  const logsEndRef = useRef<HTMLDivElement>(null)
  const prevCommittedRef = useRef("")
  const prevAgentTextRef = useRef("")

  const addLog = (type: string, text: string) => {
    setLogs((prev) => [...prev.slice(-99), { ts: Date.now(), type, text }])
  }

  useEffect(() => {
    if (open && status === "idle") connect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    addLog("status", status)
  }, [status])

  useEffect(() => {
    if (error) addLog("error", error)
  }, [error])

  useEffect(() => {
    if (!isCalibrating && noiseFloor !== null) {
      addLog("config", `calibrated — noise floor: ${noiseFloor.toFixed(4)}`)
    }
  }, [isCalibrating, noiseFloor])

  useEffect(() => {
    if (committedTranscript && committedTranscript !== prevCommittedRef.current) {
      addLog("user", committedTranscript)
      prevCommittedRef.current = committedTranscript
    }
  }, [committedTranscript])

  useEffect(() => {
    if (!isAgentSpeaking && agentText && agentText !== prevAgentTextRef.current) {
      addLog("agent", agentText)
      prevAgentTextRef.current = agentText
    }
  }, [isAgentSpeaking, agentText])

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  const handleClose = () => {
    disconnect()
    setLogs([])
    prevCommittedRef.current = ""
    prevAgentTextRef.current = ""
    onClose()
  }

  const handleApplyConfig = () => {
    sendConfig({ voice_id: voiceId, language_code: languageCode })
    addLog("config", `voice=${voiceId.slice(0, 8)}… lang=${languageCode}`)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in fade-in duration-200">
      {/* Header bar */}
      <div className="flex items-center justify-between p-3 border-b shrink-0">
        <div className="flex items-center gap-3">
          <div className={cn("h-2.5 w-2.5 rounded-full", STATUS_COLORS[status])} />
          <span className="text-sm font-medium capitalize">{status}</span>
          {isAgentSpeaking && (
            <span className="text-xs text-primary animate-pulse">speaking</span>
          )}
          {status === "connected" && isCalibrating && (
            <span className="text-xs text-yellow-500 animate-pulse flex items-center gap-1">
              <RefreshCw className="h-3 w-3 animate-spin" />
              calibrating…
            </span>
          )}
          {status === "connected" && !isCalibrating && (
            <span className={cn("text-xs flex items-center gap-1", isMicOpen ? "text-green-500" : "text-muted-foreground/50")}>
              {isMicOpen ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
              {isMicOpen ? "gate open" : "gate closed"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {availableDevices.length > 0 && (
            <Select
              value={currentDeviceId ?? ""}
              onValueChange={switchDevice}
            >
              <SelectTrigger className="w-48 h-8 text-xs">
                <Mic className="h-3 w-3 shrink-0 mr-1" />
                <SelectValue placeholder="Microphone" />
              </SelectTrigger>
              <SelectContent>
                {availableDevices.map((d) => (
                  <SelectItem key={d.deviceId} value={d.deviceId}>
                    {d.label || `Mic ${d.deviceId.slice(0, 8)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowConfig((p) => !p)}
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Config panel */}
      {showConfig && (
        <div className="flex items-center gap-3 px-3 py-2 border-b bg-muted/30 shrink-0">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs whitespace-nowrap">Language</Label>
            <Input
              value={languageCode}
              onChange={(e) => setLanguageCode(e.target.value)}
              className="h-7 w-16 text-xs"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Label className="text-xs whitespace-nowrap">Voice ID</Label>
            <Input
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              className="h-7 w-48 text-xs font-mono"
            />
          </div>
          <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={handleApplyConfig}>
            Apply
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={commit}>
            Force Commit
          </Button>
          <div className="flex items-center gap-1.5 ml-2 border-l pl-3">
            <Label className="text-xs whitespace-nowrap">Noise Gate</Label>
            <input
              type="range"
              min={0}
              max={0.1}
              step={0.001}
              value={noiseThreshold}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                setNoiseThreshold(v)
                setNoiseGate(v)
              }}
              className="w-24 h-1 accent-primary"
            />
            <span className="text-xs font-mono w-10 text-muted-foreground">{noiseThreshold.toFixed(3)}</span>
          </div>
          <div className="flex items-center gap-1.5 ml-2 border-l pl-3">
            {noiseFloor !== null && (
              <span className="text-xs font-mono text-muted-foreground">
                floor: {noiseFloor.toFixed(4)}
              </span>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={recalibrate}
              disabled={isCalibrating}
            >
              <RefreshCw className={cn("h-3 w-3 mr-1", isCalibrating && "animate-spin")} />
              Recalibrate
            </Button>
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col items-center overflow-hidden">
        {/* Audio level visualizer */}
        <div className="flex items-end justify-center gap-[2px] h-16 px-4 pt-4 shrink-0">
          {audioLevels.map((level, i) => (
            <div
              key={i}
              className={cn(
                "w-1 rounded-full transition-all duration-75",
                isAgentSpeaking ? "bg-primary/60" : "bg-muted-foreground/40"
              )}
              style={{ height: `${Math.max(2, level * 48)}px` }}
            />
          ))}
        </div>

        {/* Live transcript area */}
        <div className="w-full max-w-lg px-6 py-4 space-y-2 text-center shrink-0">
          {userTranscript && (
            <p className="text-sm text-muted-foreground italic animate-in fade-in duration-150">
              {userTranscript}
            </p>
          )}
          {agentText && (
            <p className={cn(
              "text-sm leading-relaxed animate-in fade-in duration-150",
              isAgentSpeaking && "text-primary"
            )}>
              {agentText}
            </p>
          )}
          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}
        </div>

        {/* Event log */}
        <div className="flex-1 w-full max-w-2xl overflow-y-auto border-t bg-muted/20 px-4 py-2">
          <div className="space-y-1">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-2 text-xs font-mono">
                <span className="text-muted-foreground shrink-0 tabular-nums">
                  {new Date(log.ts).toLocaleTimeString()}
                </span>
                <span
                  className={cn(
                    "shrink-0 w-14 text-right",
                    log.type === "error" && "text-destructive",
                    log.type === "user" && "text-muted-foreground",
                    log.type === "agent" && "text-primary",
                    log.type === "status" && "text-yellow-600",
                    log.type === "config" && "text-blue-500"
                  )}
                >
                  [{log.type}]
                </span>
                <span className="break-all">{log.text}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-center gap-4 p-4 border-t shrink-0">
        {(status === "error" || status === "idle") && (
          <Button
            variant="outline"
            size="lg"
            className="rounded-full h-12 w-12 p-0 cursor-pointer"
            onClick={() => { disconnect(); connect() }}
          >
            <RotateCw className="h-5 w-5" />
          </Button>
        )}
        <Button
          variant="destructive"
          size="lg"
          className="rounded-full h-12 w-12 p-0 cursor-pointer"
          onClick={handleClose}
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
