import { memo, useMemo, useCallback, type ReactNode } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Plus, Tags, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { TableRow as TableRowRaw, TableCell as TableCellRaw } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import IdBadge from "@/app/components/id-badge";
import { cn } from "@/lib/utils";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import { OrderType } from "@/types/general/order-types";

export interface FlattenedOrderType extends OrderType {
    level: number;
    parentId?: string;
    hasChildren: boolean;
    isExpanded: boolean;
    childrenIds: string[];
    childrenCount: number;
}

export type OrderTypesTableColumnKey = "id" | "name" | "description" | "actions";

type OrderTypesTableProps = {
    flattenedData: FlattenedOrderType[];
    isLoading: boolean;
    searchQuery: string;
    onToggleExpanded?: (itemId: string, event: React.MouseEvent) => void;
    onAddOrderType?: () => void;
    renderActions?: (orderType: FlattenedOrderType) => ReactNode;
    hiddenColumns?: OrderTypesTableColumnKey[] | OrderTypesTableColumnKey;
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
};

const OrderTypesTableComponent = ({
    flattenedData,
    isLoading,
    searchQuery,
    onToggleExpanded,
    onAddOrderType,
    renderActions,
    hiddenColumns = [],
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: OrderTypesTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<FlattenedOrderType>(renderActions);

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

    const NameCell = useCallback(({ row }: { row: any }) => {
        const item: FlattenedOrderType = row.original;
        const indent = item.level * 24;

        return (
            <div
                className="flex items-center gap-2 h-6"
                style={{ paddingLeft: `${indent}px` }}
            >
                {item.hasChildren && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="p-0 h-auto w-auto"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpanded?.(item.id, e);
                        }}
                    >
                        <ChevronRight
                            className={cn(
                                "h-4 w-4 transition-all duration-300",
                                item.isExpanded ? "rotate-90" : "rotate-0",
                            )}
                        />
                    </Button>
                )}
                <span className="font-medium text-sm">{item.name}</span>
            </div>
        );
    }, [onToggleExpanded]);

    const columns = useMemo<ColumnDef<FlattenedOrderType>[]>(() => {
        const cols: ColumnDef<FlattenedOrderType>[] = [
            {
                accessorKey: "id",
                header: t("common.id", "ID"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <IdBadge
                        id={row.original.id}
                        hideIcon
                        customTooltip={t("common.copyId", "Copy ID")}
                    />
                ),
            },
            {
                accessorKey: "name",
                header: t("admin.orderTypes.columns.name", "Name"),
                enableResizing: true,
                size: 300,
                cell: NameCell,
            },
            {
                accessorKey: "description",
                header: t("admin.orderTypes.columns.description", "Description"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => {
                    const description = row.getValue("description");
                    return (
                        <span>
                            {(description as string) || <span className="text-muted-foreground">-</span>}
                        </span>
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
                    <div
                        className="flex justify-center items-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {renderActions?.(row.original)}
                    </div>
                ),
                meta: { sticky: "right" },
            },
        ];

        return cols;
    }, [t, NameCell, renderActions]);

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider
                data={flattenedData}
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
                                    <Tags className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {searchQuery
                                                ? t("admin.orderTypes.noResultsFound", "No results found")
                                                : t("admin.orderTypes.noTypes", "No order types found")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {searchQuery
                                                ? t("admin.orderTypes.noResultsDescription", 'No results found for "{{searchQuery}}"', { searchQuery })
                                                : t("admin.orderTypes.noTypesDescription", "Create your first order type to get started.")}
                                        </p>
                                    </div>
                                    {onAddOrderType && (
                                        <Button variant="outline" onClick={onAddOrderType}>
                                            <Plus className="h-4 w-4" />
                                            {t("admin.orderTypes.addType", "Add Type")}
                                        </Button>
                                    )}
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const item = row.original as FlattenedOrderType;
                        return wrapRowWithContextMenu(
                            item,
                            <TableRowRaw
                                key={row.id}
                                className="group hover:bg-muted/50"
                                data-state={row.getIsSelected() && "selected"}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} cell={cell} />
                                ))}
                            </TableRowRaw>,
                        );
                    }}
                </TableBody>
            </TableProvider>
        </div>
    );
};

export const OrderTypesTable = memo(OrderTypesTableComponent);
export default OrderTypesTable;
