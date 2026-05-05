export interface Currency {
    id: string | null;
    name: string;
    symbol: string;
    is_fixed: boolean;
    exchange_rate: number;
    updated_at: string;
}