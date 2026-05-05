import { memo, useMemo } from "react";
import { Icon } from "@iconify/react";
import type { TFunction } from "i18next";
import { cn } from "@/lib/utils";
import type { TraceCall } from "./trace-types";
import {
    formatTraceDurationMs,
    getStepWaterfallBarClassName,
} from "./trace-misc";
import StepIcon from "./step-icon";

const WaterfallView = memo(function WaterfallView({
    rootCall,
    selectedStep,
    onStepSelect,
    t,
    collapsedNodes,
    toggleCollapse,
}: {
    rootCall: TraceCall | null;
    selectedStep: TraceCall | null;
    onStepSelect: (step: TraceCall) => void;
    t: TFunction;
    collapsedNodes: Set<string>;
    toggleCollapse: (id: string) => void;
}) {
    const flatSteps = useMemo(() => {
        const result: (TraceCall & { _depth: number })[] = [];
        const walk = (node: TraceCall, depth: number) => {
            result.push({ ...node, _depth: depth });
            if (node.children && !collapsedNodes.has(node.call_id)) {
                node.children.forEach((child) => walk(child, depth + 1));
            }
        };
        if (rootCall) walk(rootCall, 0);
        return result;
    }, [rootCall, collapsedNodes]);

    const selectedChildIds = useMemo(() => {
        if (!selectedStep?.children?.length) return new Set<string>();
        const ids = new Set<string>();
        const walk = (node: TraceCall) => {
            if (node.children)
                node.children.forEach((child) => {
                    ids.add(child.call_id);
                    walk(child);
                });
        };
        walk(selectedStep);
        return ids;
    }, [selectedStep]);

    const globalT0 = Number(rootCall?.start_time ?? rootCall?.t0 ?? 0);
    const globalT1 = Number(rootCall?.end_time ?? rootCall?.t1 ?? 0);
    const baseDuration = globalT1 - globalT0;

    const labelOverflowPct = useMemo(() => {
        if (!rootCall || baseDuration <= 0) return 0;
        let maxEndPct = 0;
        const walk = (node: TraceCall) => {
            const startPct =
                (((Number(node.start_time ?? node.t0) || 0) - globalT0) /
                    baseDuration) *
                100;
            const widthPct =
                (((Number(node.end_time ?? node.t1) || 0) -
                    (Number(node.start_time ?? node.t0) || 0)) /
                    baseDuration) *
                100;
            if (widthPct < 15) {
                const labelEndPct =
                    startPct + Math.max(widthPct, 0.4) + 65;
                maxEndPct = Math.max(maxEndPct, labelEndPct);
            }
            if (node.children && !collapsedNodes.has(node.call_id)) {
                node.children.forEach(walk);
            }
        };
        walk(rootCall);
        return Math.max(0, maxEndPct - 100);
    }, [rootCall, baseDuration, globalT0, collapsedNodes]);

    const totalDuration =
        labelOverflowPct > 0
            ? baseDuration * (1 + labelOverflowPct / 100)
            : baseDuration;

    if (baseDuration <= 0)
        return (
            <div className="p-4 text-sm text-muted-foreground">
                {t(
                    "conversations.trace.no_timing",
                    "No timing data",
                )}
            </div>
        );

    const divisions = 4;
    const timePoints = Array.from(
        { length: divisions + 1 },
        (_, i) => Math.round((totalDuration * i) / divisions),
    );

    return (
        <div className="flex h-full flex-col">
            <div className="relative mx-5 h-8 border-b border-border">
                {timePoints.map((time, i) => (
                    <span
                        key={i}
                        className="absolute -translate-x-1/2 text-xs text-muted-foreground"
                        style={{ left: `${(i / divisions) * 100}%`, top: 4 }}
                    >
                        {formatTraceDurationMs(time)}
                    </span>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-1">
                {flatSteps.map((step) => {
                    const isSelected =
                        selectedStep?.call_id === step.call_id;
                    const isChildOfSelected = selectedChildIds.has(
                        step.call_id,
                    );
                    const hasChildren = step.children?.length > 0;
                    const hasError = !!step.error;
                    const isCollapsed = collapsedNodes.has(step.call_id);
                    const startPct =
                        (((Number(step.start_time ?? step.t0) || 0) -
                            globalT0) /
                            totalDuration) *
                        100;
                    let widthPct =
                        (((Number(step.end_time ?? step.t1) || 0) -
                            (Number(step.start_time ?? step.t0) || 0)) /
                            totalDuration) *
                        100;
                    if (step._depth === 0 && labelOverflowPct > 0) {
                        widthPct = 100 - startPct;
                    }
                    const stepName = step.path
                        ? step.path.split(".").pop()
                        : t(
                              "conversations.trace.unknown",
                              "Unknown",
                          );

                    const rowBg = isSelected
                        ? "bg-muted/90"
                        : isChildOfSelected
                          ? "bg-muted/50"
                          : "hover:bg-muted/40";

                    return (
                        <div
                            key={step.call_id}
                            data-call-id={step.call_id}
                            className={`relative h-9 cursor-pointer rounded transition-colors ${rowBg}`}
                            onClick={() => onStepSelect(step)}
                        >
                            {timePoints.map((_, ti) => (
                                <div
                                    key={ti}
                                    className="absolute top-0 bottom-0 w-px bg-muted"
                                    style={{
                                        left: `${(ti / divisions) * 100}%`,
                                    }}
                                />
                            ))}

                            <div
                                className={cn(
                                    "absolute top-1.5 h-6 rounded border",
                                    getStepWaterfallBarClassName(step),
                                    widthPct >= 15 &&
                                        "flex items-center gap-1 overflow-hidden px-2",
                                )}
                                style={{
                                    left: `${startPct}%`,
                                    width: `${Math.max(widthPct, 0.4)}%`,
                                }}
                            >
                                {widthPct >= 15 && (
                                    <>
                                        {hasError ? (
                                            <Icon
                                                icon="lucide:alert-circle"
                                                className="h-3 w-3 shrink-0 opacity-90"
                                            />
                                        ) : (
                                            <StepIcon
                                                step={step}
                                                className="h-3 w-3 shrink-0 opacity-90"
                                            />
                                        )}
                                        <span className="truncate text-xs font-medium">
                                            {stepName}
                                        </span>
                                        <span className="shrink-0 text-xs opacity-80">
                                            {formatTraceDurationMs(
                                                step.duration,
                                            )}
                                        </span>
                                        {hasChildren ? (
                                            <button
                                                type="button"
                                                className="ml-auto flex h-4 w-4 shrink-0 items-center justify-center"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleCollapse(
                                                        step.call_id,
                                                    );
                                                }}
                                            >
                                                <Icon
                                                    icon={
                                                        isCollapsed
                                                            ? "lucide:chevron-right"
                                                            : "lucide:chevron-down"
                                                    }
                                                    className="h-3 w-3 opacity-70"
                                                />
                                            </button>
                                        ) : null}
                                    </>
                                )}
                            </div>
                            {widthPct < 15 && (
                                <div
                                    className="pointer-events-none absolute top-1.5 flex h-6 items-center gap-1.5 whitespace-nowrap"
                                    style={{
                                        left: `${startPct + Math.max(widthPct, 0.4) + 0.5}%`,
                                    }}
                                >
                                    {hasError ? (
                                        <Icon
                                            icon="lucide:alert-circle"
                                            className="h-3 w-3 shrink-0 text-red-900 dark:text-red-100"
                                        />
                                    ) : (
                                        <StepIcon
                                            step={step}
                                            className="h-3 w-3 shrink-0 text-foreground/80"
                                        />
                                    )}
                                    <span className="text-xs font-normal text-foreground">
                                        {stepName}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatTraceDurationMs(
                                            step.duration,
                                        )}
                                    </span>
                                    {hasChildren ? (
                                        <button
                                            type="button"
                                            className="pointer-events-auto flex h-4 w-4 shrink-0 items-center justify-center"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleCollapse(
                                                    step.call_id,
                                                );
                                            }}
                                        >
                                            <Icon
                                                icon={
                                                    isCollapsed
                                                        ? "lucide:chevron-right"
                                                        : "lucide:chevron-down"
                                                }
                                                className="h-3 w-3 text-muted-foreground"
                                            />
                                        </button>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

export default WaterfallView;
