export type TimeRecordVerificationRowStyle = {
    /** Left accent (on first cell), same pattern as tickets `border-l-2` + color */
    borderLeft: string;
    /** Subtle row background (all cells, including sticky actions) */
    bg: string;
};

/**
 * Row chrome for expanded time-record detail rows: `border-l-2` + light tint, like
 * `tickets-table` insight/locked rows, keyed by verification status.
 * `null` / empty → slate.
 */
export function getTimeRecordVerificationRowStyle(
    verificationStatus: string | null | undefined,
): TimeRecordVerificationRowStyle {
    const key = verificationStatus?.toLowerCase() ?? null;
    if (key == null || key === "") {
        return {
            borderLeft: "border-l-2 border-l-slate-400 dark:border-l-slate-600",
            bg: "bg-slate-500/5 dark:bg-slate-500/10",
        };
    }
    switch (key) {
        case "approved":
            return {
                borderLeft: "border-l-2 border-l-green-400 dark:border-l-green-600",
                bg: "bg-green-500/5 dark:bg-green-500/10",
            };
        case "rejected":
            return {
                borderLeft: "border-l-2 border-l-red-400 dark:border-l-red-600",
                bg: "bg-red-500/5 dark:bg-red-500/10",
            };
        case "pending":
            return {
                borderLeft: "border-l-2 border-l-yellow-400 dark:border-l-yellow-600",
                bg: "bg-yellow-500/5 dark:bg-yellow-500/10",
            };
        default:
            return {
                borderLeft: "border-l-2 border-l-slate-400 dark:border-l-slate-600",
                bg: "bg-slate-500/5 dark:bg-slate-500/10",
            };
    }
}

/** Hover overlay matching tickets table body rows (`hover:bg-muted/50`). */
export const TIME_RECORD_DETAIL_ROW_HOVER = "hover:bg-muted/50";
