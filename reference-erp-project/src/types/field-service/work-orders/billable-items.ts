import { TaxType } from "@/types/miscelanea";

export interface WorkOrderBillableItemRequest {
    id?: string | null;
    item_id?: string | null;
    name?: string | null;
    description?: string | null;
    quantity?: number | null;
    price?: number | null;
    cost_price?: number | null;
    discount?: number | null;
    order?: number | null;
    taxes_ids?: string[] | null;
    type?: 'material' | 'hour' | 'commuting' | null;
}

export interface WorkOrderBillableItem {
    id: string | null;
    item: { id: string; name: string; description?: string | null; photos?: any[]; [key: string]: any } | null;
    name: string | null;
    description: string | null;
    quantity: number | null;
    price: number | null;
    cost_price: number | null;
    discount: number | null;
    order: number;
    taxes: TaxType[];
    type: 'material' | 'hour' | 'commuting' | null;
}

export interface BillableItemsCalculations {
    subtotal: number;
    discountAmount: number;
    subtotalAfterDiscount: number;
    taxesByType: Record<string, number>;
    totalTaxes: number;
    total: number;
    totalCostPrice: number;
    totalMargin: number | null;
}
