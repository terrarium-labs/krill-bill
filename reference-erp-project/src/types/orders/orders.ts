
import { Location } from "../general/location";
import { Supplier } from "../suppliers/supplier";
import { Origin } from "../general/origin";

export type OrderStatus = "draft" | "pending" | "paid" | "partially_received" | "received" | "cancelled";

export interface OrdersMetadata {
    subtotal: number;
    taxes: number;
    total: number;
}

export interface Order {
    id: string;
    serial_number: string | null;
    name: string;
    notes: string;
    order_date: string;
    supplier: Supplier;
    supplier_reference: string;
    internal_reference: string;
    origin: Origin;
    status: OrderStatus;
    is_paid: boolean;
    location: Location;
    address_line_1: string;
    address_line_2: string;
    postal_code: string;
    city: string;
    state_province: string;
    country: string;
    due_date: string;
    order_type: {
        id: string;
        name: string;
        description: string;
        parent_type: {
            id: string;
            name: string;
        };
    } | null;
    subtotal: number;
    taxes: {
        tax: string;
        is_negative: boolean;
        amount: number;
    }[];
    total_price: number;
    num_items: number;
    num_items_delivered: number;
}