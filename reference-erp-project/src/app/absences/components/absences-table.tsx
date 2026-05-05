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
import {
    TableRow as TableRowRaw,
    TableCell as TableCellRaw,
} from "@/components/ui/table";
import { CalendarDays } from "lucide-react";
import { Absence } from "@/types/employees/absences";
import IdBadge from "@/app/components/id-badge";
import IconLabel from "@/app/components/labels/icon-label";
import { Employee } from "@/types/employees/employees";
import DateRangeLabel from "@/app/components/labels/date-range-label";
import DurationLabel from "@/app/components/labels/duration-label";
import DateLabel from "@/app/components/labels/date-label";
import TextLabel from "@/app/components/labels/text-label";
import EmployeeLabel from "@/app/components/labels/employee-label";
import TextLargeLabel from "@/app/components/labels/text-large-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import Tag from "@/app/components/tag/tag";
import { TableSkeleton } from "@/components/ui/table-skeleton";

export type AbsenceTableColumnKey =
    | "id"
    | "employee"
    | "absence_type"
    | "year"
    | "date"
    | "duration"
    | "start_date"
    | "end_date"
    | "absence_counter"
    | "status"
    | "notes"
    | "num_files"
    | "responded_by"
    | "actions";

export interface AbsencesTableProps {
    absences: Absence[];
    isLoading: boolean;
    /** Structural column hiding (for embedding this table in sub-pages). Not saved to preferences. */
    hiddenColumns?: AbsenceTableColumnKey[] | AbsenceTableColumnKey;
    /** Custom render function for the actions column. If not provided, no actions column will be shown */
    renderActions?: (absence: Absence, allAbsences: Absence[]) => ReactNode;
    /** Called when a row is clicked (optional) */
    onRowClick?: (absence: Absence) => void;
    /** Whether rows should be clickable (shows cursor pointer) */
    clickableRows?: boolean;
    /** Maximum number of rows to display. If not provided, all rows are shown */
    maxRecords?: number;
    /** TanStack column visibility (from useAbsencesTablePreferences) */
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    /** TanStack column order */
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    /** TanStack column sizing */
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const AbsencesTableComponent = ({
    absences,
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
}: AbsencesTableProps) => {
    const { t } = useTranslation();

    const displayedAbsences = useMemo(() => {
        if (maxRecords && maxRecords > 0) {
            return absences.slice(0, maxRecords);
        }
        return absences;
    }, [absences, maxRecords]);

    const { wrapRowWithContextMenu } = useTableContextMenu<Absence>(renderActions, displayedAbsences);

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

    const columns = useMemo<ColumnDef<Absence>[]>(() => {
        const cols: ColumnDef<Absence>[] = [
            {
                accessorKey: "id",
                header: t("common.id", "ID"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <IdBadge id={row.original.id} hideIcon customTooltip={t("common.copyId", "Copy ID")} />
                ),
            },
            {
                accessorKey: "employee",
                header: t("absences.employee", "Employee"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => (
                    <EmployeeLabel data={row.original.employee as Employee} link="?tab=absences" />
                ),
            },
            {
                accessorKey: "absence_type",
                header: t("absences.absenceType", "Absence Type"),
                enableResizing: true,
                size: 160,
                cell: ({ row }) => {
                    const absenceType = row.original.absence_type;
                    return (
                        <IconLabel
                            data={{ icon: absenceType.icon_url, text: absenceType.name, color: absenceType.color }}
                            variant="truncate"
                        />
                    );
                },
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
                header: t("absences.startDate", "Start Date"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => <DateLabel data={row.getValue("start_date") as string} />,
            },
            {
                accessorKey: "end_date",
                header: t("absences.endDate", "End Date"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => <DateLabel data={row.getValue("end_date") as string} />,
            },
            {
                accessorKey: "absence_counter",
                header: t("absences.counter", "Counter"),
                enableResizing: true,
                size: 150,
                cell: ({ row }) => <TextLabel data={row.original.absence_counter.name} />,
            },
            {
                accessorKey: "status",
                header: t("absences.status.title", "Status"),
                enableResizing: true,
                size: 130,
                cell: ({ row }) => <Tag text={row.original.status} className="capitalize" />,
            },
            {
                accessorKey: "notes",
                header: t("absences.notes", "Notes"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => <TextLargeLabel data={row.getValue("notes") as string | null} />,
            },
            {
                accessorKey: "num_files",
                header: t("absences.files", "Files"),
                enableResizing: true,
                size: 80,
                cell: ({ row }) => (
                    <IconLabel
                        data={{ icon: "lucide:file-text", text: String((row.getValue("num_files") as number) || 0), color: "gray" }}
                        showIconColor={false}
                    />
                ),
            },
            {
                accessorKey: "responded_by",
                header: t("absences.respondedBy", "Responded By"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => <EmployeeLabel data={row.original.responded_by} link />,
            },
        ];

        if (renderActions) {
            cols.push({
                id: "actions",
                enableResizing: false,
                size: 52,
                header: ({ header }) => (
                    <TableColumnHeader column={header.column} className="justify-center items-center flex" title="" />
                ),
                cell: ({ row }) => renderActions(row.original, displayedAbsences),
                meta: { sticky: "right" },
            });
        }

        return cols;
    }, [t, renderActions, displayedAbsences]);

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider
                data={displayedAbsences}
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
                                    <CalendarDays className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {t("absences.noAbsencesTitle", "No absences yet")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {t("absences.noAbsencesDescription", "Absences will appear here")}
                                        </p>
                                    </div>
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const absence = row.original as Absence;
                        const rowContent = (
                            <TableRowRaw
                                key={row.id}
                                className={
                                    clickableRows || onRowClick
                                        ? "hover:bg-muted/50 cursor-pointer"
                                        : "hover:bg-muted/50"
                                }
                                data-state={row.getIsSelected() && "selected"}
                                onClick={() => onRowClick?.(absence)}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} cell={cell} />
                                ))}
                            </TableRowRaw>
                        );
                        return wrapRowWithContextMenu(absence, rowContent);
                    }}
                </TableBody>
            </TableProvider>
        </div>
    );
};

export const AbsencesTable = memo(AbsencesTableComponent);
export default AbsencesTable;
