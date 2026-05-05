import React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { IconType } from "@/types/miscelanea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { StatusString } from "@/types/general/status";
import { Status, StatusCategory, StatusTemplate } from "@/types/general/status-templates";
import StatusLabel from "@/app/components/labels/status-label";
import { getStrokeColorClasses } from "@/utils/miscelanea";

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
    /** Hide one or more categories from progress (e.g. hideCategory="closed" or hideCategory={["closed"]}) */
    hideCategory?: StatusCategory | StatusCategory[];
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
    hideCategory = ["closed"] as StatusCategory[],
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
        // If data is { template, status } shape but template is missing/invalid, unwrap the status
        const statusData =
            typeof data === "object" &&
            data !== null &&
            "status" in data &&
            "template" in data
                ? (data as { template: unknown; status: Status }).status
                : (data as Status | StatusString | { name?: string; color?: string } | null | undefined);
        return (
            <StatusLabel
                data={statusData}
                variant={variant as "default" | "icon"}
                className={className}
                textClassName={textClassName}
                showTooltip={showTooltip}
                icon={iconProp}
            />
        );
    }

    const { status } = data;
    const currentCategory = status.category;
    const currentCategoryIndex = currentCategory ? categoryOrder.indexOf(currentCategory) : -1;

    // Progress variants: single circle with circumference as progress bar
    if (variant === "progress" || variant === "progress-category" || variant === "progress-detail") {
        const hiddenSteps = hideCategory
            ? Array.isArray(hideCategory)
                ? hideCategory
                : [hideCategory]
            : [];
        const visibleCategories = categoryOrder.filter((c: StatusCategory) => !hiddenSteps.includes(c));
        const totalSteps = visibleCategories.length;
        if (totalSteps === 0) {
            return <span className="text-muted-foreground">-</span>;
        }

        const categoryColor = currentCategory ? defaultCategoryColors[currentCategory] : "gray";
        const statusColor = status.color || categoryColor;
        const progressColor =
            variant === "progress" || variant === "progress-category" ? categoryColor : statusColor;

        // Progress 0–1 over visible steps only: completed visible steps + 1 if current is visible
        const completedVisible = visibleCategories.filter(
            (c) => categoryOrder.indexOf(c) < currentCategoryIndex
        ).length;
        const currentIsVisible = currentCategory != null && visibleCategories.includes(currentCategory);
        const progress =
            totalSteps > 0
                ? (completedVisible + (currentIsVisible ? 1 : 0)) / totalSteps
                : 0;
        const size = 36;
        const strokeWidth = 3;
        const r = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * r;
        const strokeDashoffset = circumference * (1 - progress);

        const popoverLabel =
            variant === "progress"
                ? status.name
                : variant === "progress-category"
                  ? getCategoryLabel(currentCategory!, t)
                  : status.name;

        // Painted stroke (inner/border-like color) via getStrokeColorClasses – not text color
        const progressStrokeClass = getStrokeColorClasses(progressColor);

        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span
                            className={cn("inline-flex shrink-0", className)}
                            style={{ width: size, height: size }}
                        >
                            <svg
                                width={size}
                                height={size}
                                viewBox={`0 0 ${size} ${size}`}
                                className="-rotate-90"
                                aria-hidden
                            >
                                {/* Background circle (full circumference) */}
                                <circle
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={r}
                                    fill="none"
                                    strokeWidth={strokeWidth}
                                    className="stroke-muted/60"
                                />
                                {/* Progress circle: painted stroke from getStrokeColorClasses */}
                                <circle
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={r}
                                    fill="none"
                                    strokeWidth={strokeWidth}
                                    strokeLinecap="round"
                                    className={progressStrokeClass}
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    style={{
                                        transition: "stroke-dashoffset 0.25s ease-out",
                                    }}
                                />
                            </svg>
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="text-sm">{popoverLabel}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
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
