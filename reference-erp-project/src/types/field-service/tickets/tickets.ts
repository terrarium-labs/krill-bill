import { BasicClient } from "@/types/clients/client"
import { Employee } from "@/types/employees/employees";
import { BasicLocation } from "@/types/general/location";
import { BasicInventory } from "@/types/clients/inventory";
import { TicketWorkOrderType, TicketWorkOrderPriority } from "../ticket-work-order-types";

export interface Ticket {
    id: string,
    type: TicketWorkOrderType,
    client_reference: string | null,
    client: BasicClient,
    location: BasicLocation | null,
    supervisors: Employee[] | null,
    inventory: BasicInventory | null,
    priority: TicketWorkOrderPriority,
    status: "in_progress" | "closed",
    description: string | null,
    resolution: string | null,
    created_at: string,
    updated_at: string,
    closed_at: string | null,
    contact_first_name: string | null,
    contact_last_name: string | null,
    contact_email: string | null,
    contact_phone: string | null,
    locked_by?: {
        employee: Employee;
        locked_at: string;
    } | null;
    ai_insights?: string | null;
    ai_insights_level?: TicketWorkOrderPriority
    ai_insights_updated_at?: string | null;
}