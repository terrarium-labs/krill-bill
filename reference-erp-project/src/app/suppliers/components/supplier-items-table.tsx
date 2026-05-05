import { memo, useMemo } from "react";
import { Package, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Item } from "@/types/items/items";
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
import { formatDate, formatMeasure } from "@/utils/miscelanea";
import IdBadge from "@/app/components/id-badge";
import { IconLabel } from "@/app/components/custom-labels";
import { ItemPrice } from "@/types/items/items";
import { ItemAvatar } from "@/app/components/avatars/item-avatar";
import { Button } from "@/components/ui/button";
import CurrencyLabel from "@/app/components/labels/currency-label";

// Column keys for type-safe column visibility
export type SupplierItemTableColumnKey =
    | "id"
    | "name"
    | "item_code"
    | "measure"
    | "supplier_pvp"
    | "supplier_discount"
    | "pmc"

    | "buy_price"
    | "description"
    | "item_hierarchy"
    | "created_at";

interface SupplierItemsTableProps {
    items: Item[];
    isLoading?: boolean;
    hiddenColumns?: SupplierItemTableColumnKey[];
    onRowClick?: (item: Item) => void;
    clickableRows?: boolean;
    emptyStateTitle?: string;
    emptyStateDescription?: string;
    onEmptyStateAction?: () => void;
    emptyStateActionLabel?: string;
    searchQuery?: string;
}

const SupplierItemsTableComponent = ({
    items,
    isLoading = false,
    hiddenColumns = [],
    onRowClick,
    clickableRows = true,
    emptyStateTitle,
    emptyStateDescription,
    onEmptyStateAction,
    emptyStateActionLabel,
    searchQuery = "",
}: SupplierItemsTableProps) => {
    const { t } = useTranslation();

    // Check if a column should be visible
    const isColumnVisible = (columnKey: SupplierItemTableColumnKey) => {
        return !hiddenColumns.includes(columnKey);
    };

    // Table columns definition
    const columns = useMemo<ColumnDef<Item>[]>(() => [
        isColumnVisible("id") && {
            accessorKey: "id",
            header: t("common.id", "ID"),
            enableResizing: true,
            size: 120,
            cell: ({ row }: { row: any }) => {
                const item = row.original;
                return (
                    <IdBadge id={item.id} hideIcon={true} customTooltip={t("common.copyId", "Copy ID")} />
                );
            },
        },
        isColumnVisible("name") && {
            accessorKey: "name",
            header: t("items.name", "Name"),
            enableResizing: true,
            size: 180,
            cell: ({ row }: { row: any }) => (<ItemAvatar item={row.original} className="font-medium" onClick={() => null} />),
        },
        isColumnVisible("item_code") && {
            accessorKey: "item_code",
            header: t("items.itemCode", "Item Code"),
            enableResizing: true,
            size: 120,
            cell: ({ row }: { row: any }) => {
                const item = row.original;
                return item.item_code ? (
                    <IdBadge id={item.item_code} hideIcon={true} customTooltip={t("items.itemCode", "Copy code")} />
                ) : (
                    <span className="text-muted-foreground">-</span>
                );
            },
        },
        isColumnVisible("measure") && {
            accessorKey: "measure",
            header: t("items.measure", "Stock"),
            enableResizing: true,
            size: 120,
            cell: ({ row }: { row: any }) => (
                <div className="text-sm">
                    {<span>{row.original.total_stock || 0} </span>} {formatMeasure(row.getValue("measure"))}
                </div>
            ),
        },
        isColumnVisible("supplier_pvp") && {
            accessorKey: "supplier_pvp",
            header: t("items.supplier_pvp", "Sup. PVP"),
            enableResizing: true,
            size: 120,
            cell: ({ row }: { row: any }) => {
                const buyPrice = row.getValue("buy_price") as ItemPrice;
                return buyPrice?.supplier_pvp ? <div className="text-sm flex items-center gap-2">
                    <CurrencyLabel data={buyPrice.supplier_pvp} />
                </div> : <span className="text-muted-foreground">-</span>;
            },
        },
        isColumnVisible("supplier_discount") && {
            accessorKey: "supplier_discount",
            header: t("items.supplier_discount", "Sup. Discount"),
            enableResizing: true,
            size: 130,
            cell: ({ row }: { row: any }) => {
                const buyPrice = row.getValue("buy_price") as ItemPrice;
                return buyPrice?.supplier_discount ? <div className="text-sm flex items-center gap-2">
                    <CurrencyLabel data={buyPrice.supplier_discount} /> %
                </div> : <span className="text-muted-foreground">-</span>;
            },
        },
        isColumnVisible("pmc") && {
            accessorKey: "pmc",
            header: t("items.pmc", "PMC"),
            enableResizing: true,
            size: 120,
            cell: ({ row }: { row: any }) => {
                const pmc = row.getValue("pmc") as number;
                if (pmc === null || pmc === undefined) return <span className="text-muted-foreground">-</span>;

                return (
                    <div className="text-sm font-normal">
                        <CurrencyLabel data={pmc} />
                    </div>
                );
            },
        },
        isColumnVisible("buy_price") && {
            accessorKey: "buy_price",
            header: t("items.buy_price", "Buy Price"),
            enableResizing: true,
            size: 120,
            cell: ({ row }: { row: any }) => {
                const buy_price = row.getValue("buy_price") as ItemPrice;
                if (buy_price?.price_quantity === null || buy_price?.price_quantity === undefined) return <span className="text-muted-foreground">-</span>;

                return (
                    <div className="text-sm font-medium">
                        <CurrencyLabel data={buy_price?.price_quantity ?? 0} />
                    </div>
                );
            },
        },
        isColumnVisible("description") && {
            accessorKey: "description",
            header: t("items.description", "Description"),
            enableResizing: true,
            size: 200,
            cell: ({ row }: { row: any }) => {
                const description = row.getValue("description") as string;
                if (!description) return <span className="text-muted-foreground">-</span>;
                return (
                    <span className="text-sm">{description}</span>
                );
            },
        },
        isColumnVisible("item_hierarchy") && {
            accessorKey: "item_hierarchy",
            header: t("items.itemHierarchy", "Item Hierarchy"),
            enableResizing: true,
            size: 150,
            cell: ({ row }: { row: any }) => {
                const itemHierarchy = row.original.item_hierarchy?.[0];
                if (!itemHierarchy) return <span className="text-muted-foreground">-</span>;
                return <IconLabel textClassName="font-normal" icon={itemHierarchy.icon || null} text={itemHierarchy.name} color={itemHierarchy.color || "sky"} showEmptyColor={false} />;
            },
        },
        isColumnVisible("created_at") && {
            id: "created_at",
            header: t("common.createdAt", "Created At"),
            enableResizing: true,
            size: 120,
            cell: ({ row }: { row: any }) => {
                const item = row.original;
                return (
                    <div className="text-sm">
                        {formatDate(item.created_at, { showTime: true })}
                    </div>
                );
            },
        },
    ].filter(Boolean) as ColumnDef<Item>[], [t, hiddenColumns]);

    // Default empty state values
    const defaultEmptyTitle = searchQuery
        ? t("items.noResultsFound", "No items found")
        : t("suppliers.noItemsTitle", "No items yet");

    const defaultEmptyDescription = searchQuery
        ? t("items.noResultsDescription", "No items match your search for '{{searchQuery}}'", { searchQuery })
        : t("suppliers.noItemsDescription", "This supplier has no items linked");

    return (
        <TableProvider data={items} columns={columns} enableColumnResizing>
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
                                {onEmptyStateAction && (
                                    <Button variant="outline" onClick={onEmptyStateAction}>
                                        <Plus className="h-4 w-4" />
                                        {emptyStateActionLabel || t("items.addItem", "Add Item")}
                                    </Button>
                                )}
                            </div>
                        </TableCellRaw>
                    </TableRowRaw>
                }
            >
                {({ row }) => (
                    <TableRowRaw
                        key={row.id}
                        className={clickableRows ? "hover:bg-muted/50 cursor-pointer" : "hover:bg-muted/50"}
                        data-state={row.getIsSelected() && 'selected'}
                        onClick={() => clickableRows && onRowClick && onRowClick(row.original as Item)}
                    >
                        {row.getVisibleCells().map((cell) => (
                            <TableCell
                                key={cell.id}
                                cell={cell}
                            />
                        ))}
                    </TableRowRaw>
                )}
            </TableBody>
        </TableProvider>
    );
};

export const SupplierItemsTable = memo(SupplierItemsTableComponent);
export default SupplierItemsTable;
