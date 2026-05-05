import type { TimeRecordSummary } from "@/types/general/time-records";

export function getSummaryRowKey(summary: TimeRecordSummary): string {
    return `${summary.day}|${summary.employee?.id ?? ""}`;
}
