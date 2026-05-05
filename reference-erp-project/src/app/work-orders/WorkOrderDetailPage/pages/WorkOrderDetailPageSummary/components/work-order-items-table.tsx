import { memo, useMemo, ReactNode } from "react";
import { Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ItemWorkOrder, getItemDisplayData, getItemDescription } from "@/types/field-service/work-orders/items";
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
import ItemLabel from "@/app/components/labels/item-label";
import TextLargeLabel from "@/app/components/labels/text-large-label";
import IdBadge from "@/app/components/id-badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

// Column keys for type-safe column visibility
export type ItemTableColumnKey =
    | "id"
    | "name"
    | "item_code"
    | "description"
    | "quantity"
    | "notes"
    | "actions";

interface WorkOrderItemsTableProps {
    items: ItemWorkOrder[];
    isLoading?: boolean;
    hiddenColumns?: ItemTableColumnKey[];
    renderActions?: (item: ItemWorkOrder) => ReactNode;
    onRowClick?: (item: ItemWorkOrder) => void;
    clickableRows?: boolean;
    emptyStateTitle?: string;
    emptyStateDescription?: string;
    onEmptyStateAction?: () => void;
    emptyStateActionLabel?: string;
    searchQuery?: string;
}

const WorkOrderItemsTableComponent = ({
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
}: WorkOrderItemsTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<ItemWorkOrder>(renderActions);

    const isColumnVisible = (columnKey: ItemTableColumnKey) => {
        return !hiddenColumns.includes(columnKey);
    };

    const columns = useMemo<ColumnDef<ItemWorkOrder>[]>(() => [
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
            cell: ({ row }: { row: any }) => (<ItemLabel data={getItemDisplayData(row.original) as any ?? undefined} />),
        },
        isColumnVisible("item_code") && {
            accessorKey: "item_code",
            header: t("items.itemCode", "Item Code"),
            enableResizing: true,
            size: 120,
            cell: ({ row }: { row: any }) => {
                const item = row.original.item;
                return item?.item_code ? (
                    <IdBadge id={item.item_code} hideIcon={true} customTooltip={t("items.itemCode", "Copy code")} />
                ) : (
                    <span className="text-muted-foreground">-</span>
                );
            },
        },
        isColumnVisible("description") && {
            accessorKey: "description",
            header: t("items.description", "Description"),
            enableResizing: true,
            size: 200,
            cell: ({ row }: { row: any }) => {
                const description = getItemDescription(row.original);
                return <TextLargeLabel data={description} />;
            },
        },
        isColumnVisible("quantity") && {
            accessorKey: "quantity",
            header: t("items.quantity", "Quantity"),
            enableResizing: true,
            size: 100,
            cell: ({ row }: { row: any }) => {
                const quantity = row.original.quantity;
                return (
                    <div className="text-sm">
                        {quantity !== null && quantity !== undefined ? quantity : '-'}
                    </div>
                );
            },
        },
        isColumnVisible("notes") && {
            accessorKey: "notes",
            header: t("items.notes", "Notes"),
            enableResizing: true,
            size: 200,
            cell: ({ row }: { row: any }) => {
                const notes = row.original.notes;
                return <TextLargeLabel data={notes} />;
            },
        },
        isColumnVisible("actions") && renderActions && {
            id: "actions",
            enableResizing: false,
            size: 52,
            header: ({ header }: { header: any }) => (
                <TableColumnHeader
                    column={header.column}
                    className="justify-center items-center flex"
                    title={''}
                />
            ),
            cell: ({ row }: { row: any }) => (
                <div className="flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
                    {renderActions(row.original)}
                </div>
            ),
            meta: {
                sticky: 'right',
            },
        },
    ].filter(Boolean) as ColumnDef<ItemWorkOrder>[], [t, hiddenColumns, renderActions]);

    const defaultEmptyTitle = searchQuery
        ? t("items.noResultsFound", "No items found")
        : t("items.noItemsTitle", "No items yet");

    const defaultEmptyDescription = searchQuery
        ? t("items.noResultsDescription", "No items match your search for '{{searchQuery}}'", { searchQuery })
        : t("items.noItemsDescription", "Start by adding your first item");

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
                                    <Button variant="outline" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEmptyStateAction?.() }}>
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
                    const item = row.original as ItemWorkOrder;
                    const rowContent = (
                        <TableRowRaw
                            key={row.id}
                            className={clickableRows ? "hover:bg-muted/50 cursor-pointer" : "hover:bg-muted/50"}
                            onClick={() => clickableRows && onRowClick && onRowClick(item)}
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

                    return wrapRowWithContextMenu(item, rowContent);
                }}
            </TableBody>
        </TableProvider>
    );
};

export const WorkOrderItemsTable = memo(WorkOrderItemsTableComponent);
export default WorkOrderItemsTable;
