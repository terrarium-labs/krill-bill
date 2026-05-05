import { memo, useMemo, type ReactNode } from "react";
import { ShoppingCart, Plus, Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Order, OrdersMetadata } from "@/types/orders/orders";
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
import { TableRow as TableRowRaw, TableCell as TableCellRaw, TableFooter as TableFooterRaw } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import CurrencyLabel from "@/app/components/labels/currency-label";
import IdBadge from "@/app/components/id-badge";
import { Button } from "@/components/ui/button";
import ProgressLabel from "@/app/components/labels/progress-label";
import { useNavigateToOrigin } from "@/utils/origin";
import SupplierLabel from "@/app/components/labels/supplier-label";
import Tag from "@/app/components/tag/tag";
import LocationLabel from "@/app/components/labels/location-label";
import DateLabel from "@/app/components/labels/date-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

export type OrderTableColumnKey =
    | "id"
    | "serial_number"
    | "name"
    | "supplier"
    | "order_date"
    | "due_date"
    | "status"
    | "total_price"
    | "origin"
    | "location"
    | "reception_status"
    | "is_paid"
    | "created_at"
    | "actions";

interface OrdersTableProps {
    orders: Order[];
    isLoading?: boolean;
    /** Structural column hiding (for embedding). Not saved to preferences. */
    hiddenColumns?: OrderTableColumnKey[] | OrderTableColumnKey;
    renderActions?: (order: Order) => ReactNode;
    onRowClick?: (order: Order) => void;
    clickableRows?: boolean;
    emptyStateTitle?: string;
    emptyStateDescription?: string;
    onEmptyStateAction?: () => void;
    emptyStateActionLabel?: string;
    searchQuery?: string;
    metadata?: OrdersMetadata | null;
    /** TanStack column visibility (from useOrdersTablePreferences) */
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    /** TanStack column order */
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    /** TanStack column sizing */
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const OrdersTableComponent = ({
    orders,
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
    metadata,
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: OrdersTableProps) => {
    const { t } = useTranslation();
    const navigateToOrigin = useNavigateToOrigin();
    const { wrapRowWithContextMenu } = useTableContextMenu<Order>(renderActions);

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

    const isColumnVisible = (key: OrderTableColumnKey): boolean => {
        if (!effectiveColumnVisibility) return true;
        return effectiveColumnVisibility[key] !== false;
    };

    const columns = useMemo<ColumnDef<Order>[]>(() => {
        const cols: ColumnDef<Order>[] = [
            {
                accessorKey: "origin",
                header: t("orders.origin", "Origin"),
                enableResizing: true,
                size: 80,
                cell: ({ row }) => {
                    const order = row.original;
                    return order.origin ? (
                        <IdBadge
                            id={order.origin.id}
                            hideIcon
                            customTooltip={t("orders.goToOrigin", "Go to origin")}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigateToOrigin(order.origin);
                            }}
                        />
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    );
                },
            },
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
                accessorKey: "serial_number",
                header: t("orders.serialNumber", "Order #"),
                enableResizing: true,
                size: 130,
                cell: ({ row }) => (
                    <span className="font-medium">
                        {row.original.serial_number || <span className="text-muted-foreground">-</span>}
                    </span>
                ),
            },
            {
                accessorKey: "supplier",
                header: t("orders.supplier", "Supplier"),
                enableResizing: true,
                size: 160,
                cell: ({ row }) => (
                    <div onClick={(e) => e.stopPropagation()}>
                        <SupplierLabel data={row.original.supplier} link />
                    </div>
                ),
            },
            {
                accessorKey: "order_date",
                header: t("orders.orderDate", "Order Date"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <DateLabel data={row.original.order_date} options={{ hide: ["seconds"] }} />
                ),
            },
            {
                accessorKey: "due_date",
                header: t("orders.dueDate", "Due Date"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <DateLabel data={row.original.due_date} options={{ hide: ["seconds"] }} />
                ),
            },
            {
                accessorKey: "status",
                header: t("orders.status", "Status"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <Tag text={(row.original.status as string).replace("_", " ")} className="capitalize" />
                ),
            },
            {
                id: "reception_status",
                header: t("orders.receptionStatus", "Reception"),
                enableResizing: true,
                size: 130,
                cell: ({ row }) => {
                    const order = row.original;
                    const numItems = order.num_items || 0;
                    const numItemsDelivered = order.num_items_delivered || 0;
                    return <ProgressLabel data={[numItemsDelivered, numItems]} size="w-full" />;
                },
            },
            {
                accessorKey: "total_price",
                header: t("orders.totalPrice", "Total"),
                enableResizing: true,
                size: 130,
                cell: ({ row }) =>
                    row.original.total_price != null ? (
                        <CurrencyLabel data={row.original.total_price} />
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    ),
            },
            {
                accessorKey: "is_paid",
                header: t("orders.isPaid", "Paid"),
                enableResizing: true,
                size: 85,
                cell: ({ row }) =>
                    row.original.is_paid ? (
                        <Check className="h-4 w-4 text-green-500" />
                    ) : (
                        <X className="h-4 w-4 text-red-500" />
                    ),
            },
            {
                accessorKey: "location",
                header: t("orders.location", "Location"),
                enableResizing: true,
                size: 160,
                cell: ({ row }) => {
                    const order = row.original;
                    const locationLink = order.supplier?.id ? `suppliers/${order.supplier.id}` : false;
                    return (
                        <div onClick={(e) => e.stopPropagation()}>
                            <LocationLabel data={order.location} textClassName="font-medium" link={locationLink} />
                        </div>
                    );
                },
            },
            {
                id: "created_at",
                header: t("common.createdAt", "Created At"),
                enableResizing: true,
                size: 120,
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
    }, [t, renderActions, navigateToOrigin]);

    const defaultEmptyTitle = searchQuery
        ? t("orders.noResultsFound", "No orders found")
        : t("orders.noOrdersTitle", "No orders yet");

    const defaultEmptyDescription = searchQuery
        ? t("orders.noResultsDescription", "No orders match your search for '{{searchQuery}}'", { searchQuery })
        : t("orders.noOrdersDescription", "Start by adding your first order");

    const columnsBeforeTotalPrice = [
        isColumnVisible("origin"),
        isColumnVisible("id"),
        isColumnVisible("serial_number"),
        isColumnVisible("supplier"),
        isColumnVisible("order_date"),
        isColumnVisible("due_date"),
        isColumnVisible("status"),
        isColumnVisible("reception_status"),
    ].filter(Boolean).length;

    const showTotalsRow = metadata && orders.length > 0 && !isLoading;
    const hasActionsColumn = isColumnVisible("actions") && !!renderActions;

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider
                data={orders}
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
                            <TableCellRaw className="h-96 text-center hover:bg-transparent" colSpan={columns.length}>
                                <div className="flex items-center justify-center space-y-4 flex-col">
                                    <ShoppingCart className="h-10 w-10 text-muted-foreground" />
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
                                            {emptyStateActionLabel || t("orders.addOrder", "Add Order")}
                                        </Button>
                                    )}
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const order = row.original as Order;
                        return wrapRowWithContextMenu(
                            order,
                            <TableRowRaw
                                key={row.id}
                                className={clickableRows ? "hover:bg-muted/50 cursor-pointer" : "hover:bg-muted/50"}
                                data-state={row.getIsSelected() && "selected"}
                                onClick={() => clickableRows && onRowClick && onRowClick(order)}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} cell={cell} />
                                ))}
                            </TableRowRaw>,
                        );
                    }}
                </TableBody>
                {showTotalsRow && (
                    <TableFooterRaw>
                        <TableRowRaw className="bg-muted/50 font-medium hover:bg-muted/50">
                            {columnsBeforeTotalPrice > 0 && (
                                <TableCellRaw colSpan={columnsBeforeTotalPrice} className="text-left text-sm font-semibold">
                                    {t("common.totals", "Totals")}
                                </TableCellRaw>
                            )}
                            {isColumnVisible("total_price") && (
                                <TableCellRaw className="text-sm font-semibold">
                                    <CurrencyLabel data={metadata.total} />
                                </TableCellRaw>
                            )}
                            {isColumnVisible("is_paid") && <TableCellRaw />}
                            {isColumnVisible("location") && <TableCellRaw />}
                            {isColumnVisible("created_at") && <TableCellRaw />}
                            {hasActionsColumn && <TableCellRaw />}
                        </TableRowRaw>
                    </TableFooterRaw>
                )}
            </TableProvider>
        </div>
    );
};

export const OrdersTable = memo(OrdersTableComponent);
export default OrdersTable;
