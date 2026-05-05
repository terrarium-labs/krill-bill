import { useTranslation } from "@/hooks/useTranslation";
import { memo, useMemo, ReactNode } from "react";
import {
    TableProvider,
    TableHeader,
    TableHeaderGroup,
    TableHead,
    TableBody,
    TableCell,
    TableColumnHeader,
    type ColumnDef,
} from "@/components/ui/shadcn-io/table";
import {
    TableRow as TableRowRaw,
    TableCell as TableCellRaw,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Clock } from "lucide-react";
import { TimeRecord } from "@/types/employees/time-records";
import IdBadge from "@/app/components/id-badge";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Employee } from "@/types/employees/employees";
import EmployeeLabel from "@/app/components/labels/employee-label";
import DateRangeLabel from "@/app/components/labels/date-range-label";
import DateLabel from "@/app/components/labels/date-label";
import DurationLabel from "@/app/components/labels/duration-label";
import Tag from "@/app/components/tag/tag";
import TextLargeLabel from "@/app/components/labels/text-large-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

// Column keys that can be hidden
export type TimeRecordTableColumnKey =
    | "id"
    | "employee"
    | "year"
    | "date"
    | "start_time"
    | "end_time"
    | "duration"
    | "verification_status"
    | "notes"
    | "verified_by"
    | "last_modified_by"
    | "actions";

export interface TimeRecordsTableProps {
    timeRecords: TimeRecord[];
    isLoading: boolean;
    /** Columns to hide from the table, accepts array or single string */
    hiddenColumns?: TimeRecordTableColumnKey[] | TimeRecordTableColumnKey;
    /** Custom render function for the actions column. If not provided, no actions column will be shown */
    renderActions?: (timeRecord: TimeRecord, allTimeRecords: TimeRecord[]) => ReactNode;
    /** Called when a row is clicked (optional) */
    onRowClick?: (timeRecord: TimeRecord) => void;
    /** Whether rows should be clickable (shows cursor pointer) */
    clickableRows?: boolean;
    /** Maximum number of rows to display. If not provided, all rows are shown */
    maxRecords?: number;
    /** Hide the header row (e.g. embedded under summary table where columns align by position). */
    hideHeader?: boolean;
}

const TimeRecordsTableComponent = ({
    timeRecords,
    isLoading,
    hiddenColumns = [],
    renderActions,
    onRowClick,
    clickableRows = false,
    maxRecords,
    hideHeader = false,
}: TimeRecordsTableProps) => {
    const { t } = useTranslation();

    // Normalize hiddenColumns to always be an array
    const hiddenColumnsArray = useMemo(() => {
        if (Array.isArray(hiddenColumns)) {
            return hiddenColumns;
        }
        return [hiddenColumns];
    }, [hiddenColumns]);

    // Apply maxRecords limit if provided
    const displayedTimeRecords = useMemo(() => {
        if (maxRecords && maxRecords > 0) {
            return timeRecords.slice(0, maxRecords);
        }
        return timeRecords;
    }, [timeRecords, maxRecords]);

    const { wrapRowWithContextMenu } = useTableContextMenu<TimeRecord>(renderActions, displayedTimeRecords);

    const isColumnVisible = (key: TimeRecordTableColumnKey) =>
        !hiddenColumnsArray.includes(key);

    const columns = useMemo<ColumnDef<TimeRecord>[]>(() => {
        const cols: ColumnDef<TimeRecord>[] = [];

        // ID Column
        if (isColumnVisible("id")) {
            cols.push({
                accessorKey: "id",
                header: t("common.id", "ID"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const timeRecord = row.original;
                    return (
                        <IdBadge
                            id={timeRecord.id}
                            hideIcon={true}
                            customTooltip={t("common.copyId", "Copy ID")}
                        />
                    );
                },
            });
        }

        // Employee Column
        if (isColumnVisible("employee")) {
            cols.push({
                accessorKey: "employee",
                header: t("employees.timeRecords.employee", "Employee"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => {
                    const employee = row.original.employee as Employee;
                    return <EmployeeLabel data={employee} link="?tab=time-records" />;
                },
            });
        }

        // Year Column
        if (isColumnVisible("year")) {
            cols.push({
                id: "year",
                accessorKey: "start_time",
                header: t("absences.year", "Year"),
                enableResizing: true,
                size: 80,
                cell: ({ row }) => {
                    const startStr = row.original.start_time;
                    const d = new Date(startStr);
                    if (!Number.isFinite(d.getTime())) return "-";
                    return (
                        <div className="text-sm">{d.getUTCFullYear()}</div>
                    );
                },
            });
        }

        // Date column (range with time when not whole-day; whole-day shows date only)
        if (isColumnVisible("date")) {
            cols.push({
                id: "date",
                accessorKey: "start_time",
                header: t("employees.timeRecords.date", "Date"),
                enableResizing: true,
                size: 150,
                cell: ({ row }) => {
                    const record = row.original;
                    if (!record.end_time) {
                        return <DateLabel data={record.start_time} useUTC={false} />;
                    }
                    return (
                        <DateRangeLabel
                            startDate={record.start_time}
                            endDate={record.end_time}
                            useUTC={false}
                        />
                    );
                },
            });
        }

        // Start Time Column
        if (isColumnVisible("start_time")) {
            cols.push({
                accessorKey: "start_time",
                header: t("employees.timeRecords.startTime", "Start Time"),
                enableResizing: true,
                size: 130,
                cell: ({ row }) => {
                    const date = row.getValue("start_time") as string;
                    return <DateLabel data={date} />;
                },
            });
        }

        // End Time Column
        if (isColumnVisible("end_time")) {
            cols.push({
                accessorKey: "end_time",
                header: t("employees.timeRecords.endTime", "End Time"),
                enableResizing: true,
                size: 130,
                cell: ({ row }) => {
                    const date = row.getValue("end_time") as string | null;
                    return <DateLabel data={date} />;
                },
            });
        }

        // Duration column (X day(s) / Xh Xm Xs)
        if (isColumnVisible("duration")) {
            cols.push({
                id: "duration",
                accessorKey: "start_time",
                header: t("employees.timeRecords.duration", "Duration"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const timeRecord = row.original;
                    return (
                        <DurationLabel
                            startDate={timeRecord.start_time}
                            endDate={timeRecord.end_time}
                            showElapsedTime={true}
                            showLiveBadge={true}
                        />
                    );
                },
            });
        }

        // Verification Status Column
        if (isColumnVisible("verification_status")) {
            cols.push({
                accessorKey: "verification_status",
                header: t("employees.timeRecords.status", "Status"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const status = row.getValue("verification_status") as string;
                    const notes = row.original.verification_notes;

                    if (!notes) {
                        return (
                            <div className="capitalize">
                                <Tag
                                    text={status}
                                    className="capitalize"
                                />
                            </div>
                        );
                    }

                    return (
                        <Tooltip>
                            <TooltipTrigger>
                                <div className="capitalize cursor-pointer">
                                    <Tag
                                        text={status}
                                        className="capitalize"
                                    />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                                {notes}
                            </TooltipContent>
                        </Tooltip>
                    );
                },
            });
        }

        // Notes Column
        if (isColumnVisible("notes")) {
            cols.push({
                accessorKey: "notes",
                header: t("employees.timeRecords.notes", "Notes"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => {
                    const notes = row.getValue("notes") as string | null;
                    return <TextLargeLabel data={notes} />;
                },
            });
        }

        // Verified By Column
        if (isColumnVisible("verified_by")) {
            cols.push({
                accessorKey: "verified_by",
                header: t("employees.timeRecords.verifiedBy", "Verified By"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => {
                    const timeRecord = row.original;
                    const verifier = timeRecord.verified_by;
                    return <EmployeeLabel data={verifier} link />;
                },
            });
        }

        // Last Modified By Column
        if (isColumnVisible("last_modified_by")) {
            cols.push({
                accessorKey: "last_modified_by",
                header: t("employees.timeRecords.lastModifiedBy", "Last Modified By"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => {
                    const timeRecord = row.original;
                    const updater = timeRecord.last_modified_by;
                    return <EmployeeLabel data={updater} link />;
                },
            });
        }

        // Actions Column
        if (isColumnVisible("actions") && renderActions) {
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
                    const timeRecord = row.original;
                    return (
                        <div className="flex items-center justify-center">
                            {renderActions(timeRecord, displayedTimeRecords)}
                        </div>
                    );
                },
                meta: {
                    sticky: "right",
                },
            });
        }

        return cols;
    }, [t, hiddenColumnsArray, renderActions, displayedTimeRecords]);

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider data={displayedTimeRecords} columns={columns} enableColumnResizing>
                {!hideHeader && (
                    <TableHeader>
                        {({ headerGroup }) => (
                            <TableHeaderGroup key={headerGroup.id} headerGroup={headerGroup}>
                                {({ header }) => <TableHead key={header.id} header={header} />}
                            </TableHeaderGroup>
                        )}
                    </TableHeader>
                )}
                <TableBody
                    isLoading={isLoading}
                    loadingState={<TableSkeleton columnCount={columns.length} />}
                    emptyState={
                        <TableRowRaw className="hover:bg-transparent">
                            <TableCellRaw
                                className="h-50 text-center hover:bg-transparent"
                                colSpan={columns.length}
                            >
                                <div className="flex items-center justify-center space-y-4 flex-col">
                                    <Clock className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {t("employees.timeRecords.noTimeRecordsTitle", "No time records yet")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {t(
                                                "employees.timeRecords.noTimeRecordsDescription",
                                                "Time records will appear here"
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const timeRecord = row.original as TimeRecord;
                        const rowContent = (
                            <TableRowRaw
                                key={row.id}
                                className={
                                    clickableRows || onRowClick
                                        ? "hover:bg-muted/50 cursor-pointer"
                                        : "hover:bg-muted/50"
                                }
                                data-state={row.getIsSelected() && "selected"}
                                onClick={() => onRowClick?.(timeRecord)}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} cell={cell} />
                                ))}
                            </TableRowRaw>
                        );

                        return wrapRowWithContextMenu(timeRecord, rowContent);
                    }}
                </TableBody>
            </TableProvider>
        </div>
    );
};

export const TimeRecordsTable = memo(TimeRecordsTableComponent);

export default TimeRecordsTable;

