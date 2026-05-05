import { Item } from "@/types/items/items";
import { TaxType } from "@/types/miscelanea";

interface DueDate {
    id: string;
    due_date: string;
    quantity: number;
}

export interface OrderItem {
    id: string;
    item: Item;
    name: string;
    description: string;
    quantity: number;
    received_quantity: number;
    price: number;
    taxes: TaxType[];
    due_dates: DueDate[];
}