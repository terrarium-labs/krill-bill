import { memo, useMemo, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Receipt, TriangleAlert } from "lucide-react";
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
import IdBadge from "@/app/components/id-badge";
import Tag from "@/app/components/tag/tag";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import { formatDistanceToNow } from "date-fns";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { RateItemHierarchy } from "@/types/general/rates";

interface ClientRate {
    id: string;
    name: string;
    status: string;
    valid_from?: string;
    due_date?: string;
    item_hierarchies?: RateItemHierarchy[];
}

type ClientRatesTableProps = {
    rates: ClientRate[];
    isLoading: boolean;
    searchQuery: string;
    onAddRate?: () => void;
    onNavigateToRate?: (rateId: string) => void;
    renderActions?: (rate: ClientRate) => ReactNode;
};

const ClientRatesTableComponent = ({
    rates,
    isLoading,
    searchQuery,
    onAddRate,
    onNavigateToRate,
    renderActions,
}: ClientRatesTableProps) => {
    const { t } = useTranslation();

    const ratesWithId = rates.map((rate) => ({ ...rate, id: rate.id }));
    const { wrapRowWithContextMenu } = useTableContextMenu<ClientRate & { id: string }>(renderActions);

    const columns = useMemo<ColumnDef<ClientRate>[]>(() => [
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
            accessorKey: "rate_name",
            header: t("clients.rates.columns.name", "Rate Name"),
            enableResizing: true,
            size: 200,
            cell: ({ row }) => {
                const rate = row.original;
                return (
                    <div
                        className="font-medium text-sm hover:underline cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToRate?.(rate.id);
                        }}
                    >
                        <span>{rate.name || "-"}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: "valid_from",
            header: t("clients.rates.columns.validFrom", "Valid From"),
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
            accessorKey: "valid_to",
            header: t("clients.rates.columns.validTo", "Valid To"),
            enableResizing: true,
            size: 130,
            cell: ({ row }) => {
                const validTo = row.getValue("valid_to") as string;
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
            id: "status",
            header: t("clients.rates.columns.status", "Status"),
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
    ], [t, onNavigateToRate, renderActions]);

    return (
        <TableProvider data={ratesWithId} columns={columns} enableColumnResizing>
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
                                <Receipt className="h-10 w-10 text-muted-foreground" />
                                <div className="flex flex-col items-center justify-center">
                                    <h3 className="text-lg font-medium">
                                        {searchQuery
                                            ? t("clients.rates.noResultsFound", "No results found")
                                            : t("clients.rates.noRates", "No rates")}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {searchQuery
                                            ? t(
                                                "clients.rates.noResultsDescription",
                                                'No results found for "{{searchQuery}}"',
                                                { searchQuery }
                                              )
                                            : t(
                                                "clients.rates.noRatesDescription",
                                                "No rates assigned to this client."
                                              )}
                                    </p>
                                </div>
                                {onAddRate && (
                                    <Button variant="outline" onClick={onAddRate}>
                                        <Plus className="h-4 w-4" />
                                        {t("clients.rates.addRate", "Add rate")}
                                    </Button>
                                )}
                            </div>
                        </TableCellRaw>
                    </TableRowRaw>
                }
            >
                {({ row }) => {
                    const rate = row.original as ClientRate & { id: string };
                    return wrapRowWithContextMenu(
                        rate,
                        <TableRowRaw
                            key={row.id}
                            className="hover:bg-muted/50 cursor-pointer"
                            data-state={row.getIsSelected() && "selected"}
                            onClick={() => onNavigateToRate?.(rate.id)}
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

export const ClientRatesTable = memo(ClientRatesTableComponent);
export default ClientRatesTable;
