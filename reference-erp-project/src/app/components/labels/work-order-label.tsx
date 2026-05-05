import React from "react";
import { cn } from "@/lib/utils";
import { WorkOrder } from "@/types/field-service/work-orders/work-orders";
import ClientLabel from "@/app/components/labels/client-label";
import LocationLabel from "@/app/components/labels/location-label";
import PriorityLabel from "@/app/components/labels/priority-label";
import TypeLabel from "@/app/components/labels/type-label";
import StatusLabel from "@/app/components/labels/status-label";
import IdBadge from "../id-badge";
import type { TicketWorkOrderHideField, TicketWorkOrderIconField } from "./ticket-label";

/** Extended shape for API responses (type/status/priority may be objects with name/color) */
type WorkOrderLabelData = WorkOrder & {
    priority?: { name?: string } | string;
    type?: { name?: string; color?: string };
    status?: { name?: string; color?: string };
};

interface WorkOrderLabelProps {
    data: WorkOrderLabelData | WorkOrder | null | undefined;
    className?: string;
    textClassName?: string;
    /** Hide one or more fields. Work order does not have "description". */
    hide?: TicketWorkOrderHideField | TicketWorkOrderHideField[];
    /** Fields to show as icon-only. Client and location use variant="icon". Tag fields show IconLabel with Tooltip on hover. */
    icons?: TicketWorkOrderIconField | TicketWorkOrderIconField[];
}

const isFieldHidden = (field: TicketWorkOrderHideField, hide?: TicketWorkOrderHideField | TicketWorkOrderHideField[]): boolean => {
    if (!hide) return false;
    return Array.isArray(hide) ? hide.includes(field) : hide === field;
};

const isFieldInIcons = (field: TicketWorkOrderIconField, icons?: TicketWorkOrderIconField | TicketWorkOrderIconField[]): boolean => {
    if (!icons) return false;
    return Array.isArray(icons) ? icons.includes(field) : icons === field;
};

/**
 * WorkOrderLabel component - Displays a work order with client, location, name, and tags
 *
 * @param data - Work order object (or API response shape with extended fields)
 * @param className - Optional class name for the container
 * @param textClassName - Optional class name for text elements
 * @param hide - Field(s) to hide. Work order does not have "description".
 * @param icons - Field(s) to show as icon-only. Client and location use variant="icon". Tag fields show IconLabel with Tooltip on hover.
 */
const WorkOrderLabel: React.FC<WorkOrderLabelProps> = ({ data, className, textClassName, hide, icons }) => {
    if (!data) {
        return <span className="text-muted-foreground">-</span>;
    }

    const d = data as WorkOrderLabelData;

    return (
        <div className={cn("flex items-center gap-2 flex-1 min-w-0", className)}>
            <div className="flex items-center gap-2 min-w-0">
                {!isFieldHidden("id", hide) && <IdBadge id={data.id} hideIcon={true} />}
                {!isFieldHidden("client", hide) &&
                    ((data.client?.client_name || data.client?.trade_name) ? (
                        <ClientLabel
                            data={data.client}
                            className={cn("max-w-xs truncate", textClassName)}
                            variant={isFieldInIcons("client", icons) ? "icon" : "default"}
                        />
                    ) : (
                        <span className="text-xs text-muted-foreground">Unknown client</span>
                    ))}
                {!isFieldHidden("client", hide) && !isFieldHidden("location", hide) && (data.client?.client_name || data.client?.trade_name) && data.location && (
                    <span className="text-xs text-muted-foreground">-</span>
                )}
                {!isFieldHidden("location", hide) &&
                    data.location && (
                        <LocationLabel
                            textClassName={cn("max-w-xs truncate", textClassName)}
                            data={{
                                id: data.location.id,
                                name: data.location.name,
                                icon_url: data.location.icon_url ?? "map-pin",
                                city: data.location.city,
                                country: data.location.country,
                            }}
                            variant={isFieldInIcons("location", icons) ? "icon" : "default"}
                        />
                    )}
                {!isFieldHidden("client", hide) && !isFieldHidden("location", hide) && ((data.client?.client_name || data.client?.trade_name) || data.location) && (
                    <span className="text-xs text-muted-foreground">|</span>
                )}
                {!isFieldHidden("name", hide) && <span className={cn("font-medium max-w-xs truncate", textClassName)}>{data.name}</span>}
                {!isFieldHidden("client", hide) && !isFieldHidden("location", hide) && !isFieldHidden("name", hide) && ((data.client?.client_name || data.client?.trade_name) || data.location || data.name) && (
                    <span className="text-xs text-muted-foreground">|</span>
                )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
                {!isFieldHidden("priority", hide) && data.priority && (
                    <PriorityLabel data={data.priority} variant={isFieldInIcons("priority", icons) ? "icon" : "default"} textClassName={textClassName} />
                )}
                {!isFieldHidden("type", hide) && d.type && (
                    <TypeLabel data={d.type} variant={isFieldInIcons("type", icons) ? "icon" : "default"} textClassName={textClassName} />
                )}
                {!isFieldHidden("status", hide) && d.status && (
                    <StatusLabel data={d.status} variant={isFieldInIcons("status", icons) ? "icon" : "default"} textClassName={textClassName} />
                )}
            </div>
        </div>
    );
};

export default WorkOrderLabel;
