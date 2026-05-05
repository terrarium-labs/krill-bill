import { memo, useMemo, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Clock, TriangleAlert, Check, X } from "lucide-react";
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
import { formatDate } from "@/utils/miscelanea";
import Tag from "@/app/components/tag/tag";
import IdBadge from "@/app/components/id-badge";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import { formatDistanceToNow } from "date-fns";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import CurrencyLabel from "@/app/components/labels/currency-label";
import type { CommutingRate } from "@/types/general/commuting-rates";

type ClientCommutingRatesTableProps = {
    commutingRates: CommutingRate[];
    isLoading: boolean;
    searchQuery: string;
    onAddCommutingRate?: () => void;
    onNavigateToCommutingRate?: (commutingRateId: string) => void;
    onRowClick?: (commutingRate: CommutingRate) => void;
    renderActions?: (commutingRate: CommutingRate) => ReactNode;
};

const ClientCommutingRatesTableComponent = ({
    commutingRates,
    isLoading,
    searchQuery,
    onAddCommutingRate,
    onNavigateToCommutingRate,
    onRowClick,
    renderActions,
}: ClientCommutingRatesTableProps) => {
    const { t } = useTranslation();

    const commutingRatesWithId = commutingRates.map((cr) => ({ ...cr, id: cr.id }));
    const { wrapRowWithContextMenu } = useTableContextMenu<CommutingRate & { id: string }>(renderActions);

    const columns = useMemo<ColumnDef<CommutingRate>[]>(() => [
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
            accessorKey: "commuting_rate_name",
            header: t("clients.commutingRates.columns.name", "Rate Name"),
            enableResizing: true,
            size: 180,
            cell: ({ row }) => {
                const rate = row.original;
                return (
                    <div
                        className="font-medium text-sm hover:underline cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToCommutingRate?.(rate.id);
                        }}
                    >
                        <span>{rate.name || "-"}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: "number_of_locations",
            header: t("clients.commutingRates.columns.locations", "Locations"),
            enableResizing: true,
            size: 100,
            cell: ({ row }) => (
                <span className="text-sm">{row.original.number_of_locations ?? "-"}</span>
            ),
        },
        {
            accessorKey: "valid_from",
            header: t("clients.commutingRates.columns.validFrom", "Valid From"),
            enableResizing: true,
            size: 130,
            cell: ({ row }) => {
                const validFrom = row.getValue("valid_from") as string;
                return validFrom ? (
                    <div>{formatDate(validFrom, { showTime: true, showSeconds: false })}</div>
                ) : (
                    <span className="text-muted-foreground">-</span>
                );
            },
        },
        {
            accessorKey: "due_date",
            header: t("clients.commutingRates.columns.validTo", "Valid To"),
            enableResizing: true,
            size: 130,
            cell: ({ row }) => {
                const validTo = row.getValue("due_date") as string;
                const isExpired = validTo && new Date(validTo) < new Date();
                return (
                    <div className="flex items-center gap-2">
                        {validTo ? (
                            <div>{formatDate(validTo, { showTime: true, showSeconds: false })}</div>
                        ) : (
                            <span className="text-muted-foreground">-</span>
                        )}
                        {isExpired && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <TriangleAlert className="h-4 w-4 text-red-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t("common.expiredAgo", "This rate expired {{time}} ago", { time: formatDistanceToNow(new Date(validTo)) })}</p>
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
            header: t("clients.commutingRates.columns.fixedPrice", "Fixed Price"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => {
                const rate = row.original;
                return rate.is_fixed_price ? (
                    <CurrencyLabel data={rate.fixed_price ?? 0} />
                ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                );
            },
        },
        {
            id: "price_per_km",
            header: t("clients.commutingRates.columns.pricePerKm", "Price / km"),
            enableResizing: true,
            size: 130,
            cell: ({ row }) => {
                const rate = row.original;
                return rate.is_price_per_km ? (
                    <div className="flex items-center gap-1.5 text-sm">
                        <CurrencyLabel data={rate.price_per_km ?? 0} />
                        <span className="text-muted-foreground">/km</span>
                        {rate.min_price != null && rate.min_price > 0 && (
                            <span className="text-muted-foreground">
                                (min. <CurrencyLabel data={rate.min_price} />)
                            </span>
                        )}
                    </div>
                ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                );
            },
        },
        {
            id: "travel_time",
            header: t("clients.commutingRates.columns.travelTime", "Travel Time"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => {
                const rate = row.original;
                return (
                    <div className="flex items-center gap-1.5 text-sm">
                        {rate.is_travel_time_billable ? (
                            <>
                                <Check className="h-3.5 w-3.5 text-green-500" />
                                <span>{t("commutingRates.billable", "Billable")}</span>
                            </>
                        ) : (
                            <>
                                <X className="h-3.5 w-3.5 text-red-500" />
                                <span className="text-muted-foreground">{t("common.disabled", "Disabled")}</span>
                            </>
                        )}
                    </div>
                );
            },
        },
        {
            id: "taxes",
            header: t("clients.commutingRates.columns.taxes", "Taxes"),
            enableResizing: true,
            size: 120,
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
            id: "status",
            header: t("clients.commutingRates.columns.status", "Status"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => {
                const status = row.original.status || "active";
                return <Tag text={status} className="capitalize" />;
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
    ], [t, onNavigateToCommutingRate, renderActions]);

    return (
        <TableProvider data={commutingRatesWithId} columns={columns} enableColumnResizing>
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
                                <Clock className="h-10 w-10 text-muted-foreground" />
                                <div className="flex flex-col items-center justify-center">
                                    <h3 className="text-lg font-medium">
                                        {searchQuery
                                            ? t("clients.commutingRates.noResultsFound", "No results found")
                                            : t("clients.commutingRates.noCommutingRates", "No commuting rates")}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {searchQuery
                                            ? t(
                                                "clients.commutingRates.noResultsDescription",
                                                'No results found for "{{searchQuery}}"',
                                                { searchQuery }
                                              )
                                            : t(
                                                "clients.commutingRates.noCommutingRatesDescription",
                                                "No commuting rates assigned to this client."
                                              )}
                                    </p>
                                </div>
                                {onAddCommutingRate && (
                                    <Button variant="outline" onClick={onAddCommutingRate}>
                                        <Plus className="h-4 w-4" />
                                        {t("clients.commutingRates.addCommutingRate", "Add commuting rate")}
                                    </Button>
                                )}
                            </div>
                        </TableCellRaw>
                    </TableRowRaw>
                }
            >
                {({ row }) => {
                    const commutingRate = row.original as CommutingRate & { id: string };
                    return wrapRowWithContextMenu(
                        commutingRate,
                        <TableRowRaw
                            key={row.id}
                            className="hover:bg-muted/50 cursor-pointer"
                            data-state={row.getIsSelected() && "selected"}
                            onClick={(e) => {
                                e.stopPropagation();
                                onRowClick?.(commutingRate);
                            }}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} cell={cell} />
                            ))}
                        </TableRowRaw>
                    );
                }}
            </TableBody>
        </TableProvider>
    );
};

export const ClientCommutingRatesTable = memo(ClientCommutingRatesTableComponent);
export default ClientCommutingRatesTable;
