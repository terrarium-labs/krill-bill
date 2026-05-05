export interface Checklist {
    id: string;
    name: string;
    description?: string;
    data: any;
    completed: any;
    completed_at?: string;
}