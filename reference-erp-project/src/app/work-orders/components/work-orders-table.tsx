import { memo, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
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
import { Check, ClipboardList, X } from "lucide-react";
import { WorkOrder } from "@/types/field-service/work-orders/work-orders";
import IdBadge from "@/app/components/id-badge";
import { useHandleOriginClick } from "@/utils/origin";
import EmployeeLabel from "@/app/components/labels/employee-label";
import DateLabel from "@/app/components/labels/date-label";
import ClientLabel from "@/app/components/labels/client-label";
import PriorityLabel from "@/app/components/labels/priority-label";
import StatusesLabel from "@/app/components/labels/statuses-label";
import { useStatuses } from "@/app/contexts/StatusesContext";
import Tag from "@/app/components/tag/tag";
import LocationLabel from "@/app/components/labels/location-label";
import TicketViewModal, { useTicketModal } from "@/app/tickets/components/ticket-view-modal";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import { TicketWorkOrderPriority } from "@/types/field-service/ticket-work-order-types";
import { cn } from "@/lib/utils";

export type WorkOrderTableColumnKey =
    | "origin"
    | "id"
    | "name"
    | "client"
    | "location"
    | "status"
    | "type"
    | "priority"
    | "supervisors"
    | "assignees"
    | "is_billed"
    | "is_paid"
    | "start_date"
    | "due_date"
    | "created_at"
    | "actions";

interface WorkOrdersTableProps {
    workOrders: WorkOrder[];
    isLoading?: boolean;
    /** Structural column hiding (for embedding this table in sub-pages). Not saved to preferences. */
    hiddenColumns?: WorkOrderTableColumnKey[] | WorkOrderTableColumnKey;
    renderActions?: (workOrder: WorkOrder) => ReactNode;
    onRowClick?: (workOrder: WorkOrder) => void;
    clickableRows?: boolean;
    searchQuery?: string;
    emptyTitle?: string;
    emptyDescription?: string;
    compact?: boolean;
    /** TanStack column visibility (from useWorkOrderTablePreferences) */
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    /** TanStack column order */
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    /** TanStack column sizing */
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const WorkOrdersTableComponent = ({
    workOrders,
    isLoading = false,
    hiddenColumns = [],
    renderActions,
    onRowClick,
    clickableRows = true,
    searchQuery = "",
    emptyTitle,
    emptyDescription,
    compact = false,
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: WorkOrdersTableProps) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const { ticketModalOpen, selectedTicketId, setTicketModalOpen, openTicketModal } = useTicketModal();
    const handleOriginClick = useHandleOriginClick(openTicketModal);
    const { wrapRowWithContextMenu } = useTableContextMenu<WorkOrder>(renderActions);
    const { statusTemplate } = useStatuses();

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

    const columns = useMemo<ColumnDef<WorkOrder>[]>(() => {
        const cols: ColumnDef<WorkOrder>[] = [
            {
                accessorKey: "origin",
                header: t("workorders.origin", "Origin"),
                enableResizing: true,
                size: 100,
                cell: ({ row }) => {
                    const wo = row.original;
                    return wo.origin ? (
                        <IdBadge
                            id={wo.origin.id}
                            hideIcon
                            customTooltip={t("workorders.goToOrigin", "Go to origin")}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleOriginClick(wo.origin);
                            }}
                        />
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    );
                },
            },
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
                header: t("workorders.name", "Name"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => (
                    <span className={cn("font-medium", compact && "text-xs")}>
                        {row.original.name || <span className="text-muted-foreground">-</span>}
                    </span>
                ),
            },
            {
                accessorKey: "client",
                header: t("workorders.client", "Client"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => (
                    <div onClick={(e) => e.stopPropagation()}>
                        <ClientLabel
                            data={row.original.client}
                            link
                            options={compact ? { textClassName: "text-xs" } : undefined}
                        />
                    </div>
                ),
            },
            {
                accessorKey: "priority",
                header: t("workorders.priority", "Priority"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <PriorityLabel
                        data={row.original.priority as TicketWorkOrderPriority | undefined}
                        variant="steps"
                        className={compact ? "[&_div]:h-4 [&_div]:w-1.5" : undefined}
                    />
                ),
            },
            {
                accessorKey: "status",
                header: t("workorders.status", "Status"),
                enableResizing: true,
                size: 130,
                cell: ({ row }) => (
                    <StatusesLabel
                        data={{ template: statusTemplate, status: row.original.status }}
                        variant="default"
                        textClassName={compact ? "text-[11px] py-0 px-1.5" : undefined}
                    />
                ),
            },
            {
                accessorKey: "type",
                header: t("workorders.type", "Type"),
                enableResizing: true,
                size: 130,
                cell: ({ row }) => {
                    const type = row.original.type;
                    return type ? (
                        <Tag
                            text={type.name}
                            color={type.color || ""}
                            className={compact ? "text-[11px] py-0 px-1.5" : undefined}
                        />
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    );
                },
            },
            {
                accessorKey: "assignees",
                header: t("workorders.assignees", "Assignees"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => {
                    const employees = (row.original.assignees ?? []).map((a) => a.employee);
                    return (
                        <EmployeeLabel
                            data={employees}
                            textClassName={compact ? "text-xs" : undefined}
                        />
                    );
                },
            },
            {
                accessorKey: "supervisors",
                header: t("workorders.supervisors", "Supervisors"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => (
                    <EmployeeLabel
                        data={row.original.supervisors}
                        textClassName={compact ? "text-xs" : undefined}
                    />
                ),
            },
            {
                accessorKey: "location",
                header: t("workorders.location", "Location"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => {
                    const wo = row.original;
                    const locationLink = wo.client?.id ? `clients/${wo.client.id}` : false;
                    return (
                        <div onClick={(e) => e.stopPropagation()}>
                            <LocationLabel
                                data={wo.location}
                                textClassName={compact ? "text-xs" : undefined}
                                link={locationLink}
                            />
                        </div>
                    );
                },
            },
            {
                accessorKey: "is_billed",
                header: t("workorders.isBilled", "Is Billed"),
                enableResizing: true,
                size: 90,
                cell: ({ row }) =>
                    row.original.is_billed ? (
                        <Check className={compact ? "h-3.5 w-3.5 text-green-500" : "h-4 w-4 text-green-500"} />
                    ) : (
                        <X className={compact ? "h-3.5 w-3.5 text-muted-foreground" : "h-4 w-4 text-muted-foreground"} />
                    ),
            },
            {
                accessorKey: "is_paid",
                header: t("workorders.isPaid", "Is Paid"),
                enableResizing: true,
                size: 90,
                cell: ({ row }) =>
                    row.original.is_paid ? (
                        <Check className={compact ? "h-3.5 w-3.5 text-green-500" : "h-4 w-4 text-green-500"} />
                    ) : (
                        <X className={compact ? "h-3.5 w-3.5 text-muted-foreground" : "h-4 w-4 text-muted-foreground"} />
                    ),
            },
            {
                accessorKey: "start_date",
                header: t("workorders.startDate", "Start Date"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <DateLabel
                        data={row.original.start_date}
                        options={{ hide: ["hours", "minutes", "seconds"] }}
                        className={compact ? "text-xs" : undefined}
                    />
                ),
            },
            {
                accessorKey: "due_date",
                header: t("workorders.dueDate", "Due Date"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <DateLabel
                        data={row.original.due_date}
                        options={{ hide: ["hours", "minutes", "seconds"] }}
                        className={compact ? "text-xs" : undefined}
                    />
                ),
            },
            {
                id: "created_at",
                header: t("common.createdAt", "Created At"),
                enableResizing: true,
                size: 150,
                cell: ({ row }) => (
                    <DateLabel
                        data={row.original.created_at}
                        options={{ hide: "seconds" }}
                        className={compact ? "text-xs" : undefined}
                    />
                ),
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
                    <div
                        className="flex justify-center items-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {renderActions(row.original)}
                    </div>
                ),
                meta: { sticky: "right" },
            });
        }

        return cols;
    }, [t, compact, renderActions, workOrders, handleOriginClick, statusTemplate]);

    return (
        <>
            <div className="w-full overflow-x-auto">
                <TableProvider
                    data={workOrders}
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
                                        <ClipboardList className="h-10 w-10 text-muted-foreground" />
                                        <div className="flex flex-col items-center justify-center">
                                            <h3 className="text-lg font-medium">
                                                {emptyTitle || (searchQuery
                                                    ? t("workorders.noResultsFound", "No work orders found")
                                                    : t("workorders.noWorkOrdersTitle", "No work orders yet"))}
                                            </h3>
                                            <p className="text-muted-foreground">
                                                {emptyDescription || (searchQuery
                                                    ? t("workorders.noResultsDescription", "No work orders match your search for '{{searchQuery}}'", { searchQuery })
                                                    : t("workorders.noWorkOrdersDescription", "Work orders will appear here once created"))}
                                            </p>
                                        </div>
                                    </div>
                                </TableCellRaw>
                            </TableRowRaw>
                        }
                    >
                        {({ row }) => {
                            const workOrder = row.original as WorkOrder;
                            const rowContent = (
                                <TableRowRaw
                                    key={row.id}
                                    className={cn(
                                        "hover:bg-muted/50",
                                        (clickableRows || onRowClick) && "cursor-pointer",
                                    )}
                                    onClick={() => (clickableRows || onRowClick) && onRowClick?.(workOrder)}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} cell={cell} />
                                    ))}
                                </TableRowRaw>
                            );
                            return wrapRowWithContextMenu(workOrder, rowContent);
                        }}
                    </TableBody>
                </TableProvider>
            </div>

            <TicketViewModal
                open={ticketModalOpen}
                onOpenChange={setTicketModalOpen}
                orgId={orgId || ""}
                ticketId={selectedTicketId}
            />
        </>
    );
};

export const WorkOrdersTable = memo(WorkOrdersTableComponent);
export default WorkOrdersTable;
