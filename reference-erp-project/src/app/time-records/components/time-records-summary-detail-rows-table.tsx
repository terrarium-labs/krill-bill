import { useTranslation } from "@/hooks/useTranslation";
import { memo, useMemo } from "react";
import { TableRow as TableRowRaw, TableCell as TableCellRaw } from "@/components/ui/table";
import { Clock } from "lucide-react";
import type { TimeRecord } from "@/types/employees/time-records";
import { cn } from "@/lib/utils";
import IdBadge from "@/app/components/id-badge";
import DurationLabel from "@/app/components/labels/duration-label";
import { formatTime } from "@/utils/miscelanea";
import Tag from "@/app/components/tag/tag";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import { SummaryAlignedColGroup } from "@/app/time-records/components/summary-aligned-colgroup";
import { SUMMARY_EXPAND_COLUMN_TD_CLASS } from "@/app/time-records/utils/summary-expand-layout";
import { useTimeRecordsSummaryExpand } from "@/app/time-records/context/TimeRecordsSummaryExpandContext";
import {
    getTimeRecordVerificationRowStyle,
    TIME_RECORD_DETAIL_ROW_HOVER,
} from "@/app/time-records/utils/time-record-detail-row-style";
import type { ReactNode } from "react";

const timeFmtOpts = { useUTC: false as const };

function formatTimeRangeClockOnly(startIso: string, endIso: string | null | undefined) {
    const startT = formatTime(startIso, timeFmtOpts);
    if (!endIso) return startT;
    return `${startT} - ${formatTime(endIso, timeFmtOpts)}`;
}

/** Matches parent balance column when balance is 0 (`pl-6` on the inner value). */
const BALANCE_ALIGNED_INNER_CLASS = "pl-6";

/** Rows with approve/reject icon buttons use tighter vertical padding. */
const DETAIL_CELL_COMPACT = "px-2 py-1";
/** Rows without those actions (skeleton, approved/rejected-only dropdown) use default table padding. */
const DETAIL_CELL_COMFORT = "px-2 py-2";

function expandCellClass(tallVertical: boolean) {
    return cn(SUMMARY_EXPAND_COLUMN_TD_CLASS, tallVertical ? "!py-2" : "!py-1");
}

export interface TimeRecordsSummaryDetailRowsTableProps {
    timeRecords: TimeRecord[];
    isLoading: boolean;
    renderActions: (timeRecord: TimeRecord, allTimeRecords: TimeRecord[]) => ReactNode;
}

const TimeRecordsSummaryDetailRowsTableComponent = ({
    timeRecords,
    isLoading,
    renderActions,
}: TimeRecordsSummaryDetailRowsTableProps) => {
    const { t } = useTranslation();
    const expandCtx = useTimeRecordsSummaryExpand();
    /** Must match parent summary table: expand | day | employee | time_worked | balance | overtime | pending | actions */
    const columnCount = expandCtx?.columnCount ?? 7;

    const { wrapRowWithContextMenu } = useTableContextMenu<TimeRecord>(renderActions, timeRecords);

    const body = useMemo(() => {
        if (isLoading && timeRecords.length === 0) {
            const skStyle = getTimeRecordVerificationRowStyle(null);
            return (
                <>
                    {[0, 1].map((i) => (
                        <TableRowRaw key={`sk-${i}`} className="border-b border-border/60">
                            {Array.from({ length: columnCount }).map((_, j) => (
                                <TableCellRaw
                                    key={j}
                                    className={cn(
                                        j === 0
                                            ? cn(
                                                  expandCellClass(true),
                                                  skStyle.borderLeft,
                                                  skStyle.bg,
                                                  TIME_RECORD_DETAIL_ROW_HOVER,
                                              )
                                            : cn(DETAIL_CELL_COMFORT, skStyle.bg, TIME_RECORD_DETAIL_ROW_HOVER),
                                    )}
                                >
                                    {j === 0 ? null : (
                                        <Skeleton className="h-6 w-full animate-pulse rounded-md" />
                                    )}
                                </TableCellRaw>
                            ))}
                        </TableRowRaw>
                    ))}
                </>
            );
        }

        if (!timeRecords.length) {
            return (
                <TableRowRaw className="hover:bg-transparent">
                    <TableCellRaw
                        className="h-40 text-center hover:bg-transparent"
                        colSpan={columnCount}
                    >
                        <div className="flex flex-col items-center justify-center gap-2 py-6">
                            <Clock className="h-10 w-10 text-muted-foreground" />
                            <h3 className="text-lg font-medium">
                                {t("employees.timeRecords.noTimeRecordsTitle", "No time records yet")}
                            </h3>
                            <p className="text-muted-foreground">
                                {t(
                                    "employees.timeRecords.noTimeRecordsDescription",
                                    "Time records will appear here",
                                )}
                            </p>
                        </div>
                    </TableCellRaw>
                </TableRowRaw>
            );
        }

        return timeRecords.map((record) => {
            const rowStyle = getTimeRecordVerificationRowStyle(record.verification_status);
            const status = record.verification_status;
            /** No approve/reject icon row — only dropdown (same as rows without that action UI). */
            const withoutPrimaryActions =
                status === "approved" || status === "rejected";
            const detailCell = withoutPrimaryActions ? DETAIL_CELL_COMFORT : DETAIL_CELL_COMPACT;
            const notes = record.verification_notes;
            const statusLabel = String(record.verification_status ?? "pending");

            const statusCell = !notes ? (
                <div className="capitalize">
                    <Tag text={statusLabel} className="capitalize" />
                </div>
            ) : (
                <Tooltip>
                    <TooltipTrigger>
                        <div className="cursor-pointer capitalize">
                            <Tag text={statusLabel} className="capitalize" />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                        {notes}
                    </TooltipContent>
                </Tooltip>
            );

            const timeRangeCell = (
                <span className="text-sm tabular-nums">
                    {formatTimeRangeClockOnly(record.start_time, record.end_time)}
                </span>
            );

            const row = (
                <TableRowRaw key={record.id} className="border-b border-border/60">
                    <TableCellRaw
                        className={cn(
                            expandCellClass(withoutPrimaryActions),
                            rowStyle.borderLeft,
                            rowStyle.bg,
                            TIME_RECORD_DETAIL_ROW_HOVER,
                        )}
                        aria-hidden
                    />
                    <TableCellRaw className={cn(detailCell, rowStyle.bg, TIME_RECORD_DETAIL_ROW_HOVER)}>
                        <IdBadge
                            id={record.id}
                            hideIcon
                            customTooltip={t("common.copyId", "Copy ID")}
                        />
                    </TableCellRaw>
                    <TableCellRaw className={cn(detailCell, "text-sm", rowStyle.bg, TIME_RECORD_DETAIL_ROW_HOVER)}>
                        {timeRangeCell}
                    </TableCellRaw>
                    <TableCellRaw className={cn(detailCell, rowStyle.bg, TIME_RECORD_DETAIL_ROW_HOVER)}>
                        <div className={BALANCE_ALIGNED_INNER_CLASS}>
                            <DurationLabel
                                startDate={record.start_time}
                                endDate={record.end_time}
                                showElapsedTime
                                showLiveBadge
                            />
                        </div>
                    </TableCellRaw>
                    <TableCellRaw className={cn(detailCell, rowStyle.bg, TIME_RECORD_DETAIL_ROW_HOVER)}>
                        <span className="text-sm text-muted-foreground">-</span>
                    </TableCellRaw>
                    <TableCellRaw className={cn(detailCell, rowStyle.bg, TIME_RECORD_DETAIL_ROW_HOVER)}>
                        {statusCell}
                    </TableCellRaw>
                    <TableCellRaw
                        className={cn(
                            "sticky right-0 border-b px-2 shadow-[inset_1px_0_0_0_hsl(var(--border))]",
                            withoutPrimaryActions ? "py-2" : "py-1",
                            rowStyle.bg,
                            TIME_RECORD_DETAIL_ROW_HOVER,
                        )}
                    >
                        <div className="flex w-[120px] items-center justify-end pr-4">
                            {renderActions(record, timeRecords)}
                        </div>
                    </TableCellRaw>
                </TableRowRaw>
            );

            return wrapRowWithContextMenu(record, row);
        });
    }, [columnCount, isLoading, renderActions, t, timeRecords, wrapRowWithContextMenu]);

    return (
        <div className="w-full min-w-0 overflow-x-auto">
            <table className="w-full caption-bottom border-collapse text-sm table-fixed">
                <SummaryAlignedColGroup columnCount={columnCount} />
                <tbody>{body}</tbody>
            </table>
        </div>
    );
};

export const TimeRecordsSummaryDetailRowsTable = memo(TimeRecordsSummaryDetailRowsTableComponent);

export default TimeRecordsSummaryDetailRowsTable;
