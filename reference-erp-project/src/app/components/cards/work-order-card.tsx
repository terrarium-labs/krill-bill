import { Clipboard, ExternalLink, Users, UserStar } from "lucide-react";
import { Button } from "@/components/ui/button";
import IdBadge from "@/app/components/id-badge";
import ClientLabel from "@/app/components/labels/client-label";
import LocationLabel from "@/app/components/labels/location-label";
import EmployeeLabel from "@/app/components/labels/employee-label";
import Tag from "@/app/components/tag/tag";
import PriorityLabel from "@/app/components/labels/priority-label";
import { WorkOrder } from "@/types/field-service/work-orders/work-orders";
import TextLabel from "@/app/components/labels/text-label";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";

type WorkOrderCardVariant = "default" | "client-location" | "client" | "location";

interface WorkOrderCardProps {
    workOrder: WorkOrder;
    variant?: WorkOrderCardVariant;
    isSelected?: boolean;
    className?: string;
    /** When true, card click does not navigate and external link is hidden */
    disableNavigation?: boolean;
}

function WorkOrderCard({ workOrder, variant = "default", isSelected, className, disableNavigation }: WorkOrderCardProps) {
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();

    const assigneesEmployees = workOrder.assignees?.map((a) => a.employee).filter(Boolean) ?? [];
    const supervisors = workOrder.supervisors ?? [];
    const hasAssigneesOrSupervisors = assigneesEmployees.length > 0 || supervisors.length > 0;

    const handleClick = () => {
        if (disableNavigation) return;
        if (orgId) navigate(`/${orgId}/work-orders/${workOrder.id}`);
    };

    return (
        <div
            role={disableNavigation ? undefined : "button"}
            tabIndex={disableNavigation ? undefined : 0}
            onClick={handleClick}
            onKeyDown={(e) => e.key === "Enter" && handleClick()}
            className={cn(
                "px-4 py-3 rounded-lg border bg-background shadow-md min-w-[280px] max-w-full transition-all text-left",
                !disableNavigation && "hover:shadow-lg hover:border-primary cursor-pointer",
                isSelected ? "shadow-lg border-primary" : "border-border",
                className
            )}
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex flex-col gap-0.5 flex-1 min-w-0 overflow-hidden">
                    {variant === "default" && (
                        <div className="flex items-center gap-2 min-w-0">
                            <Clipboard className="h-4 w-4 font-semibold shrink-0" />
                            <span className="font-semibold text-sm truncate"><TextLabel data={workOrder.name} className="truncate max-w-65" /></span>
                        </div>
                    )}
                    {variant === "client-location" && (
                        <>
                            <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                {workOrder.client && <ClientLabel data={workOrder.client} className="font-medium truncate" />}
                                {workOrder.location && <LocationLabel data={workOrder.location} textClassName="truncate" />}
                            </div>
                            {workOrder.name != null && workOrder.name !== "" && (
                                <span className="text-sm text-muted-foreground truncate"><TextLabel data={workOrder.name} className="truncate max-w-full" /></span>
                            )}
                        </>
                    )}
                    {variant === "client" && (
                        <>
                            <div className="flex items-center min-w-0">
                                {workOrder.client && <ClientLabel data={workOrder.client} className="truncate font-medium" />}
                            </div>
                            {workOrder.name != null && workOrder.name !== "" && (
                                <span className="text-sm text-muted-foreground truncate"><TextLabel data={workOrder.name} className="truncate max-w-65" /></span>
                            )}
                        </>
                    )}
                    {variant === "location" && (
                        <>
                            <div className="flex items-center min-w-0">
                                {workOrder.location && <LocationLabel data={workOrder.location} textClassName="truncate font-medium" />}
                            </div>
                            {workOrder.name != null && workOrder.name !== "" && (
                                <span className="text-sm text-muted-foreground truncate"><TextLabel data={workOrder.name} className="truncate max-w-65" /></span>
                            )}
                        </>
                    )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <IdBadge id={workOrder.id} />
                    {!disableNavigation && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClick();
                            }}
                            title="Navigate"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>
            </div>

            {workOrder.description && (
                <div className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {workOrder.description}
                </div>
            )}

            <div className="flex items-center gap-2 mb-2 flex-wrap">

                {workOrder.priority && (
                    <PriorityLabel data={workOrder.priority} variant="icon" />
                )}
                {workOrder.type && <Tag text={workOrder.type.name} color={workOrder.type.color || ""} />}
                {workOrder.status && <Tag text={workOrder.status.name} color={workOrder.status.color || ""} className="capitalize" />}
            </div>

            {hasAssigneesOrSupervisors && (
                <div className="flex items-center gap-3 pt-2 border-t border-border flex-wrap">
                    {supervisors.length > 0 && (
                        <div className="flex items-center gap-1.5 min-w-0">
                            <UserStar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <EmployeeLabel data={supervisors} />
                        </div>
                    )}
                    {assigneesEmployees.length > 0 && (
                        <div className="flex items-center gap-1.5 min-w-0">
                            <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <EmployeeLabel data={assigneesEmployees} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default WorkOrderCard;