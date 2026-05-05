import { memo, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Shield, Plus } from "lucide-react";
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
import { Role } from "@/types/general/roles";
import TextLabel from "@/app/components/labels/text-label";
import TextLargeLabel from "@/app/components/labels/text-large-label";
import DateLabel from "@/app/components/labels/date-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

export type RolesTableColumnKey =
    | "id"
    | "name"
    | "description"
    | "num_permissions"
    | "created_at"
    | "actions";

interface RolesTableProps {
    data: Role[];
    isLoading?: boolean;
    hiddenColumns?: RolesTableColumnKey[] | RolesTableColumnKey;
    renderActions?: (role: Role) => ReactNode;
    onRowClick?: (role: Role) => void;
    clickableRows?: boolean;
    onEmptyStateAction?: () => void;
    emptyStateTitle?: string;
    emptyStateDescription?: string;
    emptyStateActionLabel?: string;
    searchQuery?: string;
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const RolesTableComponent = ({
    data,
    isLoading = false,
    hiddenColumns,
    renderActions,
    onRowClick,
    clickableRows = true,
    onEmptyStateAction,
    emptyStateTitle,
    emptyStateDescription,
    emptyStateActionLabel,
    searchQuery = "",
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: RolesTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<Role>(renderActions);

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

    const columns = useMemo<ColumnDef<Role>[]>(() => {
        const cols: ColumnDef<Role>[] = [
            {
                accessorKey: "id",
                header: t("admin.iam.id", "ID"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <IdBadge id={row.original.id} hideIcon customTooltip={t("common.copyId", "Copy ID")} />
                ),
            },
            {
                accessorKey: "name",
                header: t("admin.iam.name", "Name"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => (
                    <TextLabel data={row.original.name} className="font-medium text-sm" />
                ),
            },
            {
                accessorKey: "description",
                header: t("admin.iam.description", "Description"),
                enableResizing: true,
                size: 300,
                cell: ({ row }) => (
                    <TextLargeLabel data={row.original.description} />
                ),
            },
            {
                accessorKey: "num_permissions",
                header: t("admin.iam.permissions", "Permissions"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {(row.original.num_permissions as number) || 0}
                    </div>
                ),
            },
            {
                accessorKey: "created_at",
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
                    <TableColumnHeader column={header.column} className="justify-center items-center flex" title="" />
                ),
                cell: ({ row }) => (
                    <div className="flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
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
                            <TableCellRaw className="h-96 text-center hover:bg-transparent" colSpan={columns.length}>
                                <div className="flex items-center justify-center space-y-4 flex-col">
                                    <Shield className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {emptyStateTitle || (searchQuery
                                                ? t("admin.iam.noResultsFound", "No roles found")
                                                : t("admin.iam.noRolesTitle", "No roles yet"))}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {emptyStateDescription || (searchQuery
                                                ? t("admin.iam.noResultsDescription", "No roles match your search for '{{searchQuery}}'", { searchQuery })
                                                : t("admin.iam.noRolesDescription", "Create your first role to get started"))}
                                        </p>
                                    </div>
                                    {onEmptyStateAction && (
                                        <Button variant="outline" onClick={onEmptyStateAction}>
                                            <Plus className="h-4 w-4" />
                                            {emptyStateActionLabel || t("admin.iam.addRole", "Add Role")}
                                        </Button>
                                    )}
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const role = row.original;
                        const rowContent = (
                            <TableRowRaw
                                key={row.id}
                                className={clickableRows && onRowClick ? "hover:bg-muted/50 cursor-pointer" : "hover:bg-muted/50"}
                                data-state={row.getIsSelected() && "selected"}
                                onClick={() => clickableRows && onRowClick?.(role)}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} cell={cell} />
                                ))}
                            </TableRowRaw>
                        );
                        return wrapRowWithContextMenu(role, rowContent);
                    }}
                </TableBody>
            </TableProvider>
        </div>
    );
};

export const RolesTable = memo(RolesTableComponent);
export default RolesTable;
