import { Employee } from "../employees/employees";


export interface OvertimeRule {
    id: string;
    name: string;
}

export interface OvertimeHoursSummary {
    overtime_hours: number;
    overtime_rule: OvertimeRule;
}

export interface TimeRecordSummary {
    employee: Employee | null;
    /** Some API responses send the id here when `employee` is omitted. */
    employee_id?: string;
    total_time_worked: number;
    theoretical_time_worked: number;
    day: string;
    /** True when this summary row is awaiting verification (replaces legacy API field `is_pending`). */
    pending: boolean;
    /**
     * Verification state from the API (e.g. `pending`, `approved`, `rejected`). If omitted, `pending` is used.
     * If `null`, empty, or the literal `"null"`, there is no status (nothing to verify / no records for the day).
     */
    status?: "approved" | "rejected" | "pending" | null;
    overtime_hours_summary: OvertimeHoursSummary[];
}