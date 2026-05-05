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
import { Wrench } from "lucide-react";
import { VehicleMaintenance } from "@/types/general/vehicles";
import IdBadge from "@/app/components/id-badge";
import { formatDate } from "@/utils/miscelanea";
import TextLargeLabel from "@/app/components/labels/text-large-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

interface MaintenancesTableProps {
    maintenances: VehicleMaintenance[];
    isLoading: boolean;
    renderActions?: (maintenance: VehicleMaintenance) => ReactNode;
    onRowClick?: (maintenance: VehicleMaintenance) => void;
    clickableRows?: boolean;
    searchQuery?: string;
}

const formatDuration = (from: string, to: string): string => {
    const start = new Date(from);
    const end = new Date(to);
    const diffMs = end.getTime() - start.getTime();
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return `${days}d`;
};

const MaintenancesTableComponent = ({
    maintenances,
    isLoading,
    renderActions,
    onRowClick,
    clickableRows = true,
    searchQuery = "",
}: MaintenancesTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<VehicleMaintenance>(renderActions);

    const columns = useMemo<ColumnDef<VehicleMaintenance>[]>(() => {
        const cols: ColumnDef<VehicleMaintenance>[] = [
            {
                accessorKey: "id",
                header: t("common.id", "ID"),
                enableResizing: true,
                size: 120,
                cell: ({ row }: { row: any }) => (
                    <IdBadge id={row.original.id} hideIcon customTooltip={t("common.copyId", "Copy ID")} />
                ),
            },
            {
                accessorKey: "from_date",
                header: t("maintenance.fromDate", "From date"),
                enableResizing: true,
                size: 120,
                cell: ({ row }: { row: any }) => (
                    <span className="text-sm">
                        {formatDate(new Date(row.original.from_date), {
                            showTime: false,
                            showYear: true,
                            useUTC: true,
                        })}
                    </span>
                ),
            },
            {
                accessorKey: "to_date",
                header: t("maintenance.toDate", "To date"),
                enableResizing: true,
                size: 120,
                cell: ({ row }: { row: any }) => (
                    <span className="text-sm">
                        {formatDate(new Date(row.original.to_date), {
                            showTime: false,
                            showYear: true,
                            useUTC: true,
                        })}
                    </span>
                ),
            },
            {
                id: "duration",
                header: t("maintenance.duration", "Duration"),
                enableResizing: true,
                size: 100,
                cell: ({ row }: { row: any }) => (
                    <span className="text-sm text-muted-foreground">
                        {formatDuration(row.original.from_date, row.original.to_date)}
                    </span>
                ),
            },
            {
                accessorKey: "notes",
                header: t("maintenance.notes", "Notes"),
                enableResizing: true,
                size: 200,
                cell: ({ row }: { row: any }) => (
                    <TextLargeLabel data={row.original.notes} />
                ),
            },
        ];

        if (renderActions) {
            cols.push({
                id: "actions",
                enableResizing: false,
                size: 52,
                header: ({ header }: { header: any }) => (
                    <TableColumnHeader
                        column={header.column}
                        className="justify-center items-center flex"
                        title=""
                    />
                ),
                cell: ({ row }: { row: any }) => (
                    <div className="flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
                        {renderActions(row.original)}
                    </div>
                ),
                meta: { sticky: "right" },
            });
        }

        return cols;
    }, [t, renderActions]);

    const defaultEmptyTitle = searchQuery
        ? t("maintenance.noResultsFound", "No maintenance records found")
        : t("maintenance.noMaintenanceTitle", "No maintenance records yet");

    const defaultEmptyDescription = searchQuery
        ? t("maintenance.noResultsDescription", "No records match your search")
        : t("maintenance.noMaintenanceDescription", "Start by adding your first maintenance record");

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider data={maintenances} columns={columns} enableColumnResizing>
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
                                className="h-64 text-center hover:bg-transparent"
                                colSpan={columns.length}
                            >
                                <div className="flex items-center justify-center space-y-4 flex-col">
                                    <Wrench className="h-10 w-10 text-muted-foreground opacity-40" />
                                    <div className="flex flex-col items-center">
                                        <h3 className="text-lg font-medium">{defaultEmptyTitle}</h3>
                                        <p className="text-muted-foreground text-sm">{defaultEmptyDescription}</p>
                                    </div>
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const maintenance = row.original as VehicleMaintenance;
                        const rowContent = (
                            <TableRowRaw
                                key={row.id}
                                className={
                                    clickableRows
                                        ? "hover:bg-muted/50 cursor-pointer"
                                        : "hover:bg-muted/50"
                                }
                                onClick={() => clickableRows && onRowClick?.(maintenance)}
                                data-state={row.getIsSelected() && "selected"}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} cell={cell} />
                                ))}
                            </TableRowRaw>
                        );
                        return wrapRowWithContextMenu(maintenance, rowContent);
                    }}
                </TableBody>
            </TableProvider>
        </div>
    );
};

export const MaintenancesTable = memo(MaintenancesTableComponent);
export default MaintenancesTable;
