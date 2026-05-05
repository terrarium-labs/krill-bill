import { WorkOrder } from "@/types/field-service/work-orders/work-orders";

export interface Dependency {
    parent_work_orders: WorkOrder[];
    child_work_orders: WorkOrder[];
}