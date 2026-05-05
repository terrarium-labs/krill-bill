import { memo, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ClipboardList, Plus } from "lucide-react";
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
import { Checklist } from "@/types/general/checklists";
import IdBadge from "@/app/components/id-badge";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

export type ChecklistsTableColumnKey = "id" | "name" | "description" | "actions";

interface ChecklistsTableProps {
    checklists: Checklist[];
    isLoading: boolean;
    searchQuery: string;
    onRowClick?: (checklist: Checklist) => void;
    onAddChecklist?: () => void;
    renderActions?: (checklist: Checklist) => ReactNode;
    hiddenColumns?: ChecklistsTableColumnKey[] | ChecklistsTableColumnKey;
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const ChecklistsTableComponent = ({
    checklists,
    isLoading,
    searchQuery,
    onRowClick,
    onAddChecklist,
    renderActions,
    hiddenColumns = [],
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: ChecklistsTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<Checklist>(renderActions);

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

    const columns = useMemo<ColumnDef<Checklist>[]>(() => {
        const cols: ColumnDef<Checklist>[] = [
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
                header: t("checklists.columns.name", "Name"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                        <div className="font-medium">{row.original.name}</div>
                    </div>
                ),
            },
            {
                accessorKey: "description",
                header: t("checklists.columns.description", "Description"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => {
                    const description = row.getValue("description") as string;
                    return <span>{description || "-"}</span>;
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
    }, [t, renderActions]);

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider
                data={checklists}
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
                                    <ClipboardList className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {searchQuery
                                                ? t("checklists.noResultsFound", "No results found")
                                                : t("checklists.noChecklists", "No checklists found")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {searchQuery
                                                ? t("checklists.noResultsDescription", 'No results found for "{{searchQuery}}"', { searchQuery })
                                                : t("checklists.noChecklistsDescription", "Start by creating your first checklist")}
                                        </p>
                                    </div>
                                    {onAddChecklist && (
                                        <Button variant="outline" onClick={onAddChecklist}>
                                            <Plus className="h-4 w-4" />
                                            {t("checklists.addChecklist", "New checklist")}
                                        </Button>
                                    )}
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const checklist = row.original as Checklist;
                        return wrapRowWithContextMenu(
                            checklist,
                            <TableRowRaw
                                key={row.id}
                                className="hover:bg-muted/50 cursor-pointer"
                                onClick={() => onRowClick?.(checklist)}
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

export const ChecklistsTable = memo(ChecklistsTableComponent);
export default ChecklistsTable;
