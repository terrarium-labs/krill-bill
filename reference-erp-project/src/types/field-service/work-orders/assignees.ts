import { Employee } from "@/types/employees/employees";

export interface Assignee {
    employee: Employee;
    notes: string;
    cancelled_at: string | null;
    created_at: string;
    updated_at: string;
}