import { memo, useMemo } from "react";
import { Package, Plus } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
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
import { Item } from "@/types/items/items";
import ItemLabel from "@/app/components/labels/item-label";
import TextLargeLabel from "@/app/components/labels/text-large-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

export type TaxonomyItemsTableColumnKey = "id" | "name" | "description" | "actions";

interface TaxonomyItemsTableProps {
    data: Item[];
    isLoading?: boolean;
    hiddenColumns?: TaxonomyItemsTableColumnKey[];
    renderActions?: (item: Item) => React.ReactNode;
    onRowClick?: (item: Item) => void;
    clickableRows?: boolean;
    onEmptyStateAction?: () => void;
    emptyStateTitle?: string;
    emptyStateDescription?: string;
    emptyStateActionLabel?: string;
    searchQuery?: string;
}

const TaxonomyItemsTableComponent = ({
    data,
    isLoading = false,
    hiddenColumns = [],
    renderActions,
    onRowClick,
    clickableRows = false,
    onEmptyStateAction,
    emptyStateTitle,
    emptyStateDescription,
    emptyStateActionLabel,
    searchQuery = "",
}: TaxonomyItemsTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<Item>(renderActions);

    const columns = useMemo<ColumnDef<Item>[]>(() => {
        const allColumns: ColumnDef<Item>[] = [
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
                header: t("taxonomy.columns.name", "Name"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => <ItemLabel data={row.original} link />,
            },
            {
                accessorKey: "description",
                header: t("taxonomy.columns.description", "Description"),
                enableResizing: true,
                size: 250,
                cell: ({ row }) => <TextLargeLabel data={row.getValue("description") as string} />,
            },
        ];

        if (renderActions) {
            allColumns.push({
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
                    <div className="flex justify-center items-center">
                        {renderActions(row.original)}
                    </div>
                ),
                meta: { sticky: "right" },
            });
        }

        return allColumns.filter(
            (column) => !hiddenColumns.includes((column as any).accessorKey as TaxonomyItemsTableColumnKey)
        );
    }, [t, hiddenColumns, renderActions]);

    return (
        <TableProvider data={data} columns={columns} enableColumnResizing>
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
                            className="h-48 text-center hover:bg-transparent"
                            colSpan={columns.length}
                        >
                            <div className="flex items-center justify-center space-y-4 flex-col">
                                <Package className="h-10 w-10 text-muted-foreground" />
                                <div className="flex flex-col items-center justify-center">
                                    <h3 className="text-lg font-medium">
                                        {emptyStateTitle ||
                                            (searchQuery
                                                ? t("taxonomy.items.noResultsFound", "No results found")
                                                : t("taxonomy.items.noItems", "No items found"))}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {emptyStateDescription ||
                                            (searchQuery
                                                ? t(
                                                    "taxonomy.items.noResultsDescription",
                                                    'No results found for "{{searchQuery}}"',
                                                    { searchQuery }
                                                  )
                                                : t(
                                                    "taxonomy.items.noItemsDescription",
                                                    "No items in this hierarchy yet."
                                                  ))}
                                    </p>
                                </div>
                                {onEmptyStateAction && (
                                    <Button variant="outline" onClick={onEmptyStateAction} size="sm">
                                        <Plus className="h-4 w-4" />
                                        {emptyStateActionLabel || t("taxonomy.items.addItem", "Add Item")}
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
                            className={clickableRows && onRowClick ? "hover:bg-muted/50 cursor-pointer" : "hover:bg-muted/50"}
                            data-state={row.getIsSelected() && "selected"}
                            onClick={() => {
                                if (clickableRows && onRowClick) {
                                    onRowClick(item);
                                }
                            }}
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
    );
};

export const TaxonomyItemsTable = memo(TaxonomyItemsTableComponent);
export default TaxonomyItemsTable;
