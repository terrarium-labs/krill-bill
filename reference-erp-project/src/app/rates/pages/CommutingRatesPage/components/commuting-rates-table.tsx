import { memo, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Plus, FileText, X, Check, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import IdBadge from "@/app/components/id-badge";
import { CommutingRate } from "@/types/general/commuting-rates";
import DateLabel from "@/app/components/labels/date-label";
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
import Tag from "@/app/components/tag/tag";
import CurrencyLabel from "@/app/components/labels/currency-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import { formatDistanceToNow } from "date-fns";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export type CommutingRateTableColumnKey =
    | "id"
    | "name"
    | "status"
    | "valid_from"
    | "due_date"
    | "fixed_price"
    | "price_per_km"
    | "travel_time"
    | "taxes"
    | "actions";

type CommutingRatesTableProps = {
    commutingRates: CommutingRate[];
    isLoading: boolean;
    searchQuery: string;
    onViewCommutingRate: (commutingRateId: string) => void;
    onAddCommutingRate?: () => void;
    renderActions?: (commutingRate: CommutingRate) => ReactNode;
    /** Structural column hiding (for embedding). Not saved to preferences. */
    hiddenColumns?: CommutingRateTableColumnKey[] | CommutingRateTableColumnKey;
    /** TanStack column visibility (from useCommutingRatesTablePreferences) */
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    /** TanStack column order */
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    /** TanStack column sizing */
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
};

const CommutingRatesTableComponent = ({
    commutingRates,
    isLoading,
    searchQuery,
    onViewCommutingRate,
    onAddCommutingRate,
    renderActions,
    hiddenColumns = [],
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: CommutingRatesTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<CommutingRate>(renderActions);

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

    const columns = useMemo<ColumnDef<CommutingRate>[]>(() => {
        const cols: ColumnDef<CommutingRate>[] = [
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
                header: t("commutingRates.name", "Name"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => (
                    <div className="font-medium text-sm">
                        {row.getValue("name") || <span className="text-muted-foreground">-</span>}
                        {row.original.description && (
                            <p className="text-xs text-muted-foreground font-normal truncate max-w-48">
                                {row.original.description}
                            </p>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: "status",
                header: t("commutingRates.status", "Status"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => <Tag text={row.original.status} className="capitalize" />,
            },
            {
                accessorKey: "valid_from",
                header: t("commutingRates.validFrom", "Valid From"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const validFrom = row.original.valid_from as string | null;
                    return <DateLabel data={validFrom} options={{ hide: ["seconds"] }} />;
                },
            },
            {
                accessorKey: "due_date",
                header: t("commutingRates.validTo", "Valid To"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const dueDate = row.original.due_date as string | null;
                    const isExpired = dueDate && new Date(dueDate) < new Date();
                    return (
                        <div className="flex items-center gap-2">
                            <DateLabel data={dueDate} options={{ hide: ["seconds"] }} />
                            {isExpired && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <TriangleAlert className="h-4 w-4 text-red-500" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{t("common.expiredAgo", "This rate expired {{time}} ago", { time: formatDistanceToNow(new Date(dueDate)) })}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    );
                },
            },
            {
                id: "fixed_price",
                header: t("commutingRates.fixedPrice", "Fixed Price"),
                enableResizing: true,
                size: 130,
                cell: ({ row }) => {
                    const rate = row.original;
                    if (!rate.is_fixed_price) {
                        return <span className="text-muted-foreground">{t("common.disabled", "Disabled")}</span>;
                    }
                    return (
                        <div className="flex items-center gap-1.5 text-sm">
                            <CurrencyLabel data={rate.fixed_price ?? 0} />
                        </div>
                    );
                },
            },
            {
                id: "price_per_km",
                header: t("commutingRates.pricePerKm", "Price / km"),
                enableResizing: true,
                size: 130,
                cell: ({ row }) => {
                    const rate = row.original;
                    if (!rate.is_price_per_km) {
                        return <span className="text-muted-foreground">{t("common.disabled", "Disabled")}</span>;
                    }
                    return (
                        <div className="flex items-center gap-1.5 text-sm">
                            <CurrencyLabel data={rate.price_per_km ?? 0} />
                            <span className="text-muted-foreground">/km</span>
                            {rate.min_price != null && rate.min_price > 0 && (
                                <span className="text-muted-foreground">
                                    (min. <CurrencyLabel data={rate.min_price} />)
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                id: "travel_time",
                header: t("commutingRates.travelTimeBillable", "Travel Time"),
                enableResizing: true,
                size: 130,
                cell: ({ row }) => {
                    const rate = row.original;
                    if (!rate.is_travel_time_billable) {
                        return (
                            <div className="flex items-center gap-1.5 text-sm">
                                <X className="h-3.5 w-3.5 text-red-500" />
                                <span className="text-sm">{t("common.disabled", "Disabled")}</span>
                            </div>
                        );
                    }
                    return (
                        <div className="flex items-center gap-1.5 text-sm">
                            <Check className="h-3.5 w-3.5 text-green-500" />
                            <span className="text-sm">{t("commutingRates.billable", "Billable")}</span>
                        </div>
                    );
                },
            },
            {
                id: "taxes",
                header: t("commutingRates.taxes", "Taxes"),
                enableResizing: true,
                size: 130,
                cell: ({ row }) => {
                    const taxes = row.original.taxes;
                    if (!taxes || taxes.length === 0) {
                        return <span className="text-muted-foreground">-</span>;
                    }
                    return (
                        <div className="flex items-center gap-1">
                            <Tag text={taxes[0].type} className="capitalize text-xs" color="gray" />
                            {taxes.length > 1 && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="text-xs text-muted-foreground cursor-default">
                                                +{taxes.length - 1}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                            <div className="flex flex-col gap-1">
                                                {taxes.slice(1).map((tax) => (
                                                    <span key={tax.id} className="text-xs capitalize">{tax.type}</span>
                                                ))}
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
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
                cell: ({ row }) => (
                    <div className="flex justify-center items-center">
                        {renderActions && renderActions(row.original)}
                    </div>
                ),
                meta: { sticky: "right" },
            },
        ];

        return cols;
    }, [t, renderActions]);

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider
                data={commutingRates}
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
                                    <FileText className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center">
                                        <h3 className="text-lg font-medium">
                                            {searchQuery
                                                ? t("commutingRates.noResultsFound", "No commuting rates found")
                                                : t("commutingRates.noRatesTitle", "No commuting rates yet")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {searchQuery
                                                ? t("commutingRates.noResultsDescription", "No rates match your search for '{{searchQuery}}'", { searchQuery })
                                                : t("commutingRates.noRatesDescription", "Start by adding your first commuting rate")}
                                        </p>
                                    </div>
                                    {onAddCommutingRate && (
                                        <Button variant="outline" onClick={onAddCommutingRate}>
                                            <Plus className="h-4 w-4" />
                                            {t("commutingRates.addRate", "Add Commuting Rate")}
                                        </Button>
                                    )}
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const rate = row.original as CommutingRate;
                        return wrapRowWithContextMenu(
                            rate,
                            <TableRowRaw
                                key={row.id}
                                className="hover:bg-muted/50 cursor-pointer"
                                onClick={() => onViewCommutingRate(rate.id)}
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

export const CommutingRatesTable = memo(CommutingRatesTableComponent);
export default CommutingRatesTable;
