import { useTranslation } from "@/hooks/useTranslation";
import { memo, useMemo, type ReactNode } from "react";
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
import { TableSkeleton } from "@/components/ui/table-skeleton";
import {
    TableRow as TableRowRaw,
    TableCell as TableCellRaw,
} from "@/components/ui/table";
import { Clock } from "lucide-react";
import { SickLeave } from "@/types/employees/sick-leaves";
import IdBadge from "@/app/components/id-badge";
import { Employee } from "@/types/employees/employees";
import DateLabel from "@/app/components/labels/date-label";
import DateRangeLabel from "@/app/components/labels/date-range-label";
import DurationLabel from "@/app/components/labels/duration-label";
import TextLargeLabel from "@/app/components/labels/text-large-label";
import IconLabel from "@/app/components/labels/icon-label";
import EmployeeLabel from "@/app/components/labels/employee-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

export const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const minutes = durationMs / (1000 * 60);
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (hours > 0) {
        return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
};

export type SickLeavesColumnKey =
    | "id"
    | "name"
    | "employee"
    | "year"
    | "date"
    | "duration"
    | "start_date"
    | "end_date"
    | "num_files"
    | "actions";

export interface SickLeavesTableProps {
    sickLeaves: SickLeave[];
    isLoading: boolean;
    /** Structural column hiding (for embedding this table in sub-pages). Not saved to preferences. */
    hiddenColumns?: SickLeavesColumnKey[] | SickLeavesColumnKey;
    /** Custom render function for the actions column. If not provided, no actions column will be shown */
    renderActions?: (sickLeave: SickLeave, allSickLeaves: SickLeave[]) => ReactNode;
    /** Called when a row is clicked (optional) */
    onRowClick?: (sickLeave: SickLeave) => void;
    /** Whether rows should be clickable (shows cursor pointer) */
    clickableRows?: boolean;
    /** Maximum number of rows to display. If not provided, all rows are shown */
    maxRecords?: number;
    /** TanStack column visibility (from useSickLeavesTablePreferences) */
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    /** TanStack column order */
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    /** TanStack column sizing */
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const SickLeavesTableComponent = ({
    sickLeaves,
    isLoading,
    hiddenColumns = [],
    renderActions,
    onRowClick,
    clickableRows = false,
    maxRecords,
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: SickLeavesTableProps) => {
    const { t } = useTranslation();

    const displayedSickLeaves = useMemo(() => {
        if (maxRecords && maxRecords > 0) {
            return sickLeaves.slice(0, maxRecords);
        }
        return sickLeaves;
    }, [sickLeaves, maxRecords]);

    const { wrapRowWithContextMenu } = useTableContextMenu<SickLeave>(renderActions, displayedSickLeaves);

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

    const columns = useMemo<ColumnDef<SickLeave>[]>(() => {
        const cols: ColumnDef<SickLeave>[] = [
            {
                accessorKey: "id",
                header: t("common.id", "ID"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <IdBadge
                        id={row.original.id}
                        hideIcon
                        customTooltip={t("common.copyId", "Copy ID")}
                    />
                ),
            },
            {
                accessorKey: "employee",
                header: t("employees.sickLeaves.employee", "Employee"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => (
                    <EmployeeLabel data={row.original.employee as Employee} link="?tab=absences" />
                ),
            },
            {
                accessorKey: "name",
                header: t("employees.sickLeaves.title", "Title"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => <TextLargeLabel data={row.getValue("name") as string} />,
            },
            {
                id: "year",
                accessorKey: "start_date",
                header: t("absences.year", "Year"),
                enableResizing: true,
                size: 80,
                cell: ({ row }) => {
                    const d = new Date(row.original.start_date);
                    if (!Number.isFinite(d.getTime())) return <span className="text-muted-foreground">-</span>;
                    return <div className="text-sm">{d.getUTCFullYear()}</div>;
                },
            },
            {
                id: "date",
                header: t("absences.date", "Date"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => (
                    <DateRangeLabel
                        startDate={row.original.start_date}
                        endDate={row.original.end_date}
                        useUTC={true}
                    />
                ),
            },
            {
                id: "duration",
                header: t("absences.duration", "Duration"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <DurationLabel startDate={row.original.start_date} endDate={row.original.end_date} />
                ),
            },
            {
                accessorKey: "start_date",
                header: t("employees.sickLeaves.startDate", "Start Date"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => <DateLabel data={row.getValue("start_date") as string} />,
            },
            {
                accessorKey: "end_date",
                header: t("employees.sickLeaves.endDate", "End Date"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => <DateLabel data={row.getValue("end_date") as string | null} />,
            },
            {
                accessorKey: "num_files",
                header: t("employees.sickLeaves.files", "Files"),
                enableResizing: true,
                size: 80,
                cell: ({ row }) => (
                    <IconLabel
                        data={{ icon: "lucide:file-text", text: String((row.getValue("num_files") as number) || 0), color: "gray" }}
                        showIconColor={false}
                    />
                ),
            },
        ];

        if (renderActions) {
            cols.push({
                id: "actions",
                enableResizing: false,
                size: 52,
                header: ({ header }) => (
                    <TableColumnHeader
                        column={header.column}
                        className="justify-center items-center flex"
                        title=""
                    />
                ),
                cell: ({ row }) => renderActions(row.original, displayedSickLeaves),
                meta: { sticky: "right" },
            });
        }

        return cols;
    }, [t, renderActions, displayedSickLeaves]);

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider
                data={displayedSickLeaves}
                columns={columns}
                enableColumnResizing
                columnVisibility={effectiveColumnVisibility}
                onColumnVisibilityChange={onColumnVisibilityChange}
                columnOrder={columnOrder}
                onColumnOrderChange={onColumnOrderChange}
                columnSizing={columnSizing}
                onColumnSizingChange={onColumnSizingChange}
            >
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
                                <div className="flex items-center justify-center space-y-4 flex-col">
                                    <Clock className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {t("employees.sickLeaves.noSickLeavesTitle", "No sick leaves yet")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {t("employees.sickLeaves.noSickLeavesDescription", "Sick leaves will appear here")}
                                        </p>
                                    </div>
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const sickLeave = row.original as SickLeave;
                        const rowContent = (
                            <TableRowRaw
                                key={row.id}
                                className={
                                    clickableRows || onRowClick
                                        ? "hover:bg-muted/50 cursor-pointer"
                                        : "hover:bg-muted/50"
                                }
                                data-state={row.getIsSelected() && "selected"}
                                onClick={() => onRowClick?.(sickLeave)}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} cell={cell} />
                                ))}
                            </TableRowRaw>
                        );
                        return wrapRowWithContextMenu(sickLeave, rowContent);
                    }}
                </TableBody>
            </TableProvider>
        </div>
    );
};

export const SickLeavesTable = memo(SickLeavesTableComponent);
export default SickLeavesTable;
