import { memo, useMemo, type ReactNode } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Users, Plus } from "lucide-react";
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
import {
    TableRow as TableRowRaw,
    TableCell as TableCellRaw,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import IdBadge from "@/app/components/id-badge";
import ColorLabel from "@/app/components/labels/color-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import { cn } from "@/lib/utils";
import { OnCallGroup } from "@/types/field-service/on-call/groups";
import TextLabel from "@/app/components/labels/text-label";
import TextLargeLabel from "@/app/components/labels/text-large-label";

export type OnCallGroupsTableColumnKey =
    | "id"
    | "name"
    | "description"
    | "num_employees"
    | "color"
    | "actions";

export interface OnCallGroupsTableProps {
    groups: OnCallGroup[];
    isLoading: boolean;
    searchQuery?: string;
    onAddGroup?: () => void;
    renderActions?: (group: OnCallGroup, allGroups: OnCallGroup[]) => ReactNode;
    onRowClick?: (group: OnCallGroup) => void;
    hiddenColumns?: OnCallGroupsTableColumnKey[] | OnCallGroupsTableColumnKey;
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const OnCallGroupsTableComponent = ({
    groups,
    isLoading,
    searchQuery = "",
    onAddGroup,
    renderActions,
    onRowClick,
    hiddenColumns,
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: OnCallGroupsTableProps) => {
    const { t } = useTranslation();

    const { wrapRowWithContextMenu } = useTableContextMenu<OnCallGroup>(renderActions, groups);

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

    const columns = useMemo<ColumnDef<OnCallGroup>[]>(() => {
        const cols: ColumnDef<OnCallGroup>[] = [
            {
                accessorKey: "id",
                header: t("common.id", "ID"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <IdBadge
                        id={row.original.id}
                        hideIcon={true}
                        customTooltip={t("common.copyId", "Copy ID")}
                    />
                ),
            },
            {
                accessorKey: "name",
                header: t("on-call.groups.columns.name", "Name"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => (
                    <TextLabel data={row.original.name} className="font-medium" />
                ),
            },
            {
                accessorKey: "description",
                header: t("on-call.groups.columns.description", "Description"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => (
                    <TextLargeLabel data={row.getValue("description") as string} />
                ),
            },
            {
                accessorKey: "num_employees",
                header: t("on-call.groups.columns.employees", "Employees"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <TextLabel data={String(row.getValue("num_employees") as number)} />
                    </div>
                ),
            },
            {
                accessorKey: "color",
                header: t("on-call.groups.columns.color", "Color"),
                enableResizing: true,
                size: 100,
                cell: ({ row }) => (
                    <ColorLabel data={row.getValue("color") as string} />
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
                        {renderActions(row.original, groups)}
                    </div>
                ),
                meta: { sticky: "right" },
            });
        }

        return cols;
    }, [t, renderActions, groups]);

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider
                data={groups}
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
                                className="h-50 text-center hover:bg-transparent"
                                colSpan={columns.length}
                            >
                                <div className="flex items-center justify-center space-y-4 flex-col">
                                    <Users className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {searchQuery
                                                ? t("on-call.groups.noResultsFound", "No results found")
                                                : t("on-call.groups.noOnCallGroups", "No on call groups")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {searchQuery
                                                ? t("on-call.groups.noResultsDescription", 'No results found for "{{searchQuery}}"', { searchQuery })
                                                : t("on-call.groups.noOnCallGroupsDescription", "On call groups will appear here when employees are added to them.")}
                                        </p>
                                    </div>
                                    {onAddGroup && (
                                        <Button variant="outline" onClick={onAddGroup}>
                                            <Plus className="h-4 w-4" />
                                            {t("on-call.groups.addGroup", "Add Group")}
                                        </Button>
                                    )}
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const group = row.original as OnCallGroup;
                        const rowContent = (
                            <TableRowRaw
                                key={row.id}
                                className={cn("hover:bg-muted/50", onRowClick && "cursor-pointer")}
                                data-state={row.getIsSelected() && "selected"}
                                onClick={
                                    onRowClick
                                        ? (e) => {
                                            const target = e.target as HTMLElement;
                                            if (target.closest("[data-slot='dropdown-menu']") || target.closest("button")) return;
                                            onRowClick(group);
                                        }
                                        : undefined
                                }
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} cell={cell} />
                                ))}
                            </TableRowRaw>
                        );
                        return wrapRowWithContextMenu(group, rowContent);
                    }}
                </TableBody>
            </TableProvider>
        </div>
    );
};

export const OnCallGroupsTable = memo(OnCallGroupsTableComponent);
export default OnCallGroupsTable;
