import { memo, useMemo, type ReactNode } from "react";
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
    TableColumnHeader,
    type ColumnOrderState,
    type ColumnSizingState,
    type VisibilityState,
} from "@/components/ui/shadcn-io/table";
import type { OnChangeFn } from "@tanstack/react-table";
import { TableRow as TableRowRaw, TableCell as TableCellRaw } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { ItemAvatar } from "@/app/components/avatars/item-avatar";
import { formatDecimal, formatMeasure } from "@/utils/miscelanea";
import IdBadge from "@/app/components/id-badge";
import { Button } from "@/components/ui/button";
import IconLabel from "@/app/components/labels/icon-label";
import DateLabel from "@/app/components/labels/date-label";
import CurrencyLabel from "@/app/components/labels/currency-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

export type ItemTableColumnKey =
    | "id"
    | "name"
    | "item_code"
    | "measure"
    | "pmc"
    | "sell_price"
    | "margin"
    | "description"
    | "item_hierarchy"
    | "created_at"
    | "actions";

interface ItemsTableProps {
    items: Item[];
    isLoading?: boolean;
    /** Structural column hiding (for embedding this table in sub-pages). Not saved to preferences. */
    hiddenColumns?: ItemTableColumnKey[] | ItemTableColumnKey;
    renderActions?: (item: Item) => ReactNode;
    onRowClick?: (item: Item) => void;
    clickableRows?: boolean;
    emptyStateTitle?: string;
    emptyStateDescription?: string;
    onEmptyStateAction?: () => void;
    emptyStateActionLabel?: string;
    searchQuery?: string;
    /** TanStack column visibility (from useItemsTablePreferences) */
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    /** TanStack column order */
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    /** TanStack column sizing */
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const ItemsTableComponent = ({
    items,
    isLoading = false,
    hiddenColumns = [],
    renderActions,
    onRowClick,
    clickableRows = true,
    emptyStateTitle,
    emptyStateDescription,
    onEmptyStateAction,
    emptyStateActionLabel,
    searchQuery = "",
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: ItemsTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<Item>(renderActions);

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

    const columns = useMemo<ColumnDef<Item>[]>(() => {
        const cols: ColumnDef<Item>[] = [
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
                accessorKey: "name",
                header: t("items.name", "Name"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => <ItemAvatar item={row.original} />,
            },
            {
                accessorKey: "item_code",
                header: t("items.itemCode", "Item Code"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const item = row.original;
                    return item.item_code ? (
                        <IdBadge
                            id={item.item_code}
                            hideIcon
                            customTooltip={t("items.itemCode", "Copy code")}
                        />
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    );
                },
            },
            {
                accessorKey: "measure",
                header: t("items.measure", "Stock"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <span className="text-sm">
                        {row.original.total_stock || 0} {formatMeasure(row.getValue("measure"))}
                    </span>
                ),
            },
            {
                accessorKey: "pmc",
                header: t("items.pmc", "PMC"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const pmc = row.getValue("pmc") as number;
                    if (pmc === null || pmc === undefined)
                        return <span className="text-muted-foreground">-</span>;
                    return (
                        <span className="text-sm font-medium">
                            <CurrencyLabel data={pmc} />
                        </span>
                    );
                },
            },
            {
                accessorKey: "sell_price",
                header: t("items.sell_price", "Default Price"),
                enableResizing: true,
                size: 150,
                cell: ({ row }) => {
                    const sell_price = row.original.sell_price;
                    if (
                        !sell_price ||
                        sell_price.price_quantity === null ||
                        sell_price.price_quantity === undefined
                    )
                        return <span className="text-muted-foreground">-</span>;

                    const periodSuffix =
                        sell_price.billing_type === "recurring" && sell_price.billing_period
                            ? `/${t(`common.billingPeriod.${sell_price.billing_period}`, sell_price.billing_period)}`
                            : "";

                    return (
                        <span className="text-sm font-medium">
                            <CurrencyLabel data={sell_price.price_quantity} />
                            {periodSuffix}
                        </span>
                    );
                },
            },
            {
                accessorKey: "margin",
                header: t("items.margin", "Margin (%)"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const margin = row.original.sell_price?.margin;
                    if (!margin) return <span className="text-muted-foreground">-</span>;
                    return <span className="text-sm font-medium">{formatDecimal(margin)} %</span>;
                },
            },
            {
                accessorKey: "description",
                header: t("items.description", "Description"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => {
                    const description = row.getValue("description") as string;
                    if (!description) return <span className="text-muted-foreground">-</span>;
                    return (
                        <span className="text-sm" title={description}>
                            {description}
                        </span>
                    );
                },
            },
            {
                accessorKey: "item_hierarchy",
                header: t("items.itemHierarchy", "Item Hierarchy"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => {
                    const itemHierarchy = row.original.item_hierarchy?.[0];
                    if (!itemHierarchy) return <span className="text-muted-foreground">-</span>;
                    return (
                        <IconLabel
                            data={{
                                icon: itemHierarchy.icon || null,
                                text: itemHierarchy.name,
                                color: itemHierarchy.color || "sky",
                            }}
                            showEmptyColor={false}
                        />
                    );
                },
            },
            {
                id: "created_at",
                header: t("common.createdAt", "Created At"),
                enableResizing: true,
                size: 150,
                cell: ({ row }) => (
                    <DateLabel data={row.original.created_at} options={{ hide: ["seconds"] }} />
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
                cell: ({ row }) => (
                    <div
                        className="flex justify-center items-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {renderActions(row.original)}
                    </div>
                ),
                meta: { sticky: "right" },
            });
        }

        return cols;
    }, [t, renderActions]);

    const defaultEmptyTitle = searchQuery
        ? t("items.noResultsFound", "No items found")
        : t("items.noItemsTitle", "No items yet");

    const defaultEmptyDescription = searchQuery
        ? t("items.noResultsDescription", "No items match your search for '{{searchQuery}}'", {
              searchQuery,
          })
        : t("items.noItemsDescription", "Start by adding your first item");

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider
                data={items}
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
                                className="h-96 text-center hover:bg-transparent"
                                colSpan={columns.length}
                            >
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
                    {({ row }) => {
                        const item = row.original as Item;
                        const rowContent = (
                            <TableRowRaw
                                key={row.id}
                                className={
                                    clickableRows
                                        ? "hover:bg-muted/50 cursor-pointer"
                                        : "hover:bg-muted/50"
                                }
                                onClick={() => clickableRows && onRowClick?.(item)}
                                data-state={row.getIsSelected() && "selected"}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} cell={cell} />
                                ))}
                            </TableRowRaw>
                        );
                        return wrapRowWithContextMenu(item, rowContent);
                    }}
                </TableBody>
            </TableProvider>
        </div>
    );
};

export const ItemsTable = memo(ItemsTableComponent);
export default ItemsTable;
