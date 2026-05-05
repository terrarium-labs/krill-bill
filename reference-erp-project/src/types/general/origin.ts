export type OriginType = "ticket" | "order" | "work_order" | "location" | "inventory";

export interface Origin {
    id: string;
    name: string;
    type: OriginType;
}