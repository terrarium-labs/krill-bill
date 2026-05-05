import { memo, useMemo, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Package } from "lucide-react";
import { StockLocationHistoryItem } from "@/types/items/stock";
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
import { formatDate } from "@/utils/miscelanea";
import CurrencyLabel from "@/app/components/labels/currency-label";
import Tag from "@/app/components/tag/tag";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

type WarehouseHistoryTableProps = {
    transactions: StockLocationHistoryItem[];
    isLoading: boolean;
    searchQuery: string;
    onViewItem?: (itemId: string) => void;
    renderActions?: (transaction: StockLocationHistoryItem) => ReactNode;
};

const WarehouseHistoryTableComponent = ({
    transactions,
    isLoading,
    searchQuery,
    onViewItem,
    renderActions,
}: WarehouseHistoryTableProps) => {
    const { t } = useTranslation();

    const { wrapRowWithContextMenu } = useTableContextMenu<StockLocationHistoryItem>(renderActions);

    const columns = useMemo<ColumnDef<StockLocationHistoryItem>[]>(() => [
        {
            accessorKey: "id",
            header: "ID",
            enableResizing: true,
            size: 120,
            cell: ({ row }) => (
                <IdBadge id={row.original.id} hideIcon={true} />
            ),
        },
        {
            accessorKey: "date_stock",
            header: t("stock.date", "Date"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => {
                const date = row.original.date_stock;
                if (!date) {
                    return <span className="text-muted-foreground">-</span>;
                }
                return (
                    <span className="text-sm">
                        {formatDate(date)}
                    </span>
                );
            },
        },
        {
            accessorKey: "type",
            header: t("stock.type", "Type"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => (
                <Tag text={row.original.type} className="capitalize" />
            ),
        },
        {
            accessorKey: "quantity",
            header: t("stock.quantity", "Quantity"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => {
                const quantity = row.original.quantity;
                return (
                    <span className="text-sm font-medium">
                        {quantity}
                    </span>
                );
            },
        },
        {
            accessorKey: "unit_price",
            header: t("stock.unitPrice", "Unit Price"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => {
                const unitPrice = row.original.unit_price;
                if (!unitPrice) {
                    return <span className="text-muted-foreground">-</span>;
                }
                return <CurrencyLabel data={unitPrice} />;
            },
        },
        {
            accessorKey: "item_name",
            header: t("stock.item", "Item"),
            enableResizing: true,
            size: 180,
            cell: ({ row }) => {
                const item = row.original;
                if (!item.item_name) {
                    return <span className="text-muted-foreground">-</span>;
                }

                return (
                    <span
                        className="text-sm font-medium hover:text-primary hover:underline cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (item.item_id) {
                                onViewItem?.(item.item_id);
                            }
                        }}
                    >
                        {item.item_name}
                    </span>
                );
            },
        },
        {
            accessorKey: "document_id",
            header: t("stock.document", "Document"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => {
                const documentId = row.original.document_id;
                if (!documentId) {
                    return <span className="text-muted-foreground">-</span>;
                }
                return <IdBadge id={documentId} />;
            },
        },
    ], [t, onViewItem]);

    return (
        <>
            <TableProvider data={transactions} columns={columns} enableColumnResizing>
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
                                                ? t("stock.noResultsFound", "No results found")
                                                : t("stock.noTransactions", "No transactions")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {searchQuery
                                                ? t(
                                                    "stock.noResultsDescription",
                                                    'No results found for "{{searchQuery}}"',
                                                    { searchQuery }
                                                )
                                                : t(
                                                    "stock.noTransactionsDescription",
                                                    "No stock transactions for this location."
                                                )}
                                        </p>
                                    </div>
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const transaction = row.original as StockLocationHistoryItem;
                        return wrapRowWithContextMenu(
                            transaction,
                            <TableRowRaw
                                key={row.id}
                                className="hover:bg-muted/50 cursor-pointer"
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

export const WarehouseHistoryTable = memo(WarehouseHistoryTableComponent);
export default WarehouseHistoryTable;
