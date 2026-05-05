import { memo, useMemo, useCallback, type ReactNode } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Plus, Network, ChevronRight, Users } from "lucide-react";
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
import Tag from "@/app/components/tag/tag";
import TextLargeLabel from "@/app/components/labels/text-large-label";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";
import { Icon, IconName } from "@/components/ui/icon-picker";
import { cn } from "@/lib/utils";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import { Group } from "@/types/general/groups";

export interface FlattenedGroup extends Group {
    level: number;
    parentId?: string;
    hasChildren: boolean;
    isExpanded: boolean;
    childrenIds: string[];
    childrenCount: number;
}

export type GroupsTableColumnKey =
    | "id"
    | "name"
    | "type"
    | "responsible"
    | "num_employees_group"
    | "description"
    | "actions";

interface GroupsTableProps {
    groups: FlattenedGroup[];
    isLoading: boolean;
    searchQuery: string;
    onRowClick: (group: FlattenedGroup) => void;
    onToggleExpanded: (groupId: string, event: React.MouseEvent) => void;
    onAddGroup?: () => void;
    renderActions?: (group: FlattenedGroup) => ReactNode;
    hiddenColumns?: GroupsTableColumnKey[] | GroupsTableColumnKey;
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const GroupsTableComponent = ({
    groups,
    isLoading,
    searchQuery,
    onRowClick,
    onToggleExpanded,
    onAddGroup,
    renderActions,
    hiddenColumns,
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: GroupsTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<FlattenedGroup>(renderActions);

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
            case "area": return "blue";
            case "department": return "green";
            case "section": return "purple";
            default: return "gray";
        }
    };

    const NameCell = useCallback(({ row }: { row: { original: FlattenedGroup } }) => {
        const item = row.original;
        const indent = item.level * 24;

        return (
            <div className="flex items-center gap-2 h-6" style={{ paddingLeft: `${indent}px` }}>
                {item.hasChildren && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="p-0 h-auto w-auto"
                        onClick={(e) => onToggleExpanded(item.id, e)}
                    >
                        <ChevronRight
                            className={cn(
                                "h-4 w-4 transition-all duration-300",
                                item.isExpanded ? "rotate-90" : "rotate-0",
                            )}
                        />
                    </Button>
                )}
                {item.icon_url && (
                    <Icon name={item.icon_url as IconName} className="min-h-4 min-w-4 max-h-4 max-w-4" />
                )}
                <span className="font-medium text-sm">{item.name}</span>
            </div>
        );
    }, [onToggleExpanded]);

    const columns = useMemo<ColumnDef<FlattenedGroup>[]>(
        () => {
            const cols: ColumnDef<FlattenedGroup>[] = [
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
                    header: t("groups.columns.name", "Name"),
                    enableResizing: true,
                    size: 280,
                    cell: NameCell,
                },
                {
                    accessorKey: "type",
                    header: t("groups.columns.type", "Type"),
                    enableResizing: true,
                    size: 120,
                    cell: ({ row }) => (
                        <Tag
                            className="capitalize"
                            text={t(`groups.type.${row.original.type}`, row.original.type as string)}
                            color={getTypeColor(row.original.type)}
                        />
                    ),
                },
                {
                    accessorKey: "responsible",
                    header: t("groups.columns.responsible", "Responsible"),
                    enableResizing: true,
                    size: 200,
                    cell: ({ row }) => {
                        const employee = row.original.responsible;
                        if (!employee) return <span className="text-muted-foreground">-</span>;
                        return <EmployeeAvatar employee={employee} showJobTitle />;
                    },
                },
                {
                    accessorKey: "num_employees_group",
                    header: t("groups.columns.employees", "Employees"),
                    enableResizing: true,
                    size: 120,
                    cell: ({ row }) => {
                        const item = row.original;
                        const directEmployees = item.num_employees_group || 0;
                        const totalEmployees = item.num_employees_total || 0;
                        const displayText = directEmployees === totalEmployees
                            ? directEmployees
                            : `${directEmployees} (${totalEmployees})`;
                        return (
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span
                                    className="text-sm"
                                    title={`Direct: ${directEmployees} | Total (incl. sub-groups): ${totalEmployees}`}
                                >
                                    {displayText}
                                </span>
                            </div>
                        );
                    },
                },
                {
                    accessorKey: "description",
                    header: t("groups.columns.description", "Description"),
                    enableResizing: true,
                    size: 250,
                    cell: ({ row }) => <TextLargeLabel data={row.original.description as string} />,
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
        },
        [t, NameCell, renderActions],
    );

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
                            <TableCellRaw className="h-96 text-center hover:bg-transparent" colSpan={columns.length}>
                                <div className="flex items-center justify-center space-y-4 flex-col">
                                    <Network className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {searchQuery
                                                ? t("groups.noResultsFound", "No results found")
                                                : t("groups.noGroups", "No groups found")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {searchQuery
                                                ? t("groups.noResultsDescription", 'No results found for "{{searchQuery}}"', { searchQuery })
                                                : t("groups.noGroupsDescription", "Create your first organizational group to get started.")}
                                        </p>
                                    </div>
                                    {onAddGroup && (
                                        <Button variant="outline" onClick={onAddGroup}>
                                            <Plus className="h-4 w-4" />
                                            {t("groups.addGroup", "Add Group")}
                                        </Button>
                                    )}
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const group = row.original;
                        return wrapRowWithContextMenu(
                            group,
                            <TableRowRaw
                                key={row.id}
                                className="group hover:bg-muted/50 cursor-pointer"
                                data-state={row.getIsSelected() && "selected"}
                                onClick={() => onRowClick(group)}
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

export const GroupsTable = memo(GroupsTableComponent);
export default GroupsTable;
