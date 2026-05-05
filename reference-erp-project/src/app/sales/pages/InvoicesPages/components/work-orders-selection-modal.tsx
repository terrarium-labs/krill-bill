import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router";
import { WorkOrder } from "@/types/field-service/work-orders/work-orders";
import { getWorkOrders } from "@/api/field-service/work-orders/work-orders";
import { toast } from "sonner";
import { Loader2, ClipboardList, Check, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
    TableProvider,
    TableHeader,
    TableHeaderGroup,
    TableHead,
    TableBody,
    TableCell,
    type ColumnDef,
} from "@/components/ui/shadcn-io/table";
import { TableRow as TableRowRaw, TableCell as TableCellRaw } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import IdBadge from "@/app/components/id-badge";
import ClientLabel from "@/app/components/labels/client-label";
import DateLabel from "@/app/components/labels/date-label";
import Tag from "@/app/components/tag/tag";
import { TicketWorkOrderPriority } from "@/types/field-service/ticket-work-order-types";
import PriorityLabel from "@/app/components/labels/priority-label";
import SearchBar from "@/app/components/search-bar";
import TableFiltersRow from "@/app/components/table-filters/table-filters";
import { TableFilters } from "@/types/general/filters";
import { Switch } from "@/components/ui/switch";

interface WorkOrdersSelectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (workOrderIds: string[], groupByHeaders: boolean) => void;
    isLoading?: boolean;
}

const WorkOrdersSelectionModal = ({
    open,
    onOpenChange,
    onConfirm,
    isLoading = false,
}: WorkOrdersSelectionModalProps) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [groupByHeaders, setGroupByHeaders] = useState(true);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [tableFilters, setTableFilters] = useState<TableFilters | null>(null);
    const tableFiltersRef = useRef<TableFilters | null>(null);

    useEffect(() => {
        tableFiltersRef.current = tableFilters;
    }, [tableFilters]);

    useEffect(() => {
        if (open) {
            setSelectedIds(new Set());
            setSearchQuery("");
            setTableFilters(null);
            fetchWorkOrders();
        }
    }, [open]);

    const fetchWorkOrders = async (query?: string) => {
        if (!orgId) return;
        if (query) {
            setIsSearching(true);
        } else {
            setIsFetching(true);
        }
        try {
            const response = await getWorkOrders(orgId, query, null, tableFiltersRef.current || undefined);
            if (response.success?.work_orders) {
                setWorkOrders(response.success.work_orders);
                setNextPageToken(response.success.next_page_token || null);
                if (!tableFiltersRef.current && response.success.params) {
                    setTableFilters(response.success.params);
                }
            } else {
                toast.error(t("workorders.errorFetchingWorkOrders", "Error fetching work orders"));
            }
        } catch {
            toast.error(t("workorders.errorFetchingWorkOrders", "Error fetching work orders"));
        } finally {
            setIsFetching(false);
            setIsSearching(false);
        }
    };

    const loadMoreWorkOrders = async () => {
        if (!orgId || !nextPageToken || loadingMore) return;
        setLoadingMore(true);
        try {
            const response = await getWorkOrders(orgId, searchQuery || undefined, nextPageToken, tableFiltersRef.current || undefined);
            if (response.success?.work_orders) {
                setWorkOrders(prev => [...prev, ...response.success.work_orders]);
                setNextPageToken(response.success.next_page_token || null);
            }
        } catch {
            toast.error(t("workorders.errorFetchingWorkOrders", "Error fetching work orders"));
        } finally {
            setLoadingMore(false);
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleConfirm = () => {
        onConfirm(Array.from(selectedIds), groupByHeaders);
    };

    const allSelected = workOrders.length > 0 && selectedIds.size === workOrders.length;
    const someSelected = selectedIds.size > 0 && selectedIds.size < workOrders.length;

    const toggleAll = () => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(workOrders.map(wo => wo.id)));
        }
    };

    const columns: ColumnDef<WorkOrder>[] = [
        {
            id: "select",
            header: () => (
                <Checkbox
                    checked={allSelected || (someSelected ? "indeterminate" : false)}
                    onCheckedChange={toggleAll}
                />
            ),
            cell: ({ row }: { row: { original: WorkOrder } }) => (
                <Checkbox
                    checked={selectedIds.has(row.original.id)}
                    onCheckedChange={() => toggleSelection(row.original.id)}
                    onClick={(e) => e.stopPropagation()}
                />
            ),
            meta: { className: "w-[40px]" },
        },
        {
            accessorKey: "id",
            header: t("common.id", "ID"),
            cell: ({ row }: { row: { original: WorkOrder } }) => (
                <IdBadge id={row.original.id} hideIcon customTooltip={t("common.copyId", "Copy ID")} />
            ),
            meta: { className: "w-[80px]" },
        },
        {
            accessorKey: "is_billed",
            header: t("workorders.isBilled", "Is Billed"),
            cell: ({ row }: { row: { original: WorkOrder } }) => (
                <div className="max-w-xs truncate">{row.original.is_billed ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}</div>
            ),
            meta: { className: "w-[80px]" },
        },
        {
            accessorKey: "name",
            header: t("workorders.name", "Name"),
            cell: ({ row }: { row: { getValue: (key: string) => unknown } }) => {
                const name = row.getValue("name") as string;
                return <div className="font-medium max-w-xs truncate">{name || <span className="text-muted-foreground">-</span>}</div>;
            },
        },
        {
            accessorKey: "client",
            header: t("workorders.client", "Client"),
            cell: ({ row }: { row: { original: WorkOrder } }) => (
                <div onClick={(e) => e.stopPropagation()}>
                    <ClientLabel data={row.original.client} className="font-medium max-w-xs truncate" />
                </div>
            ),
        },
        {
            accessorKey: "priority",
            header: t("workorders.priority", "Priority"),
            cell: ({ row }: { row: { getValue: (key: string) => unknown } }) => {
                const priority = row.getValue("priority") as TicketWorkOrderPriority | undefined;
                return <PriorityLabel data={priority} variant="steps" />;
            },
        },
        {
            accessorKey: "status",
            header: t("workorders.status", "Status"),
            cell: ({ row }: { row: { original: WorkOrder } }) => (
                <Tag text={row.original.status?.name || "-"} color={row.original.status?.color || ""} className="capitalize" />
            ),
        },
        {
            accessorKey: "type",
            header: t("workorders.type", "Type"),
            cell: ({ row }: { row: { original: WorkOrder } }) => (
                row.original.type
                    ? <Tag text={row.original.type.name} color={row.original.type.color || ""} />
                    : <span className="text-muted-foreground">-</span>
            ),
        },
        {
            accessorKey: "start_date",
            header: t("workorders.startDate", "Start Date"),
            cell: ({ row }: { row: { getValue: (key: string) => unknown } }) => (
                <DateLabel data={row.getValue("start_date") as string | null} options={{ hide: ["hours", "minutes", "seconds"] }} />
            ),
        },
        {
            accessorKey: "due_date",
            header: t("workorders.dueDate", "Due Date"),
            cell: ({ row }: { row: { getValue: (key: string) => unknown } }) => (
                <DateLabel data={row.getValue("due_date") as string | null} options={{ hide: ["hours", "minutes", "seconds"] }} />
            ),
        },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[950px] max-h-[80vh] flex flex-col" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>
                        {t("salesInvoices.selectWorkOrders", "Select Work Orders For Invoice Creation")}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex items-center justify-between p-4 border border-border rounded-md">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <Switch
                                id="group-by-headers"
                                checked={groupByHeaders}
                                onCheckedChange={(checked: boolean) => setGroupByHeaders(checked)}
                            />
                            <Label htmlFor="group-by-headers" className="text-sm font-medium cursor-pointer">
                                {t("salesInvoices.groupByHeaders", "Group by headers")}
                            </Label>
                        </div>
                        <p className="text-xs text-muted-foreground pl-10">
                            {t("salesInvoices.groupByHeadersDescription", "When enabled, invoice lines from each work order will be separated with a header showing the work order name. Turn off to merge all lines together without separators.")}
                        </p>
                    </div>

                    {selectedIds.size > 0 && (
                        <span className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                            {t("common.selectedCount", "{{count}} selected", { count: selectedIds.size })}
                        </span>
                    )}
                </div>

                <SearchBar
                    value={searchQuery}
                    onChange={(query) => setSearchQuery(query)}
                    onSearch={fetchWorkOrders}
                    isLoading={isSearching}
                    placeholder={t("workorders.searchPlaceholder", "Search work orders...")}
                />

                {tableFilters && (
                    <TableFiltersRow
                        value={tableFilters}
                        onChange={(filters) => setTableFilters(filters)}
                        onFilter={() => fetchWorkOrders(searchQuery)}
                    />
                )}

                <div className="flex-1 overflow-auto min-h-0">
                    <TableProvider data={workOrders} columns={columns}>
                        <TableHeader>
                            {({ headerGroup }) => (
                                <TableHeaderGroup key={headerGroup.id} headerGroup={headerGroup}>
                                    {({ header }) => <TableHead key={header.id} header={header} />}
                                </TableHeaderGroup>
                            )}
                        </TableHeader>
                        <TableBody
                            isLoading={isFetching}
                            loadingState={<TableSkeleton columnCount={columns.length} />}
                            emptyState={
                                <TableRowRaw className="hover:bg-transparent">
                                    <TableCellRaw className="h-48 text-center hover:bg-transparent" colSpan={columns.length}>
                                        <div className="flex items-center justify-center space-y-4 flex-col">
                                            <ClipboardList className="h-10 w-10 text-muted-foreground" />
                                            <div className="flex flex-col items-center justify-center">
                                                <h3 className="text-lg font-medium">
                                                    {searchQuery
                                                        ? t("workorders.noResultsFound", "No work orders found")
                                                        : t("workorders.noWorkOrdersTitle", "No work orders yet")}
                                                </h3>
                                                <p className="text-muted-foreground">
                                                    {searchQuery
                                                        ? t("workorders.noResultsDescription", "No work orders match your search for '{{searchQuery}}'", { searchQuery })
                                                        : t("workorders.noWorkOrdersDescription", "Work orders will appear here once created")}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCellRaw>
                                </TableRowRaw>
                            }
                        >
                            {({ row }) => {
                                const workOrder = row.original as WorkOrder;
                                return (
                                    <TableRowRaw
                                        key={row.id}
                                        className="hover:bg-muted/50 cursor-pointer"
                                        data-state={selectedIds.has(workOrder.id) ? "selected" : undefined}
                                        onClick={() => toggleSelection(workOrder.id)}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} cell={cell} />
                                        ))}
                                    </TableRowRaw>
                                );
                            }}
                        </TableBody>
                    </TableProvider>
                </div>

                {nextPageToken && (
                    <div className="flex justify-center py-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadMoreWorkOrders}
                            disabled={loadingMore}
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

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        {t("common.cancel", "Cancel")}
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading || selectedIds.size === 0}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {t("common.creating", "Creating...")}
                            </>
                        ) : (
                            t("salesInvoices.createInvoice", "Create Invoice")
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default WorkOrdersSelectionModal;
