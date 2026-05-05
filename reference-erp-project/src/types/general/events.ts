import { Employee } from "../employees/employees";

export type EventEntityType = "work_order" | "order" | "ticket";

export type EventName =
    // Contact events
    | "contact_created"
    | "contact_updated"
    | "contact_deleted"
    // Payment method events
    | "payment_method_created"
    | "payment_method_updated"
    | "payment_method_deleted"
    | "payment_method_default"
    // Location events
    | "location_created"
    | "location_updated"
    | "location_deleted"
    // Client events
    | "client_created"
    | "client_updated"
    | "client_deleted"
    // Work order events
    | "work_order_created"
    | "work_order_updated"
    | "employee_assigned"
    | "employee_unassigned"
    // Inventory events
    | "inventory_added"
    | "inventory_removed"
    // Time tracking events
    | "time_tracking_registered"
    // Checklist events
    | "checklist_added"
    | "checklist_deleted"
    | "checklist_updated"
    // Order events
    | "order_created"
    | "order_approved"
    | "order_cancelled"
    | "order_updated"
    | "order_items_added"
    | "order_delivery_added"
    | "order_tracking_added"
    | "order_invoice_created"
    // Invoice and quote events
    | "invoice_added_to_order"
    | "invoice_created"
    | "quote_created"
    // Message events
    | "new_message_added"
    // Client stakeholder events
    | "client_stakeholder_added"
    | "client_stakeholder_removed"
    | "client_stakeholder_updated";

export interface Event {
    id: string,
    title: string,
    event_name: string,
    description: string,
    created_at: string,
    employee: Employee,
    entity_related: {
        id: string,
        type: EventEntityType,
        name: string,
        info: string | null
    } | null
}