export type StatusCategory = 'not_started' | 'active' | 'done' | 'closed';

export interface Status {
    id: string;
    name: string;
    description: string | null;
    category: StatusCategory | null;
    position: number | null;
    color: string | null;
}

export interface StatusTemplate {
    id: string;
    name: string;
    description: string | null;
    statuses: Status[];
    is_default: boolean;
    color: string | null;
}