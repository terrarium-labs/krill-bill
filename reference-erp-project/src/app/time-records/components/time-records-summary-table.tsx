import { useTranslation } from "@/hooks/useTranslation";
import { memo, useMemo } from "react";
import {
    TableProvider,
    TableHeader,
    TableHeaderGroup,
    TableHead,
    TableBody,
    TableCell,
    TableColumnHeader,
    type ColumnDef,
    type ColumnOrderState,
    type ColumnSizingState,
    type VisibilityState,
} from "@/components/ui/shadcn-io/table";
import type { OnChangeFn } from "@tanstack/react-table";
import {
    TableRow as TableRowRaw,
    TableCell as TableCellRaw,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Clock, ArrowUp, ArrowDown, Check, X, ChevronDown, Info } from "lucide-react";
import {
    type OvertimeHoursSummary,
    type TimeRecordSummary,
} from "@/types/general/time-records";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { formatDate, isFutureDay } from "@/utils/miscelanea";
import { Employee } from "@/types/employees/employees";
import EmployeeLabel from "@/app/components/labels/employee-label";
import Tag from "@/app/components/tag/tag";
import {
    isExplicitNoStatus,
    isStatusFieldMissing,
    isSummaryPendingVerification,
    summaryRowCanExpand,
} from "@/app/time-records/utils/summary-status";
import { getSummaryRowKey } from "@/app/time-records/utils/summary-row-key";
import { SUMMARY_EXPAND_COLUMN_TD_CLASS } from "@/app/time-records/utils/summary-expand-layout";
import { SummaryAlignedColGroup } from "@/app/time-records/components/summary-aligned-colgroup";
import { TimeRecordsSummaryExpandContext } from "@/app/time-records/context/TimeRecordsSummaryExpandContext";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const EMPTY_EXPANDED_ROW_KEYS = new Set<string>();

export type TimeRecordsSummaryTableColumnKey =
    | "day"
    | "employee"
    | "time_worked"
    | "balance"
    | "overtime"
    | "pending"
    | "actions";

export interface TimeRecordsSummaryTableProps {
    timeRecordsSummary: TimeRecordSummary[];
    isLoading: boolean;
    /** Columns to hide from the table, accepts array or single string */
    hiddenColumns?: TimeRecordsSummaryTableColumnKey[] | TimeRecordsSummaryTableColumnKey;
    /** Custom render function for the actions column. If not provided, default actions will be shown */
    renderActions?: (summary: TimeRecordSummary, allSummaries: TimeRecordSummary[]) => ReactNode;
    /** Called when a row is clicked (optional) */
    onRowClick?: (summary: TimeRecordSummary) => void;
    /** When true, first column is expand control; row expands to show `renderExpandedContent` (no `onRowClick` for expand — pass undefined). */
    expandableDetail?: boolean;
    expandedRowKeys?: ReadonlySet<string>;
    onToggleExpandedRow?: (rowKey: string) => void;
    renderExpandedContent?: (summary: TimeRecordSummary) => ReactNode;
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const TimeRecordsSummaryTableComponent = ({
    timeRecordsSummary,
    isLoading,
    hiddenColumns = [],
    renderActions,
    onRowClick,
    expandableDetail = false,
    expandedRowKeys = EMPTY_EXPANDED_ROW_KEYS,
    onToggleExpandedRow,
    renderExpandedContent,
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: TimeRecordsSummaryTableProps) => {
    const { t } = useTranslation();

    const hiddenColumnsArray = useMemo(() => {
        if (Array.isArray(hiddenColumns)) return hiddenColumns;
        return hiddenColumns ? [hiddenColumns] : [];
    }, [hiddenColumns]);

    const effectiveColumnVisibility = useMemo<VisibilityState | undefined>(() => {
        if (hiddenColumnsArray.length === 0) return columnVisibility;
        const structural = hiddenColumnsArray.reduce<VisibilityState>((acc, key) => {
            acc[key] = false;
            return acc;
        }, {});
        return { ...(columnVisibility ?? {}), ...structural };
    }, [columnVisibility, hiddenColumnsArray]);

    const formatTimeHoursMinutes = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        return `${hours}h ${mins}min`;
    };

    const formatTimeCombined = (totalMinutes: number, theoreticalMinutes: number) => {
        const total = formatTimeHoursMinutes(totalMinutes);
        const theoretical = formatTimeHoursMinutes(theoreticalMinutes);
        return `${total} / ${theoretical}`;
    };

    const calculateBalance = (totalMinutes: number, theoreticalMinutes: number) => {
        return totalMinutes - theoreticalMinutes;
    };

    const getOvertimeBreakdown = (summary: TimeRecordSummary): OvertimeHoursSummary[] =>
        summary.overtime_hours_summary ?? [];

    /** Overtime display: never shows "0h"; zero total is "0 min". */
    const formatOvertimeMinutesDisplay = (totalMinutes: number) => {
        const m = Math.max(0, Math.round(totalMinutes));
        if (m === 0) return "0 min";
        const h = Math.floor(m / 60);
        const mins = m % 60;
        if (h > 0 && mins > 0) return `${h}h ${mins}min`;
        if (h > 0) return `${h}h`;
        return `${mins} min`;
    };

    const columns = useMemo<ColumnDef<TimeRecordSummary>[]>(() => {
        const cols: ColumnDef<TimeRecordSummary>[] = [];

        if (expandableDetail) {
            cols.push({
                id: "expand",
                header: () => <span className="sr-only">{t("common.expand", "Expand")}</span>,
                enableResizing: false,
                size: 40,
                meta: {
                    className: SUMMARY_EXPAND_COLUMN_TD_CLASS,
                },
                cell: ({ row }) => {
                    const summary = row.original;
                    const canExpand = summaryRowCanExpand(summary) && !!renderExpandedContent;
                    const rowKey = getSummaryRowKey(summary);
                    const isExpanded = expandedRowKeys.has(rowKey);
                    if (!canExpand) {
                        return <div className="h-5 w-5 shrink-0" aria-hidden />;
                    }
                    return (
                        <button
                            type="button"
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleExpandedRow?.(rowKey);
                            }}
                            aria-expanded={isExpanded}
                            aria-label={t("common.expand", "Expand")}
                        >
                            <ChevronDown
                                className={cn(
                                    "h-3.5 w-3.5 transition-transform duration-200",
                                    isExpanded && "rotate-180",
                                )}
                            />
                        </button>
                    );
                },
            });
        }

        cols.push({
            accessorKey: "day",
            header: t("timeRecords.summary.day", "Day"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => {
                const day = row.getValue("day") as string;
                const isFuture = isFutureDay(day);
                const date = day ? new Date(day) : null;
                return date ? (
                    <div className={cn("text-sm font-medium", isFuture && "text-muted-foreground")}>
                        {formatDate(date, { showDayName: true, showTime: false, showMonth: false, showYear: false })}
                    </div>
                ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                );
            },
        });

        cols.push({
            accessorKey: "employee",
            header: t("employees.timeRecords.employee", "Employee"),
            enableResizing: true,
            size: 180,
            cell: ({ row }) => {
                const employee = row.original.employee as Employee;
                return <EmployeeLabel data={employee} />;
            },
        });

        cols.push({
            id: "time_worked",
            header: t("timeRecords.summary.timeWorked", "Time Worked"),
            enableResizing: true,
            size: 180,
            cell: ({ row }) => {
                const day = row.original.day;
                const isFuture = isFutureDay(day);
                const totalMinutes = row.original.total_time_worked * 60;
                const theoreticalMinutes = row.original.theoretical_time_worked * 60;
                const bothZero = totalMinutes === 0 && theoreticalMinutes === 0;
                return (
                    <div
                        className={cn(
                            "text-sm",
                            (isFuture || bothZero) && "text-muted-foreground",
                        )}
                    >
                        {formatTimeCombined(totalMinutes, theoreticalMinutes)}
                    </div>
                );
            },
        });

        cols.push({
            id: "balance",
            header: t("timeRecords.summary.balance", "Balance"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => {
                const day = row.original.day;
                const isFuture = isFutureDay(day);

                if (isFuture) {
                    return (
                        <div className="text-sm text-muted-foreground">
                            -
                        </div>
                    );
                }

                const totalMinutes = row.original.total_time_worked * 60;
                const theoreticalMinutes = row.original.theoretical_time_worked * 60;
                const balance = calculateBalance(totalMinutes, theoreticalMinutes);
                const balanceFormatted = formatTimeHoursMinutes(Math.abs(balance));

                if (balance === 0) {
                    return (
                        <span className="pl-6 text-sm text-muted-foreground">
                            {balanceFormatted}
                        </span>
                    );
                }

                return (
                    <div className="flex items-center gap-2">
                        {balance > 0 ? (
                            <ArrowUp className="h-4 w-4 text-green-500" />
                        ) : (
                            <ArrowDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm text-foreground">{balanceFormatted}</span>
                    </div>
                );
            },
        });

        // Overtime Column (visibility via effectiveColumnVisibility / columnVisibility)
        cols.push({
            id: "overtime",
            header: t("timeRecords.summary.overtime", "Overtime"),
            cell: ({ row }) => {
                const summary = row.original;
                const day = summary.day;
                const isFuture = isFutureDay(day);
                if (isFuture) {
                    return (
                        <div className="text-sm text-muted-foreground">-</div>
                    );
                }

                const breakdown = getOvertimeBreakdown(summary);
                if (breakdown.length === 0) {
                    return (
                        <span className="text-sm text-muted-foreground">-</span>
                    );
                }

                const totalHours = breakdown.reduce(
                    (acc, o) => acc + (o.overtime_hours ?? 0),
                    0,
                );
                const totalMinutes = Math.round(totalHours * 60);
                if (totalMinutes <= 0) {
                    return (
                        <span className="text-sm tabular-nums text-muted-foreground">
                            {formatOvertimeMinutesDisplay(0)}
                        </span>
                    );
                }

                const displayTotal = formatOvertimeMinutesDisplay(totalMinutes);

                return (
                    <div className="flex items-center gap-1.5 text-primary">
                        <span className="text-sm tabular-nums text-primary">
                            {displayTotal}
                        </span>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    className="inline-flex shrink-0 rounded-md text-primary outline-none hover:text-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
                                    aria-label={t(
                                        "timeRecords.summary.overtimeBreakdownAria",
                                        "Overtime breakdown by rule",
                                    )}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Info className="h-4 w-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent
                                side="top"
                                showArrow={false}
                                className="max-w-sm border border-border bg-popover p-3 text-primary shadow-md"
                                onPointerDownOutside={(e) => e.stopPropagation()}
                            >
                                <p className="mb-2 text-xs font-semibold text-primary">
                                    {t(
                                        "timeRecords.summary.overtimeBreakdownTitle",
                                        "Overtime by rule",
                                    )}
                                </p>
                                <ul className="space-y-1.5 text-xs text-primary">
                                    {breakdown
                                        .filter((item) => {
                                            const minutesValue = Math.round((item.overtime_hours ?? 0) * 60);
                                            return minutesValue !== 0;
                                        })
                                        .map((item) => (
                                            <li
                                                key={item.overtime_rule.id}
                                                className="flex items-baseline justify-between gap-4"
                                            >
                                                <span className="min-w-0 text-primary">
                                                    {item.overtime_rule.name}
                                                </span>
                                                <span className="shrink-0 tabular-nums text-primary">
                                                    {formatOvertimeMinutesDisplay(
                                                        Math.round(
                                                            (item.overtime_hours ?? 0) * 60,
                                                        ),
                                                    )}
                                                </span>
                                            </li>
                                        ))}
                                </ul>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                );
            },
        });

        cols.push({
            accessorKey: "pending",
            header: t("timeRecords.summary.status", "Status"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => {
                const day = row.original.day;
                const isFuture = isFutureDay(day);
                const summary = row.original;

                if (isFuture) {
                    return (
                        <span className="text-sm text-muted-foreground">-</span>
                    );
                }

                if (isExplicitNoStatus(summary.status)) {
                    return (
                        <span className="text-sm text-muted-foreground">-</span>
                    );
                }

                if (isStatusFieldMissing(summary.status)) {
                    const isPending = row.getValue("pending") as boolean;
                    return (
                        <div className="capitalize">
                            <Tag
                                text={isPending ? "pending" : "approved"}
                                className="capitalize"
                            />
                        </div>
                    );
                }

                const raw = String(summary.status).trim().toLowerCase();
                if (raw === "rejected") {
                    return (
                        <div className="capitalize">
                            <Tag text="rejected" className="capitalize" />
                        </div>
                    );
                }
                if (raw === "pending") {
                    return (
                        <div className="capitalize">
                            <Tag text="pending" className="capitalize" />
                        </div>
                    );
                }
                if (raw === "verified" || raw === "approved") {
                    return (
                        <div className="capitalize">
                            <Tag text="approved" className="capitalize" />
                        </div>
                    );
                }
                return (
                    <div className="capitalize">
                        <Tag text={String(summary.status).trim()} className="capitalize" />
                    </div>
                );
            },
        });

        cols.push({
            id: "actions",
            enableResizing: false,
            size: 52,
            header: ({ header }) => (
                <TableColumnHeader
                    column={header.column}
                    className="justify-center items-center flex"
                    title={""}
                />
            ),
            cell: ({ row }) => {
                const summary = row.original;
                if (renderActions) {
                    return renderActions(summary, timeRecordsSummary);
                }
                const hasPending = timeRecordsSummary.some((s) => isSummaryPendingVerification(s));

                return (
                    <div className={`flex items-center gap-2 ${hasPending ? "justify-end" : "justify-center"}`}>
                        {isSummaryPendingVerification(summary) && (
                            <>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                    }}
                                >
                                    <Check className="h-4 w-4" />
                                </Button>
                            </>
                        )}

                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("common.view", "View"),
                                    icon: "eye",
                                    onClick: () => {
                                        // TODO: Implement view action
                                    },
                                },
                            ]}
                        />
                    </div>
                );
            },
            meta: {
                sticky: "right",
            },
        });

        return cols;
    }, [
        t,
        renderActions,
        timeRecordsSummary,
        expandableDetail,
        expandedRowKeys,
        onToggleExpandedRow,
        renderExpandedContent,
    ]);

    return (
        <TimeRecordsSummaryExpandContext.Provider value={{ columnCount: columns.length }}>
            <div className="w-full overflow-x-auto">
                <TableProvider
                    data={timeRecordsSummary}
                    columns={columns}
                    className={cn(expandableDetail && "table-fixed")}
                    enableColumnResizing={!expandableDetail}
                    columnVisibility={effectiveColumnVisibility}
                    onColumnVisibilityChange={!expandableDetail ? onColumnVisibilityChange : undefined}
                    columnOrder={!expandableDetail ? columnOrder : undefined}
                    onColumnOrderChange={!expandableDetail ? onColumnOrderChange : undefined}
                    columnSizing={!expandableDetail ? columnSizing : undefined}
                    onColumnSizingChange={!expandableDetail ? onColumnSizingChange : undefined}
                >
                    {expandableDetail && <SummaryAlignedColGroup columnCount={columns.length} />}
                    <TableHeader>
                        {({ headerGroup }) => (
                            <TableHeaderGroup key={headerGroup.id} headerGroup={headerGroup}>
                                {({ header }) => <TableHead key={header.id} header={header} />}
                            </TableHeaderGroup>
                        )}
                    </TableHeader>
                    <TableBody
                        isLoading={isLoading}
                        loadingState={<TableSkeleton columnCount={columns.length} />}
                        emptyState={
                            <TableRowRaw className="hover:bg-transparent">
                                <TableCellRaw
                                    className="h-50 text-center hover:bg-transparent"
                                    colSpan={columns.length}
                                >
                                    <div className="flex flex-col items-center justify-center space-y-4">
                                        <Clock className="h-10 w-10 text-muted-foreground" />
                                        <div className="flex flex-col items-center justify-center">
                                            <h3 className="text-lg font-medium">
                                                {t("timeRecords.summary.noSummaryTitle", "No time records summary")}
                                            </h3>
                                            <p className="text-muted-foreground">
                                                {t(
                                                    "timeRecords.summary.noSummaryDescription",
                                                    "Time records summary will appear here",
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </TableCellRaw>
                            </TableRowRaw>
                        }
                    >
                        {({ row }) => {
                        const summary = row.original as TimeRecordSummary;
                        const isFuture = isFutureDay(summary.day);
                        const rowKey = getSummaryRowKey(summary);
                        const canExpandDetail =
                            expandableDetail && summaryRowCanExpand(summary) && !!renderExpandedContent;
                        const isExpanded = expandedRowKeys.has(rowKey);

                        const handleRowClick = () => {
                            if (canExpandDetail) {
                                onToggleExpandedRow?.(rowKey);
                                return;
                            }
                            onRowClick?.(summary);
                        };

                        return (
                            <>
                                <TableRowRaw
                                    key={row.id}
                                    className={cn(
                                        onRowClick || canExpandDetail
                                            ? "hover:bg-muted/50 cursor-pointer"
                                            : "hover:bg-muted/50",
                                        isFuture && "text-muted-foreground opacity-60",
                                    )}
                                    data-state={row.getIsSelected() && "selected"}
                                    onClick={handleRowClick}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} cell={cell} />
                                    ))}
                                </TableRowRaw>
                                {isExpanded && renderExpandedContent && (
                                    <TableRowRaw
                                        key={`${row.id}-detail`}
                                        className="border-t border-border hover:bg-transparent"
                                    >
                                        <TableCellRaw className="p-0" colSpan={columns.length}>
                                            {renderExpandedContent(summary)}
                                        </TableCellRaw>
                                    </TableRowRaw>
                                )}
                            </>
                        );
                        }}
                    </TableBody>
                </TableProvider>
            </div>
        </TimeRecordsSummaryExpandContext.Provider>
    );
};

export const TimeRecordsSummaryTable = memo(TimeRecordsSummaryTableComponent);

export default TimeRecordsSummaryTable;
