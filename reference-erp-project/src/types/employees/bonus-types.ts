import { BonusType } from "@/types/general/bonus-types";

export interface BonusTypeEmployee {
    id: string;
    org_bonus_type: BonusType;
    amount: number;
    created_at: string;
}
