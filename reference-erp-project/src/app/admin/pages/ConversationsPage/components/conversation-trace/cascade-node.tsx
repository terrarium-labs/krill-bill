import { memo, useCallback } from "react";
import { Icon } from "@iconify/react";
import type { TFunction } from "i18next";
import type { TraceCall } from "./trace-types";
import {
    formatTraceDurationMs,
    getStepIconStyle,
} from "./trace-misc";
import StepIcon from "./step-icon";
import { getActualModel, getTokenCount } from "./trace-utils";
import { cn } from "@/lib/utils";
import { getColorClasses } from "@/utils/miscelanea";

type CascadeNodeProps = {
    step: TraceCall;
    selectedStep: TraceCall | null;
    onStepSelect: (step: TraceCall) => void;
    t: TFunction;
    collapsedNodes: Set<string>;
    toggleCollapse: (id: string) => void;
    displaySettings: {
        showLatency: boolean;
        showModel: boolean;
        showTokens: boolean;
    };
    selectedChildIds: Set<string>;
};

const CascadeNode = memo(function CascadeNode({
    step,
    selectedStep,
    onStepSelect,
    t,
    collapsedNodes,
    toggleCollapse,
    displaySettings,
    selectedChildIds,
}: CascadeNodeProps) {
    const isSelected = selectedStep?.call_id === step.call_id;
    const isChildOfSelected = selectedChildIds.has(step.call_id);
    const hasChildren = step.children?.length > 0;
    const isCollapsed = collapsedNodes.has(step.call_id);
    const tokens = getTokenCount(step);
    const modelName = getActualModel(step);
    const hasError = !!step.error;
    const iconStyle = hasError
        ? { className: getColorClasses("red") }
        : getStepIconStyle(step);

    const handleClick = useCallback(
        () => onStepSelect(step),
        [step, onStepSelect],
    );
    const handleToggle = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            toggleCollapse(step.call_id);
        },
        [step.call_id, toggleCollapse],
    );

    const duration =
        typeof step.duration === "number"
            ? step.duration
            : Number(step.end_time ?? step.t1) -
              Number(step.start_time ?? step.t0);

    const metaTagClass = cn(
        "flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-xs font-normal",
        hasError
            ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            : "bg-muted text-muted-foreground",
    );

    return (
        <div>
            <div
                className="group relative cursor-pointer"
                onClick={handleClick}
                role="treeitem"
                aria-selected={isSelected}
                data-call-id={step.call_id}
            >
                {isSelected ? (
                    <div className="absolute inset-y-0 -left-[9999px] -right-[9999px] bg-muted/80" />
                ) : isChildOfSelected ? (
                    <div className="absolute inset-y-0 -left-[9999px] -right-[9999px] bg-muted/40" />
                ) : null}
                <div className="relative flex items-center gap-2 py-1.5 pr-3 pl-3">
                    <div
                        className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md border", iconStyle.className)}
                    >
                        <StepIcon
                            step={step}
                            className="h-3.5 w-3.5"
                        />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-center gap-1.5">
                            <span
                                className={`truncate text-sm ${hasError ? "text-red-600 dark:text-red-400" : ""} ${isSelected ? "font-medium text-foreground" : ""}`}
                            >
                                {step.path
                                    ? step.path.split(".").pop()
                                    : t(
                                          "conversations.trace.unknown",
                                          "Unknown",
                                      )}
                            </span>
                            {hasError ? (
                                <Icon
                                    icon="lucide:alert-circle"
                                    className="h-3.5 w-3.5 shrink-0 text-red-500"
                                />
                            ) : null}
                            {displaySettings.showModel && modelName ? (
                                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                                    {modelName}
                                </span>
                            ) : null}
                            {displaySettings.showLatency ? (
                                <span className={metaTagClass}>
                                    <Icon
                                        icon="lucide:clock"
                                        className="h-3 w-3 shrink-0"
                                    />
                                    <span className="tabular-nums">
                                        {formatTraceDurationMs(duration)}
                                    </span>
                                </span>
                            ) : null}
                            {displaySettings.showTokens && tokens != null ? (
                                <span className={metaTagClass}>
                                    <span className="tabular-nums">
                                        {tokens.toLocaleString()}{" "}
                                        {t(
                                            "conversations.trace.tok",
                                            "tok",
                                        )}
                                    </span>
                                </span>
                            ) : null}
                        </div>
                        {step.cost_usd != null &&
                        typeof step.cost_usd === "number" &&
                        step.cost_usd > 0 ? (
                            <div
                                className={`text-xs tabular-nums ${hasError ? "text-red-500" : "text-muted-foreground"}`}
                            >
                                ${step.cost_usd.toFixed(4)}
                            </div>
                        ) : null}
                    </div>

                    {hasChildren ? (
                        <button
                            type="button"
                            onClick={handleToggle}
                            className="mr-2 flex h-6 w-6 shrink-0 items-center justify-center"
                        >
                            <Icon
                                icon={
                                    isCollapsed
                                        ? "lucide:chevron-right"
                                        : "lucide:chevron-down"
                                }
                                className="h-3.5 w-3.5 text-muted-foreground"
                            />
                        </button>
                    ) : null}
                </div>
            </div>

            {hasChildren && !isCollapsed ? (
                <div className="ml-[13px]">
                    {step.children.map((child, idx) => {
                        const isChildSelected =
                            selectedStep?.call_id === child.call_id;
                        const baseColor = child.error
                            ? "border-red-300 dark:border-red-700"
                            : "border-border";
                        const lColor = child.error
                            ? "border-red-300 dark:border-red-700"
                            : isChildSelected
                              ? "border-foreground/40"
                              : "border-border";
                        return (
                            <div key={child.call_id} className="relative pl-[19px]">
                                {idx < step.children.length - 1 ? (
                                    <div
                                        className={`absolute top-0 bottom-0 left-0 border-l ${baseColor}`}
                                    />
                                ) : null}
                                <div
                                    className={`absolute top-0 left-0 h-[20px] w-[19px] rounded-bl-lg border-b border-l ${lColor}`}
                                />
                                <CascadeNode
                                    step={child}
                                    selectedStep={selectedStep}
                                    onStepSelect={onStepSelect}
                                    t={t}
                                    collapsedNodes={collapsedNodes}
                                    toggleCollapse={toggleCollapse}
                                    displaySettings={displaySettings}
                                    selectedChildIds={selectedChildIds}
                                />
                            </div>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
});

export default CascadeNode;
