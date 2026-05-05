import { memo, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Gift, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import IdBadge from "@/app/components/id-badge";
import TextLabel from "@/app/components/labels/text-label";
import TextLargeLabel from "@/app/components/labels/text-large-label";
import CurrencyLabel from "@/app/components/labels/currency-label";
import { BonusType } from "@/types/general/bonus-types";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

export type BonusTypesTableColumnKey = "id" | "name" | "description" | "amount" | "actions";

type BonusTypesTableProps = {
    bonusTypes: BonusType[];
    isLoading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    searchQuery: string;
    onLoadMore: () => void;
    onAddBonusType?: () => void;
    renderActions?: (bonusType: BonusType) => ReactNode;
    hiddenColumns?: BonusTypesTableColumnKey[] | BonusTypesTableColumnKey;
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
};

const BonusTypesTableComponent = ({
    bonusTypes,
    isLoading,
    loadingMore,
    hasMore,
    searchQuery,
    onLoadMore,
    onAddBonusType,
    renderActions,
    hiddenColumns = [],
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: BonusTypesTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<BonusType>(renderActions);

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

    const columns = useMemo<ColumnDef<BonusType>[]>(() => [
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
            header: t("admin.bonusTypes.name", "Name"),
            enableResizing: true,
            size: 180,
            cell: ({ row }) => <TextLabel data={row.original.name} />,
        },
        {
            accessorKey: "description",
            header: t("admin.bonusTypes.description", "Description"),
            enableResizing: true,
            size: 200,
            cell: ({ row }) => <TextLargeLabel data={row.original.description} />,
        },
        {
            accessorKey: "amount",
            header: t("admin.bonusTypes.amount", "Default Amount"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => <CurrencyLabel data={row.original.amount} />,
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
                    {renderActions?.(row.original)}
                </div>
            ),
            meta: { sticky: "right" },
        },
    ], [t, renderActions]);

    return (
        <>
            <div className="w-full overflow-x-auto">
                <TableProvider
                    data={bonusTypes}
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
                                        <Gift className="h-10 w-10 text-muted-foreground" />
                                        <div className="flex flex-col items-center justify-center">
                                            <h3 className="text-lg font-medium">
                                                {searchQuery
                                                    ? t("admin.bonusTypes.noResultsFound", "No bonus types found")
                                                    : t("admin.bonusTypes.noBonusTypesTitle", "No bonus types yet")}
                                            </h3>
                                            <p className="text-muted-foreground">
                                                {searchQuery
                                                    ? t("admin.bonusTypes.noResultsDescription", "No bonus types match your search for '{{searchQuery}}'", { searchQuery })
                                                    : t("admin.bonusTypes.noBonusTypesDescription", "Start by adding your first bonus type")}
                                            </p>
                                        </div>
                                        {onAddBonusType && (
                                            <Button variant="outline" onClick={onAddBonusType}>
                                                <Plus className="h-4 w-4" />
                                                {t("admin.bonusTypes.addBonusType", "Add Bonus Type")}
                                            </Button>
                                        )}
                                    </div>
                                </TableCellRaw>
                            </TableRowRaw>
                        }
                    >
                        {({ row }) => {
                            const bonusType = row.original as BonusType;
                            return wrapRowWithContextMenu(
                                bonusType,
                                <TableRowRaw
                                    key={row.id}
                                    className="hover:bg-muted/50"
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

            {hasMore && (
                <div className="flex justify-center mt-6">
                    <Button
                        variant="outline"
                        onClick={onLoadMore}
                        disabled={loadingMore || isLoading}
                        className="min-w-32"
                    >
                        {loadingMore ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {t("common.loading", "Loading...")}
                            </>
                        ) : (
                            t("common.loadMore", "Load More")
                        )}
                    </Button>
                </div>
            )}
        </>
    );
};

export const BonusTypesTable = memo(BonusTypesTableComponent);
export default BonusTypesTable;
