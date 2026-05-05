import React from "react";
import { cn } from "@/lib/utils";
import IconLabel from "@/app/components/labels/icon-label";
import type { IconType } from "@/types/miscelanea";
import { getTagColorFromString } from "@/app/components/tag/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { StatusString } from "@/types/general/status";
import { Status } from "@/types/general/status-templates";
import Tag from "@/app/components/tag/tag";

/** Status can be string or object with name and color */
type StatusData = Status | StatusString | { name?: string; color?: string } | null | undefined;

const DEFAULT_STATUS_ICON = "lucide:clipboard-clock";

interface StatusLabelProps {
    data: StatusData;
    variant?: "default" | "icon";
    className?: string;
    textClassName?: string;
    /** Whether to show tooltip on hover when variant="icon". */
    showTooltip?: boolean;
    /** Override icon when variant="icon". String (prefixed with lucide: if no ":") or React component. */
    icon?: IconType;
}

/**
 * StatusLabel - Displays status as Tag or IconLabel based on variant.
 * variant="default" shows full tag; variant="icon" shows icon with Tooltip on hover (when showTooltip).
 */
const StatusLabel: React.FC<StatusLabelProps> = ({ data, variant = "default", className, textClassName, showTooltip = true, icon: iconProp }) => {
    if (!data) {
        return <span className="text-muted-foreground">-</span>;
    }
    const status = typeof data === "string" ? data : (data as { name?: string }).name ?? "";
    const color = typeof data === "object" && data !== null && "color" in data ? (data as any).color : getTagColorFromString(status);
    const iconConfig = {
        icon: (iconProp ?? DEFAULT_STATUS_ICON) as IconType,
        color,
    };

    if (variant === "icon") {
        const icon = (
            <div className={cn("flex shrink-0", className)}>
                <IconLabel data={{ icon: iconConfig.icon, text: "", color: iconConfig.color }} showIconColor={true} textClassName={cn("max-w-xs truncate", textClassName)} />
            </div>
        );
        if (showTooltip) {
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>{icon}</TooltipTrigger>
                        <TooltipContent>
                            <Tag text={status} color={color} className={textClassName} />
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }
        return icon;
    }

    return <Tag text={status} color={color} className={cn("max-w-xs truncate", textClassName)} />;
};

export default StatusLabel;
