import { SectionField } from "../general/custom_fields";
import { ItemHierarchy } from "../general/taxonomy";

// Item measure types
export type ItemMeasure = "cm" | "m" | "kg" | "g" | "l" | "ml" | "uts" | "pcs" | "hrs";

// Price types
export type PriceType = "sell" | "buy";

export type BillingType = "one-off" | "recurring";

export type BillingPeriod = "daily" | "weekly" | "monthly" | "yearly";

export type PriceModel = "flat-rate";

export type WarrantyUnit = "days" | "weeks" | "months" | "years";

export type PricingMode = "margin_fixed" | "price_fixed";

export type ItemPhoto = {
    id?: string;
    name: string;
    url: string;
    position?: number | null;
};

// Price interface (for creating/updating)
export interface ItemPrice {
    type: PriceType;
    is_default?: boolean | null;
    priority?: number | null;
    price_quantity?: number | null;
    price_currency?: string | null;
    margin?: number | null;
    billing_type: BillingType;
    billing_period?: BillingPeriod | null;
    price_model: PriceModel;
    pricing_mode: PricingMode;
    tax_included: boolean;
    taxes?: string[] | null;
    warranty_period?: number | null;
    warranty_unit?: WarrantyUnit | null;
    notes?: string | null;
    rate_id?: string | null;
    rate_name?: string | null;
    supplier_id?: string | null;
    supplier_barcode?: string | null;
    supplier_pvp?: number | null;
    supplier_discount?: number | null;
}

// Price response interface (includes id and timestamps)
export interface ItemPriceResponse extends ItemPrice {
    id: string;
    item_id: string;
    org_id: string;
    created_at: string;
    updated_at: string;
    supplier?: {
        id: string;
        trade_name: string;
        photo_url: string;
        supplier_name: string;
    }
}

// Create item request interface
export interface CreateItemRequest {
    type?: "item" | "bundle";
    item_code?: string | null;
    name: string;
    description?: string | null;
    measure?: ItemMeasure | null;
    sections?: SectionField[] | null;
    item_hierarchy_id?: string | null;
    is_pmc_fixed?: boolean | null;
    barcode?: string | null;
    pmc?: number | null;
    cost_calc_days?: number | null;
    photos?: ItemPhoto[] | null;
    prices?: ItemPrice[] | null;
}

// Item interface (for responses)
export interface Item extends CreateItemRequest {
    id: string;
    org_id: string | null;
    created_at: string | null;
    updated_at: string | null;
    total_stock?: number | null;
    buy_price?: ItemPrice | null;
    sell_price?: ItemPrice | null;
    item_hierarchy?: ItemHierarchy[] | null;
}

