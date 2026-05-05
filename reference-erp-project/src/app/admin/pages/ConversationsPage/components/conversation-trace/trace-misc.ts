import type { TraceCall } from "./trace-types";
import { getColorClasses } from "@/utils/miscelanea";

export type StepIconStyle = {
    className: string;
};

type StepColorKey = "blue" | "emerald" | "violet" | "amber" | "cyan";

type RegistryEntry = {
    icon: string;
    color: StepColorKey;
};

const COLOR_STYLES: Record<StepColorKey, StepIconStyle> = {
    blue: { className: getColorClasses("blue") },
    emerald: { className: getColorClasses("emerald") },
    violet: { className: getColorClasses("violet") },
    amber: { className: getColorClasses("amber") },
    cyan: { className: getColorClasses("cyan") },
};

const STEP_TYPES: Record<string, RegistryEntry> = {
    llm: { icon: "lucide:cpu", color: "blue" },
    tool: { icon: "lucide:function-square", color: "emerald" },
    agent: { icon: "lucide:brain-circuit", color: "violet" },
    workflow: { icon: "lucide:workflow", color: "amber" },
    readskill: { icon: "lucide:wrench", color: "cyan" },
};

const LLM_PROVIDER_ICONS: Record<string, string> = {
    openai: "ri:openai-fill",
    anthropic: "ri:claude-line",
    google: "ri:google-fill",
    azure: "ri:microsoft-fill",
    aws: "ri:amazon-fill",
};

const FALLBACK_ENTRY: RegistryEntry = {
    icon: "lucide:box",
    color: "blue",
};

const FALLBACK_ICON_STYLE: StepIconStyle = {
    className: "bg-muted border-border text-muted-foreground",
};

function resolveEntry(step: TraceCall): RegistryEntry {
    try {
        const raw = step.metadata?.type;
        const type = typeof raw === "string" ? raw.toLowerCase() : "";
        return STEP_TYPES[type] || FALLBACK_ENTRY;
    } catch {
        return FALLBACK_ENTRY;
    }
}

export function formatTraceDurationMs(ms: number | undefined): string {
    const n = Number(ms);
    if (!Number.isFinite(n) || n < 0) return "—";
    if (n > 999) return `${(n / 1000).toFixed(1)}s`;
    return `${Math.round(n)}ms`;
}

export type ResolvedStepIcon = { icon: string } | { customIcon: string; icon?: string };

export function resolveStepIcon(step: TraceCall): ResolvedStepIcon {
    try {
        const raw = step.metadata?.type;
        const type = typeof raw === "string" ? raw.toLowerCase() : "";
        const entry = STEP_TYPES[type];
        if (!entry) return { icon: FALLBACK_ENTRY.icon };

        if (type === "llm") {
            const provider = step.metadata?.model_provider;
            if (typeof provider === "string") {
                const pIcon = LLM_PROVIDER_ICONS[provider];
                if (pIcon) return { icon: pIcon };
            }
        }

        return { icon: entry.icon };
    } catch {
        return { icon: FALLBACK_ENTRY.icon };
    }
}

/** Soft bar fill (Tag-style) for waterfall timeline segments. */
export function getStepWaterfallBarClassName(step: TraceCall): string {
    if (step.error) return getColorClasses("red");
    const entry = resolveEntry(step);
    return getColorClasses(entry.color);
}

export function getStepIconStyle(step: TraceCall): StepIconStyle {
    const entry = resolveEntry(step);
    return COLOR_STYLES[entry.color] ?? FALLBACK_ICON_STYLE;
}
