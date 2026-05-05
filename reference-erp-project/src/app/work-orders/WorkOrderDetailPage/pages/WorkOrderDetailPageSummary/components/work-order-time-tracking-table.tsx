import { memo, useMemo, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
    TableProvider,
    TableHeader,
    TableHeaderGroup,
    TableHead,
    TableBody,
    TableCell,
    type ColumnDef,
    TableColumnHeader,
} from "@/components/ui/shadcn-io/table";
import { TableRow as TableRowRaw, TableCell as TableCellRaw } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Clock } from "lucide-react";
import { TimeTracking } from "@/types/field-service/work-orders/time-trackings";
import IdBadge from "@/app/components/id-badge";
import { formatDate } from "@/utils/miscelanea";
import { useWorkOrder } from "@/app/work-orders/contexts/WorkOrderContext";
import DurationLabel from "@/app/components/labels/duration-label";
import EmployeeLabel from "@/app/components/labels/employee-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

// Column keys that can be hidden
export type TimeTrackingTableColumnKey =
    | "id"
    | "user"
    | "start_time"
    | "end_time"
    | "duration"
    | "actions";

interface WorkOrderTimeTrackingTableProps {
    timeTrackings: TimeTracking[];
    isLoading?: boolean;
    searchQuery?: string;
    emptyStateTitle?: string;
    emptyStateDescription?: string;
    onRowClick?: (timeTracking: TimeTracking) => void;
    clickableRows?: boolean;
    renderActions?: (timeTracking: TimeTracking) => ReactNode;
    /** Columns to hide from the table, accepts array or single string */
    hiddenColumns?: TimeTrackingTableColumnKey[] | TimeTrackingTableColumnKey;
}

const WorkOrderTimeTrackingTableComponent = ({
    timeTrackings,
    isLoading = false,
    searchQuery = "",
    emptyStateTitle,
    emptyStateDescription,
    onRowClick,
    clickableRows = false,
    renderActions,
    hiddenColumns = [],
}) => {
    const { t } = useTranslation();
    const { activeTimeTracking } = useWorkOrder();
    const { wrapRowWithContextMenu } = useTableContextMenu<TimeTracking>(renderActions);

    // Normalize hiddenColumns to always be an array
    const hiddenColumnsArray = useMemo(() => {
        if (Array.isArray(hiddenColumns)) {
            return hiddenColumns;
        }
        return [hiddenColumns];
    }, [hiddenColumns]);

    const isColumnVisible = (key: TimeTrackingTableColumnKey) =>
        !hiddenColumnsArray.includes(key);

    // Table columns definition
    const columns = useMemo<ColumnDef<TimeTracking>[]>(() => {
        const cols: ColumnDef<TimeTracking>[] = [];

        // ID Column
        if (isColumnVisible("id")) {
            cols.push({
                accessorKey: "id" as const,
                header: t("common.id", "ID"),
                enableResizing: true,
                size: 120,
                cell: ({ row }: { row: { original: TimeTracking } }) => {
                    const timeTracking = row.original;
                    return (
                        <IdBadge id={timeTracking.id} hideIcon={true} customTooltip={t("common.copyId", "Copy ID")} />
                    );
                },
            });
        }

        // User Column
        if (isColumnVisible("user")) {
            cols.push({
                accessorKey: "user" as const,
                header: t("workorders.user", "User"),
                enableResizing: true,
                size: 180,
                cell: ({ row }: { row: { original: TimeTracking } }) => {
                    const timeTracking = row.original;
                    return <EmployeeLabel data={timeTracking.user} />;
                },
            });
        }

        // Start Time Column
        if (isColumnVisible("start_time")) {
            cols.push({
                accessorKey: "start_time" as const,
                header: t("workorders.startTime", "Start Time"),
                enableResizing: true,
                size: 130,
                cell: ({ row }: { row: { getValue: (key: string) => unknown } }) => {
                    const startTime = row.getValue("start_time") as string;
                    return (
                        <div className="text-sm">
                            {startTime ? (
                                <>
                                    <div>{formatDate(startTime, { showTime: false })}</div>
                                    <div className="text-muted-foreground text-xs">
                                        {formatDate(startTime, { showTime: true, showSeconds: true })}
                                    </div>
                                </>
                            ) : (
                                <span className="text-muted-foreground">-</span>
                            )}
                        </div>
                    );
                },
            });
        }

        // End Time Column
        if (isColumnVisible("end_time")) {
            cols.push({
                accessorKey: "end_time" as const,
                header: t("workorders.endTime", "End Time"),
                enableResizing: true,
                size: 130,
                cell: ({ row }: { row: { getValue: (key: string) => unknown } }) => {
                    const endTime = row.getValue("end_time") as string;
                    return (
                        <div className="text-sm">
                            {endTime ? (
                                <>
                                    <div>{formatDate(endTime, { showTime: false })}</div>
                                    <div className="text-muted-foreground text-xs">
                                        {formatDate(endTime, { showTime: true, showSeconds: true })}
                                    </div>
                                </>
                            ) : (
                                <span className="text-muted-foreground">-</span>
                            )}
                        </div>
                    );
                },
            });
        }

        // Duration Column
        if (isColumnVisible("duration")) {
            cols.push({
                id: "duration",
                header: t("workorders.duration", "Duration"),
                enableResizing: true,
                size: 120,
                cell: ({ row }: { row: { original: TimeTracking } }) => {
                    const timeTracking = row.original;
                    const isActive = !timeTracking.end_time || timeTracking.end_time === "" || timeTracking.id === activeTimeTracking?.id;
                    
                    return (
                        <DurationLabel
                            startDate={timeTracking.start_time}
                            endDate={isActive ? null : timeTracking.end_time}
                            showElapsedTime={true}
                            showLiveBadge={true}
                        />
                    );
                },
            });
        }

        // Add actions column if renderActions is provided and actions column is visible
        if (renderActions && isColumnVisible("actions")) {
            cols.push({
                id: "actions",
                enableResizing: false,
                size: 52,
                header: ({ header }: { header: any }) => (
                    <TableColumnHeader
                        column={header.column}
                        className="justify-center items-center flex"
                        title={''}
                    />
                ),
                cell: ({ row }: { row: { original: TimeTracking } }) => {
                    const timeTracking = row.original;
                    return (
                        <div className="flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
                            {renderActions(timeTracking)}
                        </div>
                    );
                },
                meta: {
                    sticky: 'right',
                },
            });
        }

        return cols;
    }, [t, hiddenColumnsArray, renderActions, activeTimeTracking]);

    // Handle row click
    const handleRowClick = (timeTracking: TimeTracking) => {
        // Don't allow clicking on active time trackings (no end_time)
        const isActive = !timeTracking.end_time || timeTracking.end_time === "" || timeTracking.id === activeTimeTracking?.id;
        if (onRowClick && clickableRows && !isActive) {
            onRowClick(timeTracking);
        }
    };

    return (
        <TableProvider data={timeTrackings} columns={columns} enableColumnResizing>
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
                        <TableCellRaw className="h-96 text-center hover:bg-transparent" colSpan={columns.length}>
                            <div className="flex items-center justify-center space-y-4 flex-col">
                                <Clock className="h-10 w-10 text-muted-foreground" />
                                <div className="flex flex-col items-center justify-center">
                                    <h3 className="text-lg font-medium">
                                        {emptyStateTitle || (searchQuery
                                            ? t("workorders.noResultsFound", "No time trackings found")
                                            : t("workorders.noTimeTrackingsTitle", "No time trackings yet"))}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {emptyStateDescription || (searchQuery
                                            ? t("workorders.noResultsDescription", "No time trackings match your search for '{{searchQuery}}'", { searchQuery })
                                            : t("workorders.noTimeTrackingsDescription", "Time trackings will appear here once recorded"))}
                                    </p>
                                </div>
                            </div>
                        </TableCellRaw>
                    </TableRowRaw>
                }
            >
                {({ row }) => {
                    const timeTracking = row.original as TimeTracking;
                    const isActive = !timeTracking.end_time || timeTracking.end_time === "" || timeTracking.id === activeTimeTracking?.id;
                    const isClickable = clickableRows && !isActive;
                    
                    const rowContent = (
                        <TableRowRaw
                            key={row.id}
                            className={isClickable ? "hover:bg-muted/50 cursor-pointer" : isActive ? "opacity-75" : ""}
                            onClick={() => handleRowClick(timeTracking)}
                            data-state={row.getIsSelected() && 'selected'}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <TableCell
                                    key={cell.id}
                                    cell={cell}
                                />
                            ))}
                        </TableRowRaw>
                    );

                    return wrapRowWithContextMenu(timeTracking, rowContent);
                }}
            </TableBody>
        </TableProvider>
    );
};

export const WorkOrderTimeTrackingTable = memo(WorkOrderTimeTrackingTableComponent);
export default WorkOrderTimeTrackingTable;