import { useTranslation } from "@/hooks/useTranslation";
import { memo, useMemo, type ReactNode } from "react";
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
import {
    TableRow as TableRowRaw,
    TableCell as TableCellRaw,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Ticket, Lock } from "lucide-react";
import { Ticket as TicketType } from "@/types/field-service/tickets/tickets";
import IdBadge from "@/app/components/id-badge";
import ClientLabel from "@/app/components/labels/client-label";
import LocationLabel from "@/app/components/labels/location-label";
import EmployeeLabel from "@/app/components/labels/employee-label";
import PriorityLabel from "@/app/components/labels/priority-label";
import Tag from "@/app/components/tag/tag";
import DateLabel from "@/app/components/labels/date-label";
import TextLargeLabel from "@/app/components/labels/text-large-label";
import { Button } from "@/components/ui/button";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getInsightsLevelColor } from "@/app/tickets/components/ticket-insights-card";
import { formatDistanceToNow } from "date-fns";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

const getInsightsBorderClass = (level: string): string => {
    const color = getInsightsLevelColor(level);
    const map: Record<string, string> = {
        green: "border-l-green-400 dark:border-l-green-600",
        yellow: "border-l-yellow-400 dark:border-l-yellow-600",
        orange: "border-l-orange-400 dark:border-l-orange-600",
        red: "border-l-red-400 dark:border-l-red-600",
    };
    return map[color] || "";
};

export type TicketTableColumnKey =
    | "id"
    | "client"
    | "location"
    | "inventory"
    | "supervisor"
    | "type"
    | "priority"
    | "status"
    | "description"
    | "created_at"
    | "updated_at"
    | "actions";

export interface TicketsTableProps {
    tickets: TicketType[];
    isLoading: boolean;
    hiddenColumns?: TicketTableColumnKey[] | TicketTableColumnKey;
    renderActions?: (ticket: TicketType, allTickets: TicketType[]) => ReactNode;
    onRowClick?: (ticket: TicketType) => void;
    clickableRows?: boolean;
    maxRecords?: number;
    emptyStateTitle?: string;
    emptyStateDescription?: string;
    emptyStateActionLabel?: string;
    onEmptyStateAction?: () => void;
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const TicketsTableComponent = ({
    tickets,
    isLoading,
    hiddenColumns = [],
    renderActions,
    onRowClick,
    clickableRows = false,
    maxRecords,
    emptyStateTitle,
    emptyStateDescription,
    emptyStateActionLabel,
    onEmptyStateAction,
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: TicketsTableProps) => {
    const { t } = useTranslation();

    const displayedTickets = useMemo(() => {
        if (maxRecords && maxRecords > 0) return tickets.slice(0, maxRecords);
        return tickets;
    }, [tickets, maxRecords]);

    const { wrapRowWithContextMenu } = useTableContextMenu<TicketType>(renderActions, displayedTickets);

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

    const columns = useMemo<ColumnDef<TicketType>[]>(() => {
        const cols: ColumnDef<TicketType>[] = [
            {
                accessorKey: "id",
                header: t("common.id", "ID"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const ticket = row.original;
                    const isLocked = !!ticket.locked_by;
                    return (
                        <div className="flex items-center gap-2">
                            <IdBadge
                                id={ticket.id}
                                hideIcon={true}
                                customTooltip={t("common.copyId", "Copy ID")}
                            />
                            {isLocked && ticket.locked_by && (
                                <TooltipProvider delayDuration={200}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center gap-1.5 cursor-help">
                                                <Lock className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                                                <EmployeeAvatar
                                                    employee={ticket.locked_by.employee}
                                                    showName={false}
                                                    size="sm"
                                                />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            <div className="space-y-1">
                                                <div className="font-medium">
                                                    {t("tickets.lockedBy", "Locked by")} {ticket.locked_by.employee.first_name} {ticket.locked_by.employee.last_name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(ticket.locked_by.locked_at), { addSuffix: true })}
                                                </div>
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
                accessorKey: "priority",
                header: t("tickets.priority.title", "Priority"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <PriorityLabel data={row.getValue("priority") as string} variant="steps" />
                ),
            },
            {
                accessorKey: "status",
                header: t("tickets.status.title", "Status"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <Tag text={(row.getValue("status") as string).replace("_", " ")} className="capitalize" />
                ),
            },
            {
                accessorKey: "client",
                header: t("tickets.client", "Client"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => {
                    const client = row.original.client;
                    return client ? (
                        <div onClick={(e) => e.stopPropagation()}>
                            <ClientLabel data={client} link />
                        </div>
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    );
                },
            },
            {
                accessorKey: "location",
                header: t("tickets.location", "Location"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => {
                    const client = row.original.client;
                    const location = row.original.location;
                    const locationLink = client?.id ? `clients/${client?.id}` : false;
                    return <LocationLabel data={location} link={locationLink} />;
                },
            },
            {
                accessorKey: "inventory",
                header: t("tickets.inventory", "Inventory"),
                enableResizing: true,
                size: 130,
                cell: ({ row }) => {
                    const inventory = row.original.inventory;
                    return inventory ? (
                        <span className="text-sm">{inventory.name}</span>
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    );
                },
            },
            {
                accessorKey: "supervisor",
                header: t("tickets.supervisor", "Supervisor"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => {
                    const supervisors = row.original.supervisors;
                    return supervisors ? (
                        <div onClick={(e) => e.stopPropagation()}>
                            <EmployeeLabel data={supervisors} link />
                        </div>
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    );
                },
            },
            {
                accessorKey: "type",
                header: t("tickets.type", "Type"),
                enableResizing: true,
                size: 130,
                cell: ({ row }) => {
                    const type = row.original.type;
                    return type ? (
                        <Tag text={type.name} color={type.color || ""} className="capitalize" />
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    );
                },
            },
            {
                accessorKey: "description",
                header: t("tickets.description", "Description"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => (
                    <TextLargeLabel data={row.getValue("description") as string | null} />
                ),
            },
            {
                accessorKey: "created_at",
                header: t("tickets.createdAt", "Created At"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => <DateLabel data={row.getValue("created_at") as string} />,
            },
            {
                accessorKey: "updated_at",
                header: t("tickets.updatedAt", "Updated At"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => <DateLabel data={row.getValue("updated_at") as string} />,
            },
        ];

        if (renderActions) {
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
                    <div className="flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
                        {renderActions(row.original, displayedTickets)}
                    </div>
                ),
                meta: { sticky: "right" },
            });
        }

        return cols;
    }, [t, renderActions, displayedTickets]);

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider
                data={displayedTickets}
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
                                className="h-50 text-center hover:bg-transparent"
                                colSpan={columns.length}
                            >
                                <div className="flex items-center justify-center space-y-4 flex-col">
                                    <Ticket className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {emptyStateTitle || t("tickets.noTicketsTitle", "No tickets yet")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {emptyStateDescription || t("tickets.noTicketsDescription", "Tickets will appear here")}
                                        </p>
                                    </div>
                                    {onEmptyStateAction && emptyStateActionLabel && (
                                        <Button onClick={onEmptyStateAction} variant="outline">
                                            {emptyStateActionLabel}
                                        </Button>
                                    )}
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const ticket = row.original as TicketType;
                        const isLocked = !!ticket.locked_by;
                        const rowContent = (
                            <TableRowRaw
                                key={row.id}
                                className={cn(
                                    clickableRows || onRowClick
                                        ? "hover:bg-muted/50 cursor-pointer"
                                        : "hover:bg-muted/50",
                                    isLocked && "border-l-2 border-l-primary/50 bg-accent/30",
                                    ticket?.ai_insights_level != null &&
                                        cn("border-l-2", getInsightsBorderClass(ticket.ai_insights_level)),
                                )}
                                data-state={(row.getIsSelected() || isLocked) && "selected"}
                                onClick={() => onRowClick?.(ticket)}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} cell={cell} />
                                ))}
                            </TableRowRaw>
                        );
                        return wrapRowWithContextMenu(ticket, rowContent);
                    }}
                </TableBody>
            </TableProvider>
        </div>
    );
};

export const TicketsTable = memo(TicketsTableComponent);
export default TicketsTable;
