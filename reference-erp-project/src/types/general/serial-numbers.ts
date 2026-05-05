export interface SerialNumber {
    id: string;
    entity: SerialNumberEntity;
    name: string;
    value: string;
    last_num_value: number;
}

export type SerialNumberEntity = "orders" | "sales_invoices" | "purchase_invoices";