import { memo, useMemo, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import IdBadge from "@/app/components/id-badge";
import EmployeeLabel from "@/app/components/labels/employee-label";
import DateLabel from "@/app/components/labels/date-label";
import Tag from "@/app/components/tag/tag";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import { Driver } from "@/types/general/vehicles";

interface VehicleDriversTableProps {
    vehicleEmployees: Driver[];
    isLoading: boolean;
    searchQuery: string;
    onAddDriver?: () => void;
    renderActions?: (vehicleEmployee: Driver) => ReactNode;
    hasMore?: boolean;
    isLoadingMore?: boolean;
    onLoadMore?: () => void;
}

const VehicleDriversTableComponent = ({
    vehicleEmployees,
    isLoading,
    searchQuery,
    onAddDriver,
    renderActions,
    hasMore,
    isLoadingMore,
    onLoadMore,
}: VehicleDriversTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<Driver>(renderActions);

    const isActive = (ve: Driver) => {
        if (!ve.valid_to) return true;
        return new Date(ve.valid_to) > new Date();
    };

    const columns: ColumnDef<Driver>[] = useMemo(
        () => {
            const allColumns: ColumnDef<Driver>[] = [
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
                    header: t("vehiclesDetail.driver", "Driver"),
                    enableResizing: true,
                    size: 180,
                    cell: ({ row }) => (
                        <EmployeeLabel data={row.original.employee} link />
                    ),
                },
                {
                    accessorKey: "valid_from",
                    header: t("vehiclesDetail.from", "From"),
                    enableResizing: true,
                    size: 120,
                    cell: ({ row }) => (
                        <DateLabel data={row.original.valid_from} options={{ hide: ["hours", "minutes", "seconds"] }} />
                    ),
                },
                {
                    accessorKey: "valid_to",
                    header: t("vehiclesDetail.to", "To"),
                    enableResizing: true,
                    size: 120,
                    cell: ({ row }) => (
                        <DateLabel data={row.original.valid_to} options={{ hide: ["hours", "minutes", "seconds"] }} />
                    ),
                },
                {
                    id: "status",
                    header: t("vehicles.status", "Status"),
                    enableResizing: true,
                    size: 120,
                    cell: ({ row }) => (
                        <Tag text={isActive(row.original) ? "active" : "inactive"} className="capitalize" />
                    ),
                },
            ];

            if (renderActions) {
                allColumns.push({
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
                    cell: ({ row }) => (
                        <div className="flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
                            {renderActions(row.original)}
                        </div>
                    ),
                    meta: { sticky: "right" as const },
                });
            }

            return allColumns;
        },
        [t, renderActions]
    );

    return (
        <TableProvider data={vehicleEmployees} columns={columns} enableColumnResizing>
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
                                <Users className="h-10 w-10 text-muted-foreground" />
                                <div className="flex flex-col items-center justify-center">
                                    <h3 className="text-lg font-medium">
                                        {searchQuery
                                            ? t("vehiclesDetail.noResultsFound", "No results found")
                                            : t("vehiclesDetail.noDriversTitle", "No drivers yet")}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {searchQuery
                                            ? t("vehiclesDetail.noResultsDescription", "No drivers match your search for \"{{searchQuery}}\"", { searchQuery })
                                            : t("vehiclesDetail.noDriversDescription", "No drivers have been assigned to this vehicle.")}
                                    </p>
                                </div>
                                {onAddDriver && (
                                    <Button variant="outline" onClick={onAddDriver}>
                                        {t("vehiclesDetail.addDriver", "Add Driver")}
                                    </Button>
                                )}
                            </div>
                        </TableCellRaw>
                    </TableRowRaw>
                }
            >
                {({ row }) => {
                    const vehicleEmployee = row.original;
                    return wrapRowWithContextMenu(
                        vehicleEmployee as Driver,
                        <TableRowRaw
                            key={row.id}
                            className="hover:bg-muted/50"
                            data-state={row.getIsSelected() && "selected"}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} cell={cell} />
                            ))}
                        </TableRowRaw>
                    );
                }}
            </TableBody>
            {hasMore && (
                <tfoot>
                    <tr>
                        <td colSpan={columns.length} className="p-0">
                            <div className="flex justify-center py-3">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onLoadMore}
                                    disabled={isLoadingMore}
                                    className="text-muted-foreground"
                                >
                                    {isLoadingMore ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                                            {t("common.loading", "Loading...")}
                                        </>
                                    ) : (
                                        t("common.loadMore", "Load more")
                                    )}
                                </Button>
                            </div>
                        </td>
                    </tr>
                </tfoot>
            )}
        </TableProvider>
    );
};

export const VehicleDriversTable = memo(VehicleDriversTableComponent);
export default VehicleDriversTable;
