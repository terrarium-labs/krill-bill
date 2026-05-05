import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import IdBadge from "@/app/components/id-badge";
import Tag from "@/app/components/tag/tag";
import OrgUserLabel from "@/app/components/labels/org-user-label";
import { FlagComponent } from "@/app/components/flag-component";
import { COUNTRIES } from "@/utils/countries";
import {
    TableBody,
    TableCell,
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
import { AuditLog } from "@/types/general/audit_logs";
import { IpLocationData } from "@/types/general/location";
import {
    RelativeTime,
    RelativeTimeZone,
    RelativeTimeZoneDate,
    RelativeTimeZoneDisplay,
    RelativeTimeZoneLabel,
} from "@/components/ui/shadcn-io/relative-time";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate } from "@/utils/miscelanea";

export type LogsTableColumnKey =
    | "id"
    | "user"
    | "req_method"
    | "req_path"
    | "res_status"
    | "duration_ms"
    | "ip_address"
    | "city"
    | "api_version"
    | "created_at";

type LogsTableProps = {
    logs: AuditLog[];
    isLoading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    searchQuery: string;
    ipLocationMap: Record<string, IpLocationData>;
    onRowClick: (log: AuditLog) => void;
    onLoadMore: () => void;
    getStatusColor: (status: number) => string;
    getMethodColor: (method: string) => string;
    hiddenColumns?: LogsTableColumnKey[] | LogsTableColumnKey;
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
};

const LogsTableComponent = ({
    logs,
    isLoading,
    loadingMore,
    hasMore,
    searchQuery,
    ipLocationMap,
    onRowClick,
    onLoadMore,
    getStatusColor,
    getMethodColor,
    hiddenColumns = [],
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: LogsTableProps) => {
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

    const columns = useMemo<ColumnDef<AuditLog>[]>(() => [
        {
            accessorKey: "id",
            header: t("admin.logs.id", "ID"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => (
                <IdBadge id={row.original.id} hideIcon />
            ),
        },
        {
            accessorKey: "user",
            header: t("admin.logs.user", "User"),
            enableResizing: true,
            size: 180,
            cell: ({ row }) => {
                const user = row.original.org_user;
                return <OrgUserLabel data={user} />;
            },
        },
        {
            accessorKey: "req_method",
            header: t("admin.logs.method", "Method"),
            enableResizing: true,
            size: 85,
            cell: ({ row }) => (
                <Tag
                    text={row.getValue("req_method")}
                    color={getMethodColor(row.getValue("req_method"))}
                />
            ),
        },
        {
            accessorKey: "req_path",
            header: t("admin.logs.path", "Path"),
            enableResizing: true,
            size: 300,
            cell: ({ row }) => (
                <div className="font-mono text-xs">
                    {row.getValue("req_path") || <span className="text-muted-foreground">-</span>}
                </div>
            ),
        },
        {
            accessorKey: "res_status",
            header: t("admin.logs.status", "Status"),
            enableResizing: true,
            size: 85,
            cell: ({ row }) => (
                <Tag
                    text={row.getValue("res_status")}
                    color={getStatusColor(row.getValue("res_status"))}
                />
            ),
        },
        {
            accessorKey: "duration_ms",
            header: t("admin.logs.duration", "Duration"),
            enableResizing: true,
            size: 100,
            cell: ({ row }) => (
                <div className="text-xs font-mono">
                    {row.getValue("duration_ms")}ms
                </div>
            ),
        },
        {
            accessorKey: "ip_address",
            header: t("admin.logs.ipAddress", "IP Address"),
            enableResizing: true,
            size: 160,
            cell: ({ row }) => {
                const ip = row.getValue("ip_address") as string;
                if (!ip) return <span className="text-muted-foreground">-</span>;

                const location = ipLocationMap[ip];
                const country = location?.location?.country_code2
                    ? COUNTRIES.find((c) => c.code === location.location.country_code2)
                    : null;

                return (
                    <div className="flex items-center gap-2">
                        {country && (
                            <FlagComponent country={country.code} countryName={country.name} />
                        )}
                        <span className="font-mono text-xs">{ip}</span>
                    </div>
                );
            },
        },
        {
            id: "city",
            header: t("admin.logs.city", "City"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => {
                const ip = row.original.ip_address;
                if (!ip) return <span className="text-muted-foreground">-</span>;

                const location = ipLocationMap[ip];
                const city = location?.location?.city;

                return (
                    <div className="text-sm">
                        {city || <span className="text-muted-foreground">-</span>}
                    </div>
                );
            },
        },
        {
            accessorKey: "api_version",
            header: t("admin.logs.apiVersion", "API Version"),
            enableResizing: true,
            size: 100,
            cell: ({ row }) => (
                <div className="text-sm">
                    {row.getValue("api_version") || <span className="text-muted-foreground">-</span>}
                </div>
            ),
        },
        {
            id: "created_at",
            header: t("common.createdAt", "Created At"),
            enableResizing: true,
            size: 160,
            cell: ({ row }) => {
                const log = row.original;
                const logDate = new Date(log.created_at);
                return (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="text-sm cursor-help">
                                    {formatDate(log.created_at, { showTime: true })}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent
                                align="end"
                                className="bg-popover text-popover-foreground border shadow-md p-3"
                            >
                                <RelativeTime time={logDate}>
                                    <RelativeTimeZone zone="UTC">
                                        <RelativeTimeZoneLabel>UTC</RelativeTimeZoneLabel>
                                        <div className="flex items-center gap-2">
                                            <RelativeTimeZoneDate />
                                            <RelativeTimeZoneDisplay />
                                        </div>
                                    </RelativeTimeZone>
                                    <RelativeTimeZone
                                        zone={Intl.DateTimeFormat().resolvedOptions().timeZone}
                                    >
                                        <RelativeTimeZoneLabel>Local</RelativeTimeZoneLabel>
                                        <div className="flex items-center gap-2">
                                            <RelativeTimeZoneDate />
                                            <RelativeTimeZoneDisplay />
                                        </div>
                                    </RelativeTimeZone>
                                </RelativeTime>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            },
        },
    ], [t, getStatusColor, getMethodColor, ipLocationMap]);

    return (
        <>
            <div className="w-full overflow-x-auto">
                <TableProvider
                    data={logs}
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
                                        <div className="flex flex-col items-center justify-center">
                                            <h3 className="text-lg font-medium">
                                                {searchQuery
                                                    ? t("admin.logs.noResultsFound", "No logs found")
                                                    : t("admin.logs.noLogsTitle", "No logs yet")}
                                            </h3>
                                            <p className="text-muted-foreground">
                                                {searchQuery
                                                    ? t("admin.logs.noResultsDescription", "No logs match your search for '{{searchQuery}}'", { searchQuery })
                                                    : t("admin.logs.noLogsDescription", "Audit logs will appear here")}
                                            </p>
                                        </div>
                                    </div>
                                </TableCellRaw>
                            </TableRowRaw>
                        }
                    >
                        {({ row }) => (
                            <TableRowRaw
                                key={row.id}
                                className="hover:bg-muted/50 cursor-pointer"
                                data-state={row.getIsSelected() && "selected"}
                                onClick={() => onRowClick(row.original as AuditLog)}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} cell={cell} />
                                ))}
                            </TableRowRaw>
                        )}
                    </TableBody>
                </TableProvider>
            </div>

            {hasMore && (
                <div className="flex justify-center mt-6">
                    <Button
                        variant="outline"
                        onClick={onLoadMore}
                        disabled={loadingMore}
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

export const LogsTable = memo(LogsTableComponent);
export default LogsTable;
