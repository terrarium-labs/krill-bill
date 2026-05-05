import { memo, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Shield, Hourglass, Plus } from "lucide-react";
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
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import TextLargeLabel from "@/app/components/labels/text-large-label";
import TextLabel from "@/app/components/labels/text-label";
import Tag from "@/app/components/tag/tag";

interface AbsencePolicy {
    id: string;
    name: string;
    description?: string;
    number_of_counters: number;
    created_at: string;
    is_default?: boolean;
}

export type AbsencePolicyTableColumnKey =
    | "id"
    | "name"
    | "description"
    | "number_of_counters"
    | "actions";

interface AbsencePoliciesTableProps {
    absencePolicies: AbsencePolicy[];
    isLoading: boolean;
    hiddenColumns?: AbsencePolicyTableColumnKey[] | AbsencePolicyTableColumnKey;
    renderActions?: (policy: AbsencePolicy) => ReactNode;
    onRowClick?: (policy: AbsencePolicy) => void;
    clickableRows?: boolean;
    onEmptyStateAction?: () => void;
    searchQuery?: string;
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const AbsencePoliciesTableComponent = ({
    absencePolicies,
    isLoading,
    hiddenColumns = [],
    renderActions,
    onRowClick,
    clickableRows = false,
    onEmptyStateAction,
    searchQuery = "",
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: AbsencePoliciesTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<AbsencePolicy>(renderActions);

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

    const columns = useMemo<ColumnDef<AbsencePolicy>[]>(() => {
        const cols: ColumnDef<AbsencePolicy>[] = [
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
                header: t("absence-policies.columns.name", "Name"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => {
                    const absencePolicy = row.original;
                    return (
                        <div className="flex items-center gap-2">
                            <TextLabel data={absencePolicy.name} className="font-medium" />
                            {absencePolicy.is_default && (
                                <Tag
                                    text={t("absence-policies.policies.default", "Default")}
                                    color="blue"
                                />
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: "description",
                header: t("absence-policies.columns.description", "Description"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => (
                    <TextLargeLabel data={row.original.description} />
                ),
            },
            {
                accessorKey: "number_of_counters",
                header: t("absence-policies.policies.numberOfCounters", "Number of counters"),
                enableResizing: true,
                size: 160,
                cell: ({ row }) => {
                    const numberOfCounters = row.getValue("number_of_counters") as number;
                    return (
                        <div className="flex items-center gap-2">
                            <Hourglass className="h-4 w-4" />
                            {numberOfCounters}
                        </div>
                    );
                },
            },
        ];

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
                    {renderActions?.(row.original)}
                </div>
            ),
            meta: { sticky: "right" },
        });

        return cols;
    }, [t, renderActions]);

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider
                data={absencePolicies}
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
                                    <Shield className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {searchQuery
                                                ? t("absence-policies.policies.noResultsFound", "No results found")
                                                : t("absence-policies.policies.noPolicies", "No absence policies found")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {searchQuery
                                                ? t("absence-policies.policies.noResultsDescription", 'No results found for "{{searchQuery}}"', { searchQuery })
                                                : t("absence-policies.policies.noPoliciesDescription", "No absence policies found")}
                                        </p>
                                    </div>
                                    {onEmptyStateAction && (
                                        <Button variant="outline" onClick={onEmptyStateAction}>
                                            <Plus className="h-4 w-4" />
                                            {t("absence-policies.policies.addPolicy", "New policy")}
                                        </Button>
                                    )}
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const policy = row.original as AbsencePolicy;
                        return wrapRowWithContextMenu(
                            policy,
                            <TableRowRaw
                                key={row.id}
                                className={clickableRows ? "hover:bg-muted/50 cursor-pointer" : "hover:bg-muted/50"}
                                onClick={() => onRowClick?.(policy)}
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

export const AbsencePoliciesTable = memo(AbsencePoliciesTableComponent);
export default AbsencePoliciesTable;
