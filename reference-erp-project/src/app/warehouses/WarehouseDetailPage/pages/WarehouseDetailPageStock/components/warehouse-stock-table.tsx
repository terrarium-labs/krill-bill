import { memo, useMemo, ReactNode } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Package } from "lucide-react";
import { StockLocationInfoItem } from "@/types/items/stock";
import {
    TableProvider,
    TableHeader,
    TableHeaderGroup,
    TableHead,
    TableBody,
    TableCell,
    type ColumnDef,
} from "@/components/ui/shadcn-io/table";
import { TableRow as TableRowRaw, TableCell as TableCellRaw } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import IdBadge from "@/app/components/id-badge";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

type WarehouseStockTableProps = {
    stocks: StockLocationInfoItem[];
    isLoading: boolean;
    searchQuery: string;
    onViewItem?: (itemId: string) => void;
    renderActions?: (stock: StockLocationInfoItem) => ReactNode;
};

const WarehouseStockTableComponent = ({
    stocks,
    isLoading,
    searchQuery,
    onViewItem,
    renderActions,
}: WarehouseStockTableProps) => {
    const { t } = useTranslation();

    // Map stocks to include item_id as top-level id for context menu
    const stocksWithId = stocks.map(stock => ({
        ...stock,
        id: stock.item_id
    }));

    const { wrapRowWithContextMenu } = useTableContextMenu<StockLocationInfoItem & { id: string }>(renderActions);

    const columns = useMemo<ColumnDef<StockLocationInfoItem>[]>(() => [
        {
            accessorKey: "item_id",
            header: t("warehouses.stock.itemId", "Item ID"),
            enableResizing: true,
            size: 80,
            cell: ({ row }) => {
                const itemId = row.getValue("item_id") as string;
                return <IdBadge id={itemId} hideIcon={true} />;
            },
        },
        {
            accessorKey: "item_name",
            header: t("warehouses.stock.itemName", "Item Name"),
            enableResizing: true,
            size: 240,
            cell: ({ row }) => (
                <div
                    className="font-medium text-sm hover:text-primary hover:underline cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        onViewItem?.(row.getValue("item_id") as string);
                    }}
                >
                    {row.getValue("item_name") || <span className="text-muted-foreground">-</span>}
                </div>
            ),
        },
        {
            accessorKey: "quantity",
            header: t("warehouses.stock.quantity", "Quantity"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => {
                const quantity = row.getValue("quantity") as number;
                return (
                    <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        {quantity || 0}
                    </div>
                );
            },
        },
    ], [t, onViewItem]);

    return (
        <>
            <TableProvider data={stocksWithId} columns={columns} enableColumnResizing>
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
                                    <Package className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {searchQuery
                                                ? t("warehouses.stock.noResultsFound", "No items found")
                                                : t("warehouses.stock.noItemsTitle", "No stock items yet")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {searchQuery
                                                ? t("warehouses.stock.noResultsDescription", "No items match your search for '{{searchQuery}}'", { searchQuery })
                                                : t("warehouses.stock.noItemsDescription", "This location has no stock items yet")}
                                        </p>
                                    </div>
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const stock = row.original as StockLocationInfoItem & { id: string };
                        return wrapRowWithContextMenu(
                            stock,
                            <TableRowRaw
                                key={row.id}
                                className="hover:bg-muted/50 cursor-pointer"
                                onClick={() => onViewItem?.(stock.item_id)}
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
                    }}
                </TableBody>
            </TableProvider>
        </>
    );
};

export const WarehouseStockTable = memo(WarehouseStockTableComponent);
export default WarehouseStockTable;
