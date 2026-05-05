export interface OrderTypeParent {
    id: string;
    name: string;
}

export interface OrderType {
    id: string;
    name: string;
    description: string;
    parent_type: OrderTypeParent | null;
}

export interface OrderTypeResponse {
    order_types: OrderType[];
    next_page_token: string;
}

export interface OrderTypeSingle {
    order_type: OrderType;
}

export interface OrderTypeCreate {
    name: string;
    description: string;
    parent_type_id?: string;
}

export interface OrderTypeUpdate {
    name?: string;
    description?: string;
    parent_type_id?: string;
}
