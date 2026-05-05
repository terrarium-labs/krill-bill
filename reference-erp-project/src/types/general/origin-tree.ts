import { WorkOrder } from "@/types/field-service/work-orders/work-orders";
import { Order } from "../orders/orders";
import { Ticket } from "../field-service/tickets/tickets";

export type OriginItemType = "work_order" | "order" | "ticket" | "invoice";

export interface OriginItemParentEntity {
    id: string;
    name: string;
}

export interface OriginItem {
    type: OriginItemType;
    parent_entity: OriginItemParentEntity;
    entity: WorkOrder | Order | Ticket;
}

export interface OriginTree {
    origin_tree: OriginItem[];
}