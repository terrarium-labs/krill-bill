import type { TimeRecordSummary } from "@/types/general/time-records";

/** Raw API row may still send `is_pending`; we normalize to `pending` in the app. */
export type TimeRecordSummaryApiRow = Omit<
    TimeRecordSummary,
    "pending" | "overtime_hours_summary"
> & {
    pending?: boolean;
    is_pending?: boolean;
    /** Present on newer API responses; normalized to `[]` when omitted. */
    overtime_hours_summary?: TimeRecordSummary["overtime_hours_summary"];
};

export function normalizeTimeRecordSummary(row: TimeRecordSummaryApiRow): TimeRecordSummary {
    const pending =
        typeof row.pending === "boolean" ? row.pending : Boolean(row.is_pending);
    return {
        employee: row.employee,
        employee_id: row.employee_id,
        total_time_worked: row.total_time_worked,
        theoretical_time_worked: row.theoretical_time_worked,
        day: row.day,
        pending,
        status: row.status,
        overtime_hours_summary: row.overtime_hours_summary ?? [],
    };
}

/**
 * True when the API included `status` but it means “no status” (not verified nor pending):
 * `null`, empty, or the literal string `"null"` (no records / nothing to verify).
 */
export function isExplicitNoStatus(status: string | null | undefined): boolean {
    if (status === undefined) return false;
    if (status === null || status === "") return true;
    const t = String(status).trim().toLowerCase();
    return t === "" || t === "null";
}

/** True when `status` was omitted from the payload — use `pending` as the boolean signal. */
export function isStatusFieldMissing(status: string | null | undefined): boolean {
    return status === undefined;
}

/** Row is awaiting verification: show approve/reject actions. Uses `status === "pending"` or `pending` when `status` is omitted. */
export function isSummaryPendingVerification(summary: TimeRecordSummary): boolean {
    if (isExplicitNoStatus(summary.status)) {
        return false;
    }
    if (isStatusFieldMissing(summary.status)) {
        return summary.pending;
    }
    return String(summary.status).trim().toLowerCase() === "pending";
}

/**
 * Parent summary row may expand to detail when there is time worked **or** a verification status
 * (pending, approved, rejected, etc.). Rows with no time and no meaningful status stay collapsed.
 */
export function summaryRowCanExpand(summary: TimeRecordSummary): boolean {
    if (summary.total_time_worked > 0) {
        return true;
    }
    if (isStatusFieldMissing(summary.status)) {
        return summary.pending;
    }
    if (isExplicitNoStatus(summary.status)) {
        return false;
    }
    return true;
}
