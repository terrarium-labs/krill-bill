import { memo, useMemo, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Clock } from "lucide-react";
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
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import type { CommutingRate } from "@/types/general/commuting-rates";

type ClientCommutingRatesTableProps = {
    commutingRates: CommutingRate[];
    isLoading: boolean;
    searchQuery: string;
    onAddCommutingRate?: () => void;
    onNavigateToCommutingRate?: (commutingRateId: string) => void;
    onRowClick?: (clientCommutingRate: CommutingRate) => void;
    renderActions?: (clientCommutingRate: CommutingRate) => ReactNode;
};

const ClientCommutingRatesTableComponent = ({
    commutingRates,
    isLoading,
    searchQuery,
    onAddCommutingRate,
    onNavigateToCommutingRate,
    onRowClick,
    renderActions,
}: ClientCommutingRatesTableProps) => {
    const { t } = useTranslation();

    const commutingRatesWithId = commutingRates.map((cr) => ({ ...cr, id: cr.id }));
    const { wrapRowWithContextMenu } = useTableContextMenu<CommutingRate & { id: string }>(renderActions);

    const columns = useMemo<ColumnDef<CommutingRate>[]>(() => [
        {
            accessorKey: "id",
            header: t("common.id", "ID"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => (
                <IdBadge id={row.original.id} hideIcon={true} customTooltip={t("common.copyId", "Copy ID")} />
            ),
        },
        {
            accessorKey: "name",
            header: t("clients.commutingRates.columns.name", "Commuting Rate Name"),
            enableResizing: true,
            size: 300,
            cell: ({ row }) => {
                const commutingRate = row.original;
                return (
                    <div
                        className="font-medium text-sm hover:underline cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToCommutingRate?.(commutingRate.id);
                        }}
                    >
                        <span>{commutingRate.name || "-"}</span>
                    </div>
                );
            },
        },
        {
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
                <div className="flex justify-center items-center">
                    {renderActions && renderActions(row.original)}
                </div>
            ),
            meta: { sticky: "right" },
        },
    ], [t, onNavigateToCommutingRate, renderActions]);

    return (
        <TableProvider data={commutingRatesWithId} columns={columns} enableColumnResizing>
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
                                        {searchQuery
                                            ? t("clients.commutingRates.noResultsFound", "No results found")
                                            : t("clients.commutingRates.noCommutingRates", "No commuting rates")}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {searchQuery
                                            ? t(
                                                "clients.commutingRates.noResultsDescription",
                                                'No results found for "{{searchQuery}}"',
                                                { searchQuery }
                                              )
                                            : t(
                                                "clients.commutingRates.noCommutingRatesDescription",
                                                "No commuting rates assigned to this client."
                                              )}
                                    </p>
                                </div>
                                {onAddCommutingRate && (
                                    <Button variant="outline" onClick={onAddCommutingRate}>
                                        <Plus className="h-4 w-4" />
                                        {t("clients.commutingRates.addCommutingRate", "Add commuting rate")}
                                    </Button>
                                )}
                            </div>
                        </TableCellRaw>
                    </TableRowRaw>
                }
            >
                {({ row }) => {
                    const commutingRate = row.original as CommutingRate & { id: string };
                    return wrapRowWithContextMenu(
                        commutingRate,
                        <TableRowRaw
                            key={row.id}
                            className="hover:bg-muted/50 cursor-pointer"
                            data-state={row.getIsSelected() && "selected"}
                            onClick={(e) => {
                                e.stopPropagation();
                                onRowClick?.(commutingRate);
                            }}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} cell={cell} />
                            ))}
                        </TableRowRaw>
                    );
                }}
            </TableBody>
        </TableProvider>
    );
};

export const ClientCommutingRatesTable = memo(ClientCommutingRatesTableComponent);
export default ClientCommutingRatesTable;
