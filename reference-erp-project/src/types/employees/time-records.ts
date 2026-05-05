import { Employee } from "./employees";

export interface TimeRecord {
    id: string;
    employee: Employee;
    start_time: string;
    end_time: string;
    notes: string | null;
    verified_by: Employee | null;
    verified_at: string | null;
    verification_status: "approved" | "rejected" | "pending";
    verification_notes: string | null;
    last_modified_by: Employee | null;
    created_at: string;
    updated_at: string;
}