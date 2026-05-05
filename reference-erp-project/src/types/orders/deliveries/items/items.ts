import { OrderItem } from "@/types/orders/items/items";

export interface DeliveryOrderItem {
    id: string;
    order_item: OrderItem;
    quantity: number;
}
