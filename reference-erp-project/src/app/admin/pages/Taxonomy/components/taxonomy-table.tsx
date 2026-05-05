import { memo, useMemo, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { ChevronRight, Package } from "lucide-react";
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
import { IconLabel } from "@/app/components/custom-labels";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import Tag from "@/app/components/tag/tag";

export interface FlattenedItemHierarchy {
    id: string;
    name: string;
    type: string;
    icon?: string;
    color?: string;
    margin?: number | null;
    num_items_hierarchy?: number;
    num_items_total?: number;
    description?: string;
    level: number;
    parentId?: string;
    hasChildren: boolean;
    isExpanded: boolean;
    childrenIds: string[];
    childrenCount: number;
}

export type TaxonomyTableColumnKey =
    | "id"
    | "name"
    | "type"
    | "margin"
    | "num_items_hierarchy"
    | "description"
    | "actions";

interface TaxonomyTableProps {
    data: FlattenedItemHierarchy[];
    isLoading?: boolean;
    hiddenColumns?: TaxonomyTableColumnKey[] | TaxonomyTableColumnKey;
    renderActions?: (item: FlattenedItemHierarchy) => React.ReactNode;
    onRowClick?: (item: FlattenedItemHierarchy) => void;
    clickableRows?: boolean;
    onEmptyStateAction?: () => void;
    emptyStateTitle?: string;
    emptyStateDescription?: string;
    emptyStateActionLabel?: string;
    searchQuery?: string;
    toggleExpanded: (itemId: string, event: React.MouseEvent) => void;
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const TaxonomyTableComponent = ({
    data,
    isLoading = false,
    hiddenColumns = [],
    renderActions,
    onRowClick,
    clickableRows = true,
    onEmptyStateAction,
    emptyStateTitle,
    emptyStateDescription,
    emptyStateActionLabel,
    searchQuery = "",
    toggleExpanded,
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: TaxonomyTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<FlattenedItemHierarchy>(renderActions);

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

    const getTypeColor = (type: string) => {
        switch (type) {
            case "family": return "cyan";
            case "sub_family": return "emerald";
            case "category": return "yellow";
            default: return "zinc";
        }
    };

    const NameCell = useCallback(
        ({ row }: { row: any }) => {
            const item: FlattenedItemHierarchy = row.original;
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
                            onClick={(e) => toggleExpanded(item.id, e)}
                        >
                            <ChevronRight
                                className={cn(
                                    "h-4 w-4 transition-all duration-300",
                                    item.isExpanded ? "rotate-90" : "rotate-0",
                                )}
                            />
                        </Button>
                    )}
                    <IconLabel icon={item.icon} color={item.color} text={item.name} showEmptyColor={false} />
                </div>
            );
        },
        [toggleExpanded],
    );

    const columns = useMemo<ColumnDef<FlattenedItemHierarchy>[]>(() => {
        const cols: ColumnDef<FlattenedItemHierarchy>[] = [
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
                header: t("taxonomy.columns.name", "Name"),
                enableResizing: true,
                size: 300,
                cell: NameCell,
            },
            {
                accessorKey: "type",
                header: t("taxonomy.columns.type", "Type"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <Tag
                            className="capitalize"
                            text={t(`taxonomy.type.${item.type}`, item.type.replace("_", " ") as string)}
                            color={getTypeColor(item.type)}
                        />
                    );
                },
            },
            {
                accessorKey: "margin",
                header: t("taxonomy.columns.margin", "Margin"),
                enableResizing: true,
                size: 80,
                cell: ({ row }) => {
                    const item = row.original;
                    if (item.margin === null) {
                        return <span className="text-muted-foreground">-</span>;
                    }
                    return <span className="text-sm">{item.margin}%</span>;
                },
            },
            {
                accessorKey: "num_items_hierarchy",
                header: t("taxonomy.columns.itemsHierarchy", "Items"),
                enableResizing: true,
                size: 80,
                cell: ({ row }) => {
                    const item = row.original;
                    const directItems = item.num_items_hierarchy || 0;
                    const totalItems = item.num_items_total || 0;
                    const displayText =
                        directItems === totalItems ? directItems : `${directItems} (${totalItems})`;
                    return (
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <span
                                className="text-sm"
                                title={`Direct: ${directItems} | Total (incl. sub-categories): ${totalItems}`}
                            >
                                {displayText}
                            </span>
                        </div>
                    );
                },
            },
            {
                accessorKey: "description",
                header: t("taxonomy.columns.description", "Description"),
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
    }, [t, NameCell, renderActions]);

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider
                data={data}
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
                                            {emptyStateTitle ||
                                                (searchQuery
                                                    ? t("taxonomy.noResultsFound", "No results found")
                                                    : t("taxonomy.noHierarchies", "No item hierarchies found"))}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {emptyStateDescription ||
                                                (searchQuery
                                                    ? t("taxonomy.noResultsDescription", 'No results found for "{{searchQuery}}"', { searchQuery })
                                                    : t("taxonomy.noHierarchiesDescription", "Create your first item hierarchy to get started."))}
                                        </p>
                                    </div>
                                    {onEmptyStateAction && (
                                        <Button variant="outline" onClick={onEmptyStateAction}>
                                            <Package className="h-4 w-4" />
                                            {emptyStateActionLabel || t("taxonomy.addHierarchy", "Add Hierarchy")}
                                        </Button>
                                    )}
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const item = row.original as FlattenedItemHierarchy;
                        const rowContent = (
                            <TableRowRaw
                                key={row.id}
                                className={cn(
                                    "group hover:bg-muted/50",
                                    clickableRows && onRowClick && "cursor-pointer",
                                )}
                                data-state={row.getIsSelected() && "selected"}
                                onClick={() => clickableRows && onRowClick?.(item)}
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

export const TaxonomyTable = memo(TaxonomyTableComponent);
export default TaxonomyTable;
