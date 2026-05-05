import React from "react";
import { cn } from "@/lib/utils";
import Tag from "@/app/components/tag/tag";
import IconLabel from "@/app/components/labels/icon-label";
import type { IconType } from "@/types/miscelanea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TicketWorkOrderPriority } from "@/types/field-service/ticket-work-order-types";
import { getColorClasses } from "@/utils/miscelanea";

/** Priority can be string or object with name */
type PriorityData = string | { name?: string } | null | undefined;

const DEFAULT_PRIORITY_ICON = "lucide:alert-triangle";

/** Capitalize first letter for tooltip display. */
function capitalizeForTooltip(s: string): string {
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
// Get tag color
const getPriorityColor = (priority: TicketWorkOrderPriority): string => {
    switch (priority) {
        case "low":
            return "green";
        case "medium":
            return "yellow";
        case "high":
            return "orange";
        case "urgent":
            return "red";
        default:
            return "gray";
    }
};
/** Number of filled bars (1–4) for variant="steps". */
const priorityToStepCount = (priority: TicketWorkOrderPriority): number => {
    switch (priority) {
        case "urgent":
            return 4;
        case "high":
            return 3;
        case "medium":
            return 2;
        case "low":
        default:
            return 1;
    }
}


interface PriorityLabelProps {
    data: PriorityData;
    variant?: "default" | "icon" | "steps";
    className?: string;
    textClassName?: string;
    /** Whether to show tooltip on hover when variant="icon" or variant="steps". */
    showTooltip?: boolean;
    /** Override icon when variant="icon". String (prefixed with lucide: if no ":") or React component. */
    icon?: IconType;
}

/**
 * PriorityLabel - Displays priority as Tag, IconLabel, or steps based on variant.
 * variant="default" shows full tag; variant="icon" shows icon with Tooltip; variant="steps" shows 4 vertical bars (1–4 filled by priority).
 */
const PriorityLabel: React.FC<PriorityLabelProps> = ({ data, variant = "default", className, textClassName, showTooltip = true, icon: iconProp }) => {
    if (!data) {
        return <span className="text-muted-foreground">-</span>;
    }

    const priorityName = typeof data === "string" ? data : (data as { name?: string }).name ?? "";
    const iconConfig = {
        icon: (iconProp ?? DEFAULT_PRIORITY_ICON) as IconType,
        color: getPriorityColor(priorityName as TicketWorkOrderPriority),
    };

    if (variant === "steps") {
        const filled = priorityToStepCount(priorityName as TicketWorkOrderPriority);
        const filledClasses = getColorClasses(getPriorityColor(priorityName as TicketWorkOrderPriority));
        const steps = (
            <div className={cn("flex items-end gap-0.5", className)} role="img" aria-label={priorityName as TicketWorkOrderPriority || undefined}>
                {[0, 1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className={cn(
                            "h-5 w-2 min-w-[8px] rounded-sm border-2",
                            i < filled ? filledClasses : "bg-muted"
                        )}
                    />
                ))}
            </div>
        );
        if (showTooltip && priorityName) {
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>{steps}</TooltipTrigger>
                        <TooltipContent>{capitalizeForTooltip(priorityName as TicketWorkOrderPriority)}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }
        return steps;
    }

    if (variant === "icon") {
        const icon = (
            <div className={cn("flex shrink-0", className)}>
                <IconLabel data={{ icon: iconConfig.icon, text: "", color: iconConfig.color }} showIconColor={true} textClassName={cn("max-w-xs truncate", textClassName)} />
            </div>
        );
        if (showTooltip && priorityName) {
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>{icon}</TooltipTrigger>
                        <TooltipContent>{capitalizeForTooltip(priorityName as TicketWorkOrderPriority)}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }
        return icon;
    }

    return <Tag text={priorityName} className={cn("max-w-xs truncate", textClassName)} />;
};

export default PriorityLabel;
