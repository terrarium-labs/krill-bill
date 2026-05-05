export type TicketWorkOrderPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface TicketWorkOrderType {
    id: string;
    name: string;
    description: string;
    color: string;
}

export interface TicketWorkOrderTypeResponse {
    tickets_wo_types: TicketWorkOrderType[];
    next_page_token: string;
}

export interface TicketWorkOrderTypeSingle {
    ticket_wo_type: TicketWorkOrderType;
}

export interface TicketWorkOrderTypeCreate {
    name: string;
    description: string;
    color: string;
}

export interface TicketWorkOrderTypeUpdate {
    name?: string;
    description?: string;
    color?: string;
}
