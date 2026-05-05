import { memo, useMemo, useCallback, ReactNode } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Plus, Package, ChevronRight } from "lucide-react";
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
import { formatDate } from "@/utils/miscelanea";
import { cn } from "@/lib/utils";
import Tag from "@/app/components/tag/tag";
import ItemLabel from "@/app/components/labels/item-label";
import TextLargeLabel from "@/app/components/labels/text-large-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import { Inventory } from "@/types/clients/inventory";

export interface FlattenedInventory extends Inventory {
    level: number;
    parentId?: string;
    hasChildren: boolean;
    isExpanded: boolean;
    childrenIds: string[];
    childrenCount: number;
}

type ClientLocationInventoriesTableProps = {
    flattenedData: FlattenedInventory[];
    isLoading: boolean;
    searchQuery: string;
    onRowClick?: (item: FlattenedInventory) => void;
    onToggleExpanded?: (itemId: string, event: React.MouseEvent) => void;
    onViewItem?: (itemId: string) => void;
    onAddInventory?: () => void;
    renderActions?: (item: FlattenedInventory) => ReactNode;
};

const ClientLocationInventoriesTableComponent = ({
    flattenedData,
    isLoading,
    searchQuery,
    onRowClick,
    onToggleExpanded,
    onViewItem: _onViewItem,
    onAddInventory,
    renderActions,
}: ClientLocationInventoriesTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<FlattenedInventory>(renderActions);

    const NameCell = useCallback(({ row }: { row: any }) => {
        const item: FlattenedInventory = row.original;
        const indent = item.level * 24;
        return (
            <div className="flex items-center gap-2 h-6" style={{ paddingLeft: `${indent}px` }}>
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
                                item.isExpanded ? "rotate-90" : "rotate-0"
                            )}
                        />
                    </Button>
                )}
                <span className="font-medium text-sm">{item.name}</span>
            </div>
        );
    }, [onToggleExpanded]);

    const columns = useMemo<ColumnDef<FlattenedInventory>[]>(() => [
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
            header: t("inventory.columns.itemName", "Item Name"),
            enableResizing: true,
            size: 180,
            cell: NameCell,
        },
        {
            accessorKey: "serial_number",
            header: t("inventory.columns.serialNumber", "Serial Number"),
            enableResizing: true,
            size: 130,
            cell: ({ row }) => {
                const item = row.original;
                return item.serial_number ? (
                    <IdBadge id={item.serial_number} hideIcon={true} />
                ) : (
                    <span className="text-muted-foreground">-</span>
                );
            },
        },
        {
            accessorKey: "is_service",
            header: t("inventory.columns.type", "Type"),
            enableResizing: true,
            size: 100,
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <Tag
                        text={item.is_service ? t("inventory.type.service", "Service") : t("inventory.type.component", "Component")}
                        color={item.is_service ? "blue" : "green"}
                    />
                );
            },
        },
        {
            accessorKey: "item_name",
            header: t("inventory.catalogItem", "Catalog Item"),
            enableResizing: true,
            size: 180,
            cell: ({ row }) => <ItemLabel data={row.original.item} link />,
        },
        {
            accessorKey: "description",
            header: t("inventory.columns.description", "Description"),
            enableResizing: true,
            size: 200,
            cell: ({ row }) => <TextLargeLabel data={row.getValue("description") as string} />,
        },
        {
            accessorKey: "created_at",
            header: t("inventory.columns.createdAt", "Created At"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => {
                const date = row.getValue("created_at");
                return date ? formatDate(date as string, { showTime: true }) : <span className="text-muted-foreground">-</span>;
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
                    {renderActions && renderActions(row.original)}
                </div>
            ),
            meta: { sticky: "right" },
        },
    ], [t, NameCell, renderActions]);

    return (
        <TableProvider data={flattenedData} columns={columns} enableColumnResizing>
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
                                            ? t("inventory.noResultsFound", "No results found")
                                            : t("inventory.noItems", "No items found")}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {searchQuery
                                            ? t(
                                                "inventory.noResultsDescription",
                                                'No results found for "{{searchQuery}}"',
                                                { searchQuery }
                                              )
                                            : t(
                                                "inventory.noItemsDescription",
                                                "No items found in this location."
                                              )}
                                    </p>
                                </div>
                                {onAddInventory && (
                                    <Button variant="outline" onClick={onAddInventory}>
                                        <Plus className="h-4 w-4" />
                                        {t("inventory.addItem", "Add item")}
                                    </Button>
                                )}
                            </div>
                        </TableCellRaw>
                    </TableRowRaw>
                }
            >
                {({ row }) => {
                    const item = row.original as FlattenedInventory;
                    return wrapRowWithContextMenu(
                        item,
                        <TableRowRaw
                            key={row.id}
                            className="group hover:bg-muted/50 cursor-pointer"
                            data-state={row.getIsSelected() && "selected"}
                            onClick={() => onRowClick?.(item)}
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

export const ClientLocationInventoriesTable = memo(ClientLocationInventoriesTableComponent);
export default ClientLocationInventoriesTable;
