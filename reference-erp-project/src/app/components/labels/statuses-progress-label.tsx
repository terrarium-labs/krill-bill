import React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { IconType } from "@/types/miscelanea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { StatusString } from "@/types/general/status";
import { Status, StatusCategory, StatusTemplate } from "@/types/general/status-templates";
import StatusLabel from "@/app/components/labels/status-label";
import { getColorClasses, getTextColorClasses } from "@/utils/miscelanea";
import { Check } from "lucide-react";

/** Statuses can be template+status object or same as StatusLabel (Status, string, or { name?, color? }) */
type StatusesData =
    | { template: StatusTemplate | null; status: Status }
    | Status
    | StatusString
    | { name?: string; color?: string }
    | null
    | undefined;

const categoryOrder: StatusCategory[] = ["not_started", "active", "done", "closed"];
const defaultCategoryColors: Record<StatusCategory, string> = {
    not_started: "yellow",
    active: "green",
    done: "blue",
    closed: "red",
};

function hasTemplateAndStatus(
    data: StatusesData
): data is { template: StatusTemplate; status: Status } {
    return (
        typeof data === "object" &&
        data !== null &&
        "template" in data &&
        "status" in data &&
        Array.isArray((data as any).template?.statuses) &&
        typeof (data as any).status?.category === "string"
    );
}

function getCategoryLabel(category: StatusCategory, t: (key: string, fallback: string) => string): string {
    switch (category) {
        case "not_started":
            return t("workOrders.statusCategory.notStarted", "Not Started");
        case "active":
            return t("workOrders.statusCategory.active", "Active");
        case "done":
            return t("workOrders.statusCategory.done", "Done");
        case "closed":
            return t("workOrders.statusCategory.closed", "Closed");
        default:
            return category;
    }
}

interface StatusesLabelProps {
    data: StatusesData;
    variant?: "default" | "icon" | "progress" | "progress-category" | "progress-detail";
    className?: string;
    textClassName?: string;
    showTooltip?: boolean;
    icon?: IconType;
}

/**
 * StatusesLabel - For template+status data: supports default, icon, and progress variants.
 * When data is not template+status, passes all props through to StatusLabel for default/icon.
 */
const StatusesLabel: React.FC<StatusesLabelProps> = ({
    data,
    variant = "default",
    className,
    textClassName,
    showTooltip = true,
    icon: iconProp,
}) => {
    const { t } = useTranslation();

    if (!data) {
        return <span className="text-muted-foreground">-</span>;
    }

    // Not template+status: delegate to StatusLabel (only default/icon make sense)
    if (!hasTemplateAndStatus(data)) {
        if (variant === "progress" || variant === "progress-category" || variant === "progress-detail") {
            return <span className="text-muted-foreground">-</span>;
        }
        return (
            <StatusLabel
                data={data as Status | StatusString | { name?: string; color?: string } | null | undefined}
                variant={variant as "default" | "icon"}
                className={className}
                textClassName={textClassName}
                showTooltip={showTooltip}
                icon={iconProp}
            />
        );
    }

    const { template, status } = data;
    const currentCategory = status.category;
    const currentCategoryIndex = currentCategory ? categoryOrder.indexOf(currentCategory) : -1;

    // Progress variants: render 4-step progress circles
    if (variant === "progress" || variant === "progress-category" || variant === "progress-detail") {
        const statusesByCategory: Record<StatusCategory, Status[]> = {
            not_started: [],
            active: [],
            done: [],
            closed: [],
        };
        (template.statuses || []).forEach((s) => {
            if (s.category) statusesByCategory[s.category].push(s);
        });

        return (
            <div className={cn("flex items-center gap-0.5", className)}>
                {categoryOrder.map((category, index) => {
                    const categoryIndex = categoryOrder.indexOf(category);
                    const isComplete = categoryIndex < currentCategoryIndex;
                    const isCurrent = categoryIndex === currentCategoryIndex;
                    const isFuture = categoryIndex > currentCategoryIndex;
                    const state = isComplete ? "complete" : isFuture ? "future" : "current";

                    const categoryColor = defaultCategoryColors[category];
                    const categoryStatuses = statusesByCategory[category];
                    const statusColor = status.color || categoryColor;
                    const color =
                        variant === "progress" || variant === "progress-category"
                            ? categoryColor
                            : isCurrent
                              ? statusColor
                              : isComplete && categoryStatuses.length === 1
                                ? categoryStatuses[0]?.color || categoryColor
                                : categoryColor;

                    const popoverLabel =
                        variant === "progress"
                            ? isCurrent
                                ? status.name
                                : getCategoryLabel(category, t)
                            : variant === "progress-category"
                              ? getCategoryLabel(category, t)
                              : isCurrent
                                ? status.name
                                : categoryStatuses.length === 1
                                  ? categoryStatuses[0]?.name ?? getCategoryLabel(category, t)
                                  : getCategoryLabel(category, t);

                    const circleColor = state === "future" ? "gray" : color;
                    const circleClasses = cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2",
                        state === "future" ? "bg-muted/50 border-border" : getColorClasses(circleColor)
                    );

                    const circle = (
                        <div className={circleClasses}>
                            {state === "complete" && <Check className={cn("h-4 w-4", getTextColorClasses(color))} />}
                            {state === "current" && (
                                <div
                                    className={cn(
                                        "w-4 h-4 rounded-full border-2 bg-background",
                                        `border-${color}-200 dark:border-${color}-800`
                                    )}
                                />
                            )}
                        </div>
                    );

                    return (
                        <React.Fragment key={category}>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="inline-flex cursor-default">{circle}</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-sm">{popoverLabel}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            {index < categoryOrder.length - 1 && (
                                <div className="h-0.5 flex-1 min-w-[12px] bg-muted rounded" />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        );
    }

    // default / icon with template+status: pass status to StatusLabel
    return (
        <StatusLabel
            data={status}
            variant={variant as "default" | "icon"}
            className={className}
            textClassName={textClassName}
            showTooltip={showTooltip}
            icon={iconProp}
        />
    );
};

export default StatusesLabel;
