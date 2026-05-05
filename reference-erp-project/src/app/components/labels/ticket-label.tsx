import React from "react";
import { cn } from "@/lib/utils";
import { Ticket } from "@/types/field-service/tickets/tickets";
import IdBadge from "@/app/components/id-badge";
import ClientLabel from "@/app/components/labels/client-label";
import LocationLabel from "@/app/components/labels/location-label";
import PriorityLabel from "@/app/components/labels/priority-label";
import TypeLabel from "@/app/components/labels/type-label";
import StatusLabel from "@/app/components/labels/status-label";

/** Extended shape for API responses (type/status/priority may be objects with name/color) */
type TicketLabelData = Ticket & {
    name?: string;
    description?: string;
    priority?: { name?: string } | string;
    type?: { name?: string; color?: string };
    status?: { name?: string; color?: string };
};

export type TicketWorkOrderHideField = "name" | "description" | "location" | "priority" | "type" | "status" | "client" | "id";

/** Fields that can be shown as icon-only (no breakpoints - purely by prop). */
export type TicketWorkOrderIconField = Extract<TicketWorkOrderHideField, "priority" | "type" | "status" | "client" | "location">;

interface TicketLabelProps {
    data: TicketLabelData | Ticket | null | undefined;
    className?: string;
    textClassName?: string;
    /** Hide one or more fields. Ticket does not have "name". */
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
 * TicketLabel component - Displays a ticket with id, client, location, tags, and description
 *
 * @param data - Ticket object (or API response shape with extended fields)
 * @param className - Optional class name for the container
 * @param textClassName - Optional class name for text elements
 * @param hide - Field(s) to hide. Ticket does not have "name".
 * @param icons - Field(s) to show as icon-only. Client uses variant="icon". Location uses LocationLabel variant="icon". Tag fields show IconLabel with Tooltip on hover.
 */
const TicketLabel: React.FC<TicketLabelProps> = ({ data, className, textClassName, hide, icons }) => {
    if (!data) {
        return <span className="text-muted-foreground">-</span>;
    }

    const d = data as TicketLabelData;

    return (
        <div className={cn("flex items-center gap-2 flex-1 min-w-0", className)}>
            <div className="flex items-center gap-2">
                {!isFieldHidden("id", hide) && <IdBadge id={data.id} hideIcon={true} />}
                {!isFieldHidden("client", hide) &&
                    ((data.client?.client_name || data.client?.trade_name) ? (
                        <ClientLabel
                            className={cn("max-w-xs truncate", textClassName)}
                            data={data.client}
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
            {!isFieldHidden("description", hide) &&
                d.description && (
                    <span className={cn("text-xs text-muted-foreground max-w-lg truncate", textClassName)}>
                        {d.description}
                    </span>
                )}
        </div>
    );
};

export default TicketLabel;
