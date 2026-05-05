import { BasicClient as Client } from "@/types/clients/client";
import { Location } from "@/types/general/location";
import { Employee } from "@/types/employees/employees";
import { Checklist } from "@/types/general/checklists";
import { Status } from "@/types/general/status-templates";
import { TypeOfCharge } from "@/types/financials/type-of-charge";
import { Assignee } from "./assignees";
import { Origin } from "@/types/general/origin";
import { TicketWorkOrderType, TicketWorkOrderPriority } from "@/types/field-service/ticket-work-order-types";

export type WorkOrderReasonNotCompleted = "coordinate_with_client"
    | "incomplete_material"
    | "wrong_material"
    | "required_material"
    | "special_resources_required"
    | "pending_external_contractor"
    | "pending_subcontract"
    | "quotation_required"
    | "repair_not_completed"
    | "leak_inspection"
    | "establishment_closed"
    | "breakdown_follow_up_visit"
    | "others";


export interface WorkOrder {
    id: string;
    type: TicketWorkOrderType | null;
    client: Client | null;
    location: Location | null;
    status: Status;
    priority: TicketWorkOrderPriority | null;
    task_list: any | null;
    ai_insights: string | null;
    time_estimate: number | null;
    completion_time?: number | null;
    start_date: string | null;
    due_date: string | null;
    name: string | null;
    description: string | null;
    parent_work_order_id: string | null;
    created_by: Employee;
    created_at: string;
    updated_at: string | null;
    has_children: boolean;
    sections: any[] | null;
    origin: Origin | null;
    assignees: Assignee[] | undefined;
    supervisors: Employee[] | undefined;
    type_of_charge: TypeOfCharge;
    reason_not_completed: WorkOrderReasonNotCompleted | null;
    difficulty: number | null;
    actual_difficulty?: number | null;
    number_of_technicians: number | null;
    resolution_comment: string | null;
    internal_resolution_comment: string | null;
    ticket_description: string | null;
    client_reference: string | null;
    special_checks: string | null;
    is_billed: boolean;
    is_paid: boolean;
}

export interface WorkOrderTimeTracking {
    id: string;
    start_time: string;
    end_time: string;
    user: Employee;
}

export interface WorkOrderChecklist {
    id: string;
    checklist: Checklist;
    completed: any;
}