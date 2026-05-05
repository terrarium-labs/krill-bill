import { createContext, useContext } from "react";

export type TimeRecordsSummaryExpandContextValue = {
    /** Total `<th>` / `<td>` columns in the parent summary table (including expand). */
    columnCount: number;
};

export const TimeRecordsSummaryExpandContext =
    createContext<TimeRecordsSummaryExpandContextValue | null>(null);

export function useTimeRecordsSummaryExpand() {
    return useContext(TimeRecordsSummaryExpandContext);
}
