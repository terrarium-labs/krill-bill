import { Item } from "@/types/items/items";
import { Employee } from "@/types/employees/employees";

export interface DeliveryItem {
    id?: string;
    item_id: string;
    item?: Item;
    quantity: number;
    notes?: string;
}

export interface Delivery {
    id: string;
    delivery_date: string;
    num_order_items: number;
    notes: string;
    document_reference?: string;
    created_by?: Employee;
    created_at?: string;
    updated_at?: string;
}

export interface DeliveryFormData {
    delivery_date: string;
    delivery_items: {
        item_id: string;
        quantity: number;
        notes?: string;
    }[];
    notes: string;
    document_reference?: string;
}