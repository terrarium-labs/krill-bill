export interface BonusType {
    id: string;
    org_id: string;
    name: string;
    description: string | null;
    amount: number;
    created_at: string;
    updated_at: string;
}
