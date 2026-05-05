export interface IndirectCostRange {
    from_quantity: number;
    to_quantity: number | null;
    value: number;
}

export interface IndirectCost {
    id: string;
    name: string;
    description: string | null;
    entity: IndirectCostEntity;
    is_percentage: boolean;
    ranges: IndirectCostRange[];
    is_active?: boolean;
}

export const INDIRECT_COST_ENTITIES = ["work_orders"] as const;
export type IndirectCostEntity = (typeof INDIRECT_COST_ENTITIES)[number];
