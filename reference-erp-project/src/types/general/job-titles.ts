export interface JobTitle {
    id: string;
    name: string;
    description: string | null;
    num_employees: number | null;
    pmc: number | null;
    pvp: number | null;
    created_at: string;
}