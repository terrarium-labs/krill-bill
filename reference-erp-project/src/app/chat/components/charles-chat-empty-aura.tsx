import { useAgent, useMaybeSessionContext } from "@livekit/components-react"
import { useTheme } from "next-themes"
import { AgentAudioVisualizerAura } from "@/components/agents-ui/agent-audio-visualizer-aura"
import { cn } from "@/lib/utils"

/** Teal-green base; higher shift lets layers drift toward cyan / deeper aqua in the shader. */
const AURA_COLOR = "#0400ff" as const
const AURA_COLOR_SHIFT = 1

function themeModeFromResolved(resolved: string | undefined): "dark" | "light" {
  return resolved === "dark" ? "dark" : "light"
}

type VisualizerSize = "xl" | "icon"

function CharlesAgentAuraWithSession({
  className,
  visualizerSize,
}: {
  className?: string
  visualizerSize: VisualizerSize
}) {
  const { resolvedTheme } = useTheme()
  const agent = useAgent()

  const mic =
    "microphoneTrack" in agent ? agent.microphoneTrack : undefined

  return (
    <AgentAudioVisualizerAura
      size={visualizerSize}
      color={AURA_COLOR}
      colorShift={AURA_COLOR_SHIFT}
      state={agent.state}
      themeMode={themeModeFromResolved(resolvedTheme)}
      audioTrack={mic}
      className={className}
    />
  )
}

function CharlesAgentAura({
  className,
  visualizerSize,
}: {
  className?: string
  visualizerSize: VisualizerSize
}) {
  const { resolvedTheme } = useTheme()
  const session = useMaybeSessionContext()

  if (session) {
    return (
      <CharlesAgentAuraWithSession
        className={className}
        visualizerSize={visualizerSize}
      />
    )
  }

  return (
    <AgentAudioVisualizerAura
      size={visualizerSize}
      color={AURA_COLOR}
      colorShift={AURA_COLOR_SHIFT}
      state="idle"
      themeMode={themeModeFromResolved(resolvedTheme)}
      className={className}
    />
  )
}

type CharlesChatEmptyAuraProps = {
  fullscreen: boolean
}

/**
 * Shadcn agents-ui aura visualizer for the empty chat state. Uses LiveKit `useAgent` when a
 * session exists; otherwise shows a calm idle animation (no session context required).
 */
export function CharlesChatEmptyAura({ fullscreen }: CharlesChatEmptyAuraProps) {
  const className = cn(
    "aspect-square shrink-0 overflow-hidden rounded-full",
    fullscreen ? "size-[500px]" : "size-[300px]"
  )

  return (
    <CharlesAgentAura className={className} visualizerSize="xl" />
  )
}

type CharlesAuraCircleProps = {
  className?: string
}

/**
 * Mini AgentAudioVisualizerAura clipped to a circle (replaces static avatar in chrome, trigger, messages).
 */
export function CharlesAuraCircle({ className }: CharlesAuraCircleProps) {
  return (
    <CharlesAgentAura
      visualizerSize="icon"
      className={cn(
        "aspect-square shrink-0 overflow-hidden rounded-full ring-2 ring-background/50",
        "size-8 min-h-0",
        className
      )}
    />
  )
}
