import { Employee } from "@/types/employees/employees";

export interface TimeTracking {
    id: string;
    start_time: string;
    end_time: string;
    user: Employee;
}