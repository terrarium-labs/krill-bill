import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DynamicIcon, IconName } from "lucide-react/dynamic";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Workplace } from "@/types/general/workplaces";
import { cn } from "@/lib/utils";

interface WorkplaceLabelProps {
    data: Workplace | Workplace[] | null | undefined;
    link?: boolean | string;
    variant?: "default" | "icon";
    className?: string;
}

/**
 * WorkplaceLabel component - Displays one or multiple workplaces with their icons
 *
 * @param data - Single Workplace, array of Workplaces, null, or undefined
 * @param link - If true, navigates to workplace detail page. If string, appends it as sub-route
 * @param variant - "default" shows icon + name for single workplace; "icon" always shows overlapping icon badge style
 * @param className - Extra classes for the outer wrapper
 *
 * Behavior:
 * - null/undefined/empty array: displays "-"
 * - variant="default" + single: icon badge + name
 * - variant="default" + multiple: overlapping icon badges + "+N" for overflow
 * - variant="icon": always overlapping icon badge style
 */
const WorkplaceLabel: React.FC<WorkplaceLabelProps> = ({
    data,
    link = false,
    variant = "default",
    className,
}) => {
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();

    const handleClick = (e: React.MouseEvent, workplaceId: string) => {
        e.stopPropagation();
        if (link && orgId) {
            const basePath = `/${orgId}/admin/workplaces/${workplaceId}`;
            const subRoute = typeof link === "string" ? `/${link}` : "";
            navigate(`${basePath}${subRoute}`);
        }
    };

    if (!data || (Array.isArray(data) && data.length === 0)) {
        return <span className="text-muted-foreground">-</span>;
    }

    const workplaces = Array.isArray(data) ? data : [data];

    const WorkplaceIconBadge = ({
        workplace,
        size = "md",
    }: {
        workplace: Workplace;
        size?: "sm" | "md";
    }) => (
        <div
            className={cn(
                "rounded-full bg-muted flex items-center justify-center shrink-0 border border-background",
                size === "md" ? "w-7 h-7" : "w-6 h-6"
            )}
        >
            <DynamicIcon
                name={(workplace.icon_url as IconName) || "building-2"}
                className={cn(
                    "text-muted-foreground",
                    size === "md" ? "h-3.5 w-3.5" : "h-3 w-3"
                )}
            />
        </div>
    );

    if (variant === "default" && workplaces.length === 1) {
        const workplace = workplaces[0];
        const addressParts = [
            workplace.address_line_1,
            workplace.address_line_2,
            workplace.city,
            workplace.state_province,
            workplace.postal_code,
            workplace.country,
        ].filter(Boolean);

        const badge = (
            <div
                className={cn(
                    "flex items-center gap-2",
                    link &&
                        "cursor-pointer hover:bg-primary/10 -mx-2 -my-1 px-2 py-1 rounded transition-all hover:opacity-80",
                    className
                )}
                onClick={link ? (e) => handleClick(e, workplace.id) : undefined}
            >
                <DynamicIcon
                    name={(workplace.icon_url as IconName) || "building-2"}
                    className="h-4 w-4 text-muted-foreground shrink-0"
                />
                <span className="text-sm">{workplace.name}</span>
            </div>
        );

        if (addressParts.length === 0) return badge;

        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>{badge}</TooltipTrigger>
                    <TooltipContent>
                        <div className="text-sm">
                            <div className="font-medium">{workplace.name}</div>
                            <div className="text-muted-foreground">{addressParts.join(", ")}</div>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    const visibleWorkplaces = workplaces.slice(0, 3);
    const remainingWorkplaces = workplaces.slice(3);
    const remainingNames = remainingWorkplaces.map((w) => w.name).join(", ");

    return (
        <div className={cn("flex items-center", className)}>
            {visibleWorkplaces.map((workplace, index) => (
                <TooltipProvider key={workplace.id}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                style={{ marginLeft: index > 0 ? "-8px" : "0" }}
                                className={cn(link && "cursor-pointer hover:opacity-80 hover:z-10 relative")}
                                onClick={link ? (e) => handleClick(e, workplace.id) : undefined}
                            >
                                <WorkplaceIconBadge workplace={workplace} />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{workplace.name}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ))}
            {workplaces.length > 3 && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium ml-[-8px] cursor-pointer hover:opacity-80 border border-background">
                                +{workplaces.length - 3}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="max-w-xs">{remainingNames}</div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    );
};

export default WorkplaceLabel;
