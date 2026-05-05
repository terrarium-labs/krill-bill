import { TaxType } from "../miscelanea";
import { BasicClient } from "../clients/client";

export interface CommutingRate {
    id: string;
    name: string;
    status: "active" | "inactive";
    due_date: string | null;
    valid_from: string | null;
    description: string | null;
    is_fixed_price: boolean;
    fixed_price: number | null;
    is_price_per_km: boolean;
    price_per_km: number | null;
    min_price: number | null;
    is_travel_time_billable: boolean;
    number_of_locations: number | null;
    created_at: string;
    taxes?: TaxType[];
}

export interface CommutingRateClient {
    client: BasicClient;
    number_of_locations: number;
}