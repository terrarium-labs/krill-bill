import type { EventName, Event } from "@/types/general/events";
import { getWorkOrderEvents } from "@/api/field-service/work-orders/events/events";
import { getOrderEvents } from "@/api/orgs/orders/events/events";
import { getSalesInvoiceEvents } from "@/api/sales-invoices/events/events";
import { getPurchaseInvoiceEvents } from "@/api/purchase-invoices/events/events";
import { getClientEvents } from "@/api/clients/events/events";
import { getEntityTypeFromId } from "./entities";
import { getOrgTicketEvents } from "@/api/field-service/tickets/events/events";

export interface EventIconConfig {
    icon: string;
    color: string;
}

type ActionType = "new" | "edit" | "delete";

/**
 * Get color class for an action type
 * @param action - The action type (new, edit, delete)
 * @returns Tailwind color class
 */
const getColorForAction = (action: ActionType): string => {
    switch (action) {
        case "new":
            return "text-green-500";
        case "edit":
            return "text-amber-500";
        case "delete":
            return "text-red-500";
        default:
            return "text-muted-foreground";
    }
};

/**
 * Get icon name and color for a given event name
 * @param eventName - The event name from EventName type
 * @returns Object with icon and color properties
 */
export const getEventIconConfig = (eventName: string): EventIconConfig => {
    const name = eventName as EventName;

    // Contact events
    if (name === "contact_created") {
        return { icon: "user-plus", color: getColorForAction("new") };
    }
    if (name === "contact_updated") {
        return { icon: "user-round-pen", color: getColorForAction("edit") };
    }
    if (name === "contact_deleted") {
        return { icon: "user-minus", color: getColorForAction("delete") };
    }

    // Payment method events
    if (name === "payment_method_created") {
        return { icon: "wallet", color: getColorForAction("new") };
    }
    if (name === "payment_method_updated") {
        return { icon: "wallet", color: getColorForAction("edit") };
    }
    if (name === "payment_method_deleted") {
        return { icon: "wallet", color: getColorForAction("delete") };
    }
    if (name === "payment_method_default") {
        return { icon: "wallet", color: getColorForAction("edit") };
    }

    // Location events
    if (name === "location_created") {
        return { icon: "map-pin-plus", color: getColorForAction("new") };
    }
    if (name === "location_updated") {
        return { icon: "map-pin-pen", color: getColorForAction("edit") };
    }
    if (name === "location_deleted") {
        return { icon: "map-pin-off", color: getColorForAction("delete") };
    }

    // Client events
    if (name === "client_created") {
        return { icon: "user-round-plus", color: getColorForAction("new") };
    }
    if (name === "client_updated") {
        return { icon: "user-round-pen", color: getColorForAction("edit") };
    }
    if (name === "client_deleted") {
        return { icon: "user-round-x", color: getColorForAction("delete") };
    }

    // Work order events
    if (name === "work_order_created") {
        return { icon: "clipboard-plus", color: getColorForAction("new") };
    }
    if (name === "work_order_updated") {
        return { icon: "clipboard-pen", color: getColorForAction("edit") };
    }
    if (name === "employee_assigned") {
        return { icon: "user-round-plus", color: getColorForAction("new") };
    }
    if (name === "employee_unassigned") {
        return { icon: "user-round-minus", color: getColorForAction("delete") };
    }

    // Inventory events
    if (name === "inventory_added") {
        return { icon: "package-plus", color: getColorForAction("new") };
    }
    if (name === "inventory_removed") {
        return { icon: "package-minus", color: getColorForAction("delete") };
    }

    // Time tracking events
    if (name === "time_tracking_registered") {
        return { icon: "clock-plus", color: getColorForAction("new") };
    }

    // Checklist events
    if (name === "checklist_added") {
        return { icon: "square-check-big", color: getColorForAction("new") };
    }
    if (name === "checklist_deleted") {
        return { icon: "square-check-big", color: getColorForAction("delete") };
    }
    if (name === "checklist_updated") {
        return { icon: "square-check-big", color: getColorForAction("edit") };
    }

    // Order events
    if (name === "order_created") {
        return { icon: "file-plus", color: getColorForAction("new") };
    }
    if (name === "order_approved") {
        return { icon: "file-check", color: getColorForAction("new") };
    }
    if (name === "order_cancelled") {
        return { icon: "file-x", color: getColorForAction("delete") };
    }
    if (name === "order_updated") {
        return { icon: "file-pen", color: getColorForAction("edit") };
    }
    if (name === "order_items_added") {
        return { icon: "file-box", color: getColorForAction("new") };
    }
    if (name === "order_delivery_added") {
        return { icon: "file-clock", color: getColorForAction("new") };
    }
    if (name === "order_tracking_added") {
        return { icon: "file-search-corner", color: getColorForAction("new") };
    }
    if (name === "order_invoice_created") {
        return { icon: "file-input", color: getColorForAction("new") };
    }

    // Invoice and quote events
    if (name === "invoice_added_to_order") {
        return { icon: "file-input", color: getColorForAction("new") };
    }
    if (name === "invoice_created") {
        return { icon: "file-plus", color: getColorForAction("new") };
    }
    if (name === "quote_created") {
        return { icon: "file-plus", color: getColorForAction("new") };
    }

    // Message events
    if (name === "new_message_added") {
        return { icon: "message-circle", color: getColorForAction("new") };
    }

    // Client stakeholder events
    if (name === "client_stakeholder_added") {
        return { icon: "user-round-plus", color: getColorForAction("new") };
    }
    if (name === "client_stakeholder_removed") {
        return { icon: "user-round-x", color: getColorForAction("delete") };
    }
    if (name === "client_stakeholder_updated") {
        return { icon: "user-round-pen", color: getColorForAction("edit") };
    }

    // Ticket events
    if (name === "ticket_created") {
        return { icon: "notebook-text", color: getColorForAction("new") };
    }
    if (name === "ticket_updated") {
        return { icon: "notebook-pen", color: getColorForAction("edit") };
    }
    if (name === "ticket_supervisor_added") {
        return { icon: "user-round-plus", color: getColorForAction("new") };
    }
    if (name === "ticket_supervisor_deleted") {
        return { icon: "user-round-minus", color: getColorForAction("delete") };
    }

    // Sales invoices events
    if (name === "sales_invoice_created") {
        return { icon: "file-plus", color: getColorForAction("new") };
    }
    if (name === "sales_invoice_updated") {
        return { icon: "file-pen", color: getColorForAction("edit") };
    }
    if (name === "sales_invoice_approved") {
        return { icon: "file-check", color: getColorForAction("new") };
    }
    if (name === "sales_invoice_payment_added") {
        return { icon: "file-plus", color: getColorForAction("new") };
    }
    if (name === "sales_invoice_payment_updated") {
        return { icon: "file-pen", color: getColorForAction("edit") };
    }
    if (name === "sales_invoice_line_added") {
        return { icon: "file-plus", color: getColorForAction("new") };
    }
    if (name === "sales_invoice_line_updated") {
        return { icon: "file-pen", color: getColorForAction("edit") };
    }

    // Purchase invoices events
    if (name === "purchase_invoice_created") {
        return { icon: "file-plus", color: getColorForAction("new") };
    }
    if (name === "purchase_invoice_updated") {
        return { icon: "file-pen", color: getColorForAction("edit") };
    }
    if (name === "purchase_invoice_approved") {
        return { icon: "file-check", color: getColorForAction("new") };
    }
    if (name === "purchase_invoice_payment_added") {
        return { icon: "file-plus", color: getColorForAction("new") };
    }
    if (name === "purchase_invoice_payment_updated") {
        return { icon: "file-pen", color: getColorForAction("edit") };
    }
    if (name === "purchase_invoice_line_added") {
        return { icon: "file-plus", color: getColorForAction("new") };
    }
    if (name === "purchase_invoice_line_updated") {
        return { icon: "file-pen", color: getColorForAction("edit") };
    }

    // Default fallback
    return { icon: "clock", color: "text-muted-foreground" };
};

export interface FetchEventsResult {
    events: Event[];
    next_page_token: string | null;
}

/**
 * Fetch events for an entity by routing to the correct API based on entityId prefix.
 * Prefixes: wo_ → work orders, od_ → orders, cl_ → clients. Uses query and page_token for search and pagination.
 * For unknown prefixes, returns empty result.
 */
export async function fetchEventsForEntity(
    orgId: string,
    entityId: string,
    query?: string,
    pageToken?: string
): Promise<FetchEventsResult> {
    const empty: FetchEventsResult = { events: [], next_page_token: null };

    if (!entityId || !orgId) return empty;

    const entityType = getEntityTypeFromId(entityId);
    if (!entityType) return empty;

    let response: { success?: { events?: Event[]; items?: Event[]; next_page_token?: string }; error?: unknown };
    try {
        switch (entityType) {
            case "work_order":
                response = await getWorkOrderEvents(orgId, entityId, query, pageToken);
                break;
            case "order":
                response = await getOrderEvents(orgId, entityId, query, pageToken);
                break;
            case "client":
                response = await getClientEvents(orgId, entityId, query, pageToken);
                break;
            case "sales_invoice":
                response = await getSalesInvoiceEvents(orgId, entityId, query, pageToken);
                break;
            case "purchase_invoice":
                response = await getPurchaseInvoiceEvents(orgId, entityId, query, pageToken);
                break;
            /* TODO: Add more entity types here ( Like ticket, invoice, etc.)*/
            case "ticket":
                response = await getOrgTicketEvents(orgId, entityId, query, pageToken);
                break;
            default:
                return empty;
        }
    } catch {
        return empty;
    }

    if (!response.success) return empty;

    const raw = response.success;
    const events = (raw.events ?? raw.items ?? []) as Event[];
    const next_page_token = raw.next_page_token ?? null;

    return { events, next_page_token };
}
