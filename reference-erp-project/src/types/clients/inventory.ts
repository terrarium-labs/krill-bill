import { Item } from "../items/items";

export interface BasicInventory {
    id: string,
    name: string,
}

export interface Inventory extends BasicInventory {
    parent?: {
        id: string,
        name: string,
    },
    item?: Item,
    serial_number: string,
    is_service: boolean,
    description: string,
    location_id: string,
    location_name: string,
    created_at: string,
}

