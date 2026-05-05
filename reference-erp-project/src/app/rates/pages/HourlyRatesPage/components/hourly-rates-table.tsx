import { memo, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Plus, FileText, TriangleAlert, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import IdBadge from "@/app/components/id-badge";
import { HourlyRate } from "@/types/general/hourly-rates";
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
import DateLabel from "@/app/components/labels/date-label";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import { formatDistanceToNow } from "date-fns";

export type HourlyRateTableColumnKey =
    | "id"
    | "name"
    | "status"
    | "valid_from"
    | "due_date"
    | "number_job_titles"
    | "actions";

type HourlyRatesTableProps = {
    hourlyRates: HourlyRate[];
    isLoading: boolean;
    searchQuery: string;
    onViewHourlyRate: (hourlyRateId: string) => void;
    onAddHourlyRate?: () => void;
    renderActions?: (hourlyRate: HourlyRate) => ReactNode;
    /** Structural column hiding (for embedding). Not saved to preferences. */
    hiddenColumns?: HourlyRateTableColumnKey[] | HourlyRateTableColumnKey;
    /** TanStack column visibility (from useHourlyRatesTablePreferences) */
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    /** TanStack column order */
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    /** TanStack column sizing */
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
};

const HourlyRatesTableComponent = ({
    hourlyRates,
    isLoading,
    searchQuery,
    onViewHourlyRate,
    onAddHourlyRate,
    renderActions,
    hiddenColumns = [],
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: HourlyRatesTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<HourlyRate>(renderActions);

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

    const columns = useMemo<ColumnDef<HourlyRate>[]>(() => {
        const cols: ColumnDef<HourlyRate>[] = [
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
                header: t("hourlyRates.name", "Name"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => (
                    <div className="font-medium text-sm">
                        {row.getValue("name") || <span className="text-muted-foreground">-</span>}
                    </div>
                ),
            },
            {
                accessorKey: "status",
                header: t("hourlyRates.status", "Status"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <Tag text={row.original.status as string} className="capitalize" />
                ),
            },
            {
                accessorKey: "valid_from",
                header: t("hourlyRates.validFrom", "Valid From"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const validFrom = row.original.valid_from as string | null;
                    return <DateLabel data={validFrom} options={{ hide: ["seconds"] }} />;
                },
            },
            {
                accessorKey: "due_date",
                header: t("hourlyRates.validTo", "Valid To"),
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
                accessorKey: "number_job_titles",
                header: t("hourlyRates.numberJobTitles", "Number of Job Titles"),
                enableResizing: true,
                size: 130,
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        <span className="text-sm">{row.getValue("number_job_titles") || 0}</span>
                    </div>
                ),
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
                data={hourlyRates}
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
                                    <FileText className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {searchQuery
                                                ? t("hourlyRates.noResultsFound", "No hourly rates found")
                                                : t("hourlyRates.noHourlyRatesTitle", "No hourly rates yet")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {searchQuery
                                                ? t("hourlyRates.noResultsDescription", "No hourly rates match your search for '{{searchQuery}}'", { searchQuery })
                                                : t("hourlyRates.noHourlyRatesDescription", "Start by adding your first hourly rate")}
                                        </p>
                                    </div>
                                    {onAddHourlyRate && (
                                        <Button variant="outline" onClick={onAddHourlyRate}>
                                            <Plus className="h-4 w-4" />
                                            {t("hourlyRates.addHourlyRate", "Add Hourly Rate")}
                                        </Button>
                                    )}
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const hourlyRate = row.original as HourlyRate;
                        return wrapRowWithContextMenu(
                            hourlyRate,
                            <TableRowRaw
                                key={row.id}
                                className="hover:bg-muted/50 cursor-pointer"
                                onClick={() => onViewHourlyRate(hourlyRate.id)}
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

export const HourlyRatesTable = memo(HourlyRatesTableComponent);
export default HourlyRatesTable;
