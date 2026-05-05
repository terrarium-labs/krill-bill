import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Calculator, Search } from "lucide-react";
import {
    TableBody,
    TableCell,
    TableColumnHeader,
    TableHead,
    TableHeader,
    TableHeaderGroup,
    TableProvider,
    type ColumnDef,
    type ColumnOrderState,
    type ColumnSizingState,
    type VisibilityState,
} from "@/components/ui/shadcn-io/table";
import type { OnChangeFn } from "@tanstack/react-table";
import { TableCell as TableCellRaw, TableRow as TableRowRaw } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { IndirectCost } from "@/types/financials/indirect-costs";
import Tag from "@/app/components/tag/tag";
import { CustomActionsDropdown } from "@/app/components/custom-actions-dropdown";

export type IndirectCostsTableColumnKey =
    | "name"
    | "description"
    | "entity"
    | "is_percentage"
    | "ranges"
    | "actions";

const ENTITY_LABELS: Record<string, { label: string; color: string }> = {
    work_orders: { label: "Work Orders", color: "blue" },
};

interface IndirectCostsTableProps {
    indirectCosts: IndirectCost[];
    isLoading: boolean;
    searchQuery: string;
    currencySymbol: string;
    onEdit: (indirectCost: IndirectCost) => void;
    onDelete: (indirectCost: IndirectCost) => void;
    hiddenColumns?: IndirectCostsTableColumnKey[] | IndirectCostsTableColumnKey;
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const IndirectCostsTableComponent = ({
    indirectCosts,
    isLoading,
    searchQuery,
    currencySymbol,
    onEdit,
    onDelete,
    hiddenColumns = [],
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: IndirectCostsTableProps) => {
    const { t } = useTranslation();

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

    const columns = useMemo<ColumnDef<IndirectCost>[]>(() => [
        {
            accessorKey: "name",
            header: t("settings.indirectCosts.name", "Name"),
            enableResizing: true,
            size: 180,
            cell: ({ row }) => (
                <span className="font-medium">{row.getValue("name")}</span>
            ),
        },
        {
            accessorKey: "description",
            header: t("settings.indirectCosts.description", "Description"),
            enableResizing: true,
            size: 200,
            cell: ({ row }) => (
                <span className="text-muted-foreground line-clamp-1">
                    {row.getValue("description") || "-"}
                </span>
            ),
        },
        {
            accessorKey: "entity",
            header: t("settings.indirectCosts.entity", "Entity"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => {
                const entity = row.getValue("entity") as string;
                const entityInfo = ENTITY_LABELS[entity] || { label: entity, color: "gray" };
                return <Tag text={entityInfo.label} color={entityInfo.color} />;
            },
        },
        {
            accessorKey: "is_percentage",
            header: t("settings.indirectCosts.type", "Type"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => {
                const isPercentage = row.getValue("is_percentage") as boolean;
                return (
                    <Tag
                        color={isPercentage ? "yellow" : "green"}
                        text={
                            isPercentage
                                ? t("settings.indirectCosts.percentage", "Percentage")
                                : t("settings.indirectCosts.fixedAmount", "Fixed Amount")
                        }
                    />
                );
            },
        },
        {
            accessorKey: "ranges",
            header: t("settings.indirectCosts.ranges", "Ranges"),
            enableResizing: true,
            size: 200,
            cell: ({ row }) => {
                const ranges = row.original.ranges || [];
                const isPercentage = row.original.is_percentage;

                if (ranges.length === 0) {
                    return (
                        <span className="text-muted-foreground">
                            {t("settings.indirectCosts.noRanges", "No ranges")}
                        </span>
                    );
                }

                return (
                    <div className="flex flex-col gap-1">
                        {ranges.slice(0, 2).map((range, idx) => (
                            <span key={idx} className="text-xs text-muted-foreground">
                                {range.from_quantity} - {range.to_quantity === null ? "∞" : range.to_quantity}
                                {" → "}
                                <span className="font-medium text-foreground">
                                    {range.value}{isPercentage ? "%" : currencySymbol}
                                </span>
                            </span>
                        ))}
                        {ranges.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                                +{ranges.length - 2} {t("settings.indirectCosts.more", "more")}
                            </span>
                        )}
                    </div>
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
            cell: ({ row }) => {
                const indirectCost = row.original;
                return (
                    <div
                        className="flex justify-center items-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("common.edit", "Edit"),
                                    icon: "edit",
                                    onClick: () => onEdit(indirectCost),
                                },
                                {
                                    label: t("common.delete", "Delete"),
                                    icon: "trash-2",
                                    onClick: () => onDelete(indirectCost),
                                    variant: "destructive",
                                },
                            ]}
                        />
                    </div>
                );
            },
            meta: { sticky: "right" },
        },
    ], [t, currencySymbol, onEdit, onDelete]);

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider
                data={indirectCosts}
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
                                    {searchQuery.trim() ? (
                                        <>
                                            <Search className="h-10 w-10 text-muted-foreground" />
                                            <div className="flex flex-col items-center justify-center">
                                                <h3 className="text-lg font-medium">
                                                    {t("settings.indirectCosts.noSearchResults", "No indirect costs found")}
                                                </h3>
                                                <p className="text-muted-foreground">
                                                    {t("settings.indirectCosts.noSearchResultsDescription", "Try adjusting your search term")}
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Calculator className="h-10 w-10 text-muted-foreground" />
                                            <div className="flex flex-col items-center justify-center">
                                                <h3 className="text-lg font-medium">
                                                    {t("settings.indirectCosts.noIndirectCostsTitle", "No indirect costs yet")}
                                                </h3>
                                                <p className="text-muted-foreground">
                                                    {t("settings.indirectCosts.noIndirectCostsDescription", "Create your first indirect cost to get started")}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => (
                        <TableRowRaw
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} cell={cell} />
                            ))}
                        </TableRowRaw>
                    )}
                </TableBody>
            </TableProvider>
        </div>
    );
};

export const IndirectCostsTable = memo(IndirectCostsTableComponent);
export default IndirectCostsTable;
