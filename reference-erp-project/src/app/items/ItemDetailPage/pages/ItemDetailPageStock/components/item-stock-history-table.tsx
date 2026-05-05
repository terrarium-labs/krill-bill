import { memo, useMemo, ReactNode } from "react";
import { Package } from "lucide-react";
import { useTranslation } from "react-i18next";
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
import { useNavigate, useParams } from "react-router";
import CurrencyLabel from "@/app/components/labels/currency-label";
import DateLabel from "@/app/components/labels/date-label";
import Tag from "@/app/components/tag/tag";
import TextLabel from "@/app/components/labels/text-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

// Column keys for type-safe column visibility
export type ItemStockHistoryTableColumnKey =
    | "id"
    | "date_stock"
    | "type"
    | "quantity"
    | "unit_price"
    | "location_name"
    | "document_id";

interface ItemStockHistoryTableProps {
    transactions: StockLocationHistoryItem[];
    isLoading?: boolean;
    hiddenColumns?: ItemStockHistoryTableColumnKey[];
    renderActions?: (transaction: StockLocationHistoryItem) => ReactNode;
    onRowClick?: (transaction: StockLocationHistoryItem) => void;
    clickableRows?: boolean;
    emptyStateTitle?: string;
    emptyStateDescription?: string;
    searchQuery?: string;
}

const ItemStockHistoryTableComponent = ({
    transactions,
    isLoading = false,
    hiddenColumns = [],
    renderActions,
    onRowClick,
    clickableRows = false,
    emptyStateTitle,
    emptyStateDescription,
    searchQuery = "",
}: ItemStockHistoryTableProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const { wrapRowWithContextMenu } = useTableContextMenu<StockLocationHistoryItem>(renderActions);

    // Check if a column should be visible
    const isColumnVisible = (columnKey: ItemStockHistoryTableColumnKey) => {
        return !hiddenColumns.includes(columnKey);
    };

    // Table columns definition
    const columns = useMemo<ColumnDef<StockLocationHistoryItem>[]>(
        () => [
            isColumnVisible("id") && {
                accessorKey: "id",
                header: "ID",
                enableResizing: true,
                size: 120,
                cell: ({ row }: { row: any }) => (
                    <IdBadge id={row.original.id} hideIcon={true} />
                ),
            },
            isColumnVisible("date_stock") && {
                accessorKey: "date_stock",
                header: t("stock.date", "Date"),
                enableResizing: true,
                size: 120,
                cell: ({ row }: { row: any }) => {
                    const date = row.original.date_stock;
                    return <DateLabel data={date} options={{ hide: ["seconds"] }} />;
                },
            },
            isColumnVisible("type") && {
                accessorKey: "type",
                header: t("stock.type", "Type"),
                enableResizing: true,
                size: 120,
                cell: ({ row }: { row: any }) => <Tag text={row.original.type} className="capitalize" />,
            },
            isColumnVisible("quantity") && {
                accessorKey: "quantity",
                header: t("stock.quantity", "Quantity"),
                enableResizing: true,
                size: 120,
                cell: ({ row }: { row: any }) => {
                    const quantity = row.original.quantity;
                    return <TextLabel data={quantity} className="text-sm font-medium" />;
                },
            },
            isColumnVisible("unit_price") && {
                accessorKey: "unit_price",
                header: t("stock.unitPrice", "Unit Price"),
                enableResizing: true,
                size: 120,
                cell: ({ row }: { row: any }) => {
                    const unitPrice = row.original.unit_price;
                    if (!unitPrice) {
                        return <span className="text-muted-foreground">-</span>;
                    }
                    return <CurrencyLabel data={unitPrice} />;
                },
            },
            isColumnVisible("location_name") && {
                accessorKey: "location_name",
                header: t("stock.location", "Location"),
                enableResizing: true,
                size: 180,
                cell: ({ row }: { row: any }) => {
                    const location = row.original;
                    if (!location.location_name) {
                        return <span className="text-muted-foreground">-</span>;
                    }
                    return (
                        <span
                            className="text-sm font-medium hover:text-primary hover:underline cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (location.location_id) {
                                    navigate(`/${orgId}/locations/${location.location_id}`);
                                }
                            }}
                        >
                            {location.location_name}
                        </span>
                    );
                },
            },
            isColumnVisible("document_id") && {
                accessorKey: "document_id",
                header: t("stock.document", "Document"),
                enableResizing: true,
                size: 120,
                cell: ({ row }: { row: any }) => {
                    const documentId = row.original.document_id;
                    if (!documentId) {
                        return <span className="text-muted-foreground">-</span>;
                    }
                    return <IdBadge id={documentId} />;
                },
            },
        ].filter(Boolean) as ColumnDef<StockLocationHistoryItem>[],
        [t, navigate, orgId, hiddenColumns]
    );

    // Default empty state values
    const defaultEmptyTitle = searchQuery
        ? t("stock.noResultsFound", "No results found")
        : t("stock.noTransactions", "No transactions");

    const defaultEmptyDescription = searchQuery
        ? t("stock.noResultsDescription", 'No results found for "{{searchQuery}}"', { searchQuery })
        : t("stock.noTransactionsDescription", "No stock transactions for this location.");

    return (
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
                                        {emptyStateTitle || defaultEmptyTitle}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {emptyStateDescription || defaultEmptyDescription}
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
                            className={clickableRows ? "hover:bg-muted/50 cursor-pointer" : "hover:bg-muted/50"}
                            onClick={() => clickableRows && onRowClick && onRowClick(transaction)}
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
    );
};

export const ItemStockHistoryTable = memo(ItemStockHistoryTableComponent);
export default ItemStockHistoryTable;
