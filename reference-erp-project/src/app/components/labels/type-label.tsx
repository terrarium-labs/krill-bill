import React from "react";
import { cn } from "@/lib/utils";
import Tag from "@/app/components/tag/tag";
import IconLabel from "@/app/components/labels/icon-label";
import type { IconType } from "@/types/miscelanea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TicketWorkOrderType } from "@/types/field-service/ticket-work-order-types";

/** Type can be object with name and color */
type TypeData = { name?: string; color?: string } | TicketWorkOrderType | string | null | undefined;

const DEFAULT_TYPE_ICON = "lucide:tag";

interface TypeLabelProps {
    data: TypeData;
    variant?: "default" | "icon";
    className?: string;
    textClassName?: string;
    /** Whether to show tooltip on hover when variant="icon". */
    showTooltip?: boolean;
    /** Override icon when variant="icon". String (prefixed with lucide: if no ":") or React component. */
    icon?: IconType;
}

/**
 * TypeLabel - Displays type as Tag or IconLabel based on variant.
 * variant="default" shows full tag; variant="icon" shows icon with Tooltip on hover (when showTooltip).
 */
const TypeLabel: React.FC<TypeLabelProps> = ({ data, variant = "default", className, textClassName, showTooltip = true, icon: iconProp }) => {
    if (!data) {
        return <span className="text-muted-foreground">-</span>;
    }
    const type = typeof data === "string" ? data : (data as { name?: string }).name ?? "";
    const color = typeof data === "object" && data !== null && "color" in data ? (data as any).color : null;
   
    const iconConfig = {
        icon: (iconProp ?? DEFAULT_TYPE_ICON) as IconType,
        color: color,
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
                            <Tag text={type} color={color} className={textClassName} />
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }
        return icon;
    }

    return <Tag text={type} color={color} className={cn("max-w-xs truncate", textClassName)} />;
};

export default TypeLabel;
