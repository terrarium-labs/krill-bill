import { ItemHierarchy } from "./taxonomy";
import { BasicClient } from "../clients/client";

export interface RateItemHierarchy extends ItemHierarchy {
    rate_margin: number | null;
    discount_rate: number | null;
}

export interface Rate {
    id: string;
    name: string;
    status: "active" | "inactive";
    due_date: string;
    valid_from: string;
    item_hierarchies: RateItemHierarchy[];
}

export interface RateClient extends BasicClient {}
