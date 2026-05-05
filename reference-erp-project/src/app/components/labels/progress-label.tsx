import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProgressLabelHide = "percentage" | "counter" | "counter-error";

/** Use `"all"` to hide counter, percentage, and error badge (bar only). */
export type ProgressLabelHideInput =
    | ProgressLabelHide
    | readonly (ProgressLabelHide | "all")[]
    | "all";

export type ProgressLabelVariant = "default" | "color";

export interface ProgressLabelProps {
    /** `[current, max]` or `[current, max, errors]` — third value is error count (red segment from the right). */
    data: readonly [number, number] | readonly [number, number, number];
    /** Hide parts of the label, or `"all"` for bar only. */
    hide?: ProgressLabelHideInput;
    /** Tailwind classes for the progress bar width (and optional height), e.g. `w-full`, `min-w-[10rem]`. */
    size?: string;
    variant?: ProgressLabelVariant;
    className?: string;
}

const ALL_HIDDEN: ProgressLabelHide[] = ["percentage", "counter", "counter-error"];

function normalizeHide(hide: ProgressLabelProps["hide"]): Set<ProgressLabelHide> {
    if (hide == null) return new Set();
    if (hide === "all") return new Set(ALL_HIDDEN);
    const arr = Array.isArray(hide) ? hide : [hide];
    if (arr.includes("all")) return new Set(ALL_HIDDEN);
    return new Set(arr.filter((x): x is ProgressLabelHide => Boolean(x) && x !== "all"));
}

function segmentForPercent(percent: number): "low" | "mid" | "high" {
    if (percent <= 100 / 3) return "low";
    if (percent <= (200 / 3)) return "mid";
    return "high";
}

function progressBarStyles(
    percent: number,
    variant: ProgressLabelVariant,
    hasErrors: boolean,
): { track: string; fill: string } {
    if (variant === "default") {
        return { track: "bg-primary/20", fill: "bg-primary" };
    }
    // color: pending (track only — neither completed nor error) matches default; fills carry the hue
    const pendingTrack = "bg-primary/20";
    if (hasErrors) {
        return { track: pendingTrack, fill: "bg-emerald-500 dark:bg-emerald-500/70" };
    }
    const seg = segmentForPercent(percent);
    if (seg === "low") return { track: pendingTrack, fill: "bg-red-500 dark:bg-red-500/70" };
    if (seg === "mid") return { track: pendingTrack, fill: "bg-amber-500 dark:bg-amber-500/70" };
    return { track: pendingTrack, fill: "bg-emerald-500 dark:bg-emerald-500/70" };
}

const ProgressLabel = ({
    data,
    hide,
    size = "w-full",
    variant = "default",
    className,
}: ProgressLabelProps) => {
    const [rawCurrent, rawMax] = data;
    const current = Math.max(0, rawCurrent);
    const max = Math.max(0, rawMax);
    const error = Math.max(0, data.length >= 3 ? (data as readonly [number, number, number])[2] : 0);
    const hasErrors = error > 0;
    const hideSet = normalizeHide(hide);
    const showCounter = !hideSet.has("counter");
    const showPercentage = !hideSet.has("percentage");
    const showErrorBadge = hasErrors && !hideSet.has("counter-error");

    if (max <= 0) {
        return <span className="text-xs text-muted-foreground">—</span>;
    }

    const percent = Math.min(100, (current / max) * 100);
    const errorPercent = Math.min(100, (error / max) * 100);
    const roundedPct = Math.round(percent);
    const { track, fill } = progressBarStyles(percent, variant, hasErrors);

    const errorBadge = (
        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-600 tabular-nums dark:text-red-500">
            <AlertTriangle className="size-3 shrink-0" aria-hidden />
            <span>{error}</span>
        </span>
    );

    return (
        <div className={cn("flex flex-col gap-1 pr-2", "min-w-[140px]", className)}>
            {(showCounter || showPercentage || showErrorBadge) && (
                <div className="flex items-center gap-2">
                    {showCounter && (
                        <span className="text-xs font-medium whitespace-nowrap tabular-nums">
                            {current}/{max}
                        </span>
                    )}
                    {showPercentage && (
                        <span className="text-xs text-muted-foreground tabular-nums inline-flex items-center gap-1.5">
                            ({roundedPct}%)
                            {showErrorBadge && errorBadge}
                        </span>
                    )}
                    {!showPercentage && showErrorBadge && errorBadge}
                </div>
            )}
            <div
                className={cn(
                    "relative h-1.5 overflow-hidden rounded-full",
                    track,
                    size,
                )}
            >
                <div
                    className={cn("absolute top-0 left-0 h-full transition-[width]", fill)}
                    style={{ width: `${percent}%` }}
                />
                {errorPercent > 0 && (
                    <div
                        className="absolute top-0 right-0 z-10 h-full bg-red-500 transition-[width] dark:bg-red-500/70"
                        style={{ width: `${errorPercent}%` }}
                    />
                )}
            </div>
        </div>
    );
};

export default ProgressLabel;
