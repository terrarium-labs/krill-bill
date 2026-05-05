import { Button } from "@/components/ui/button";
import { Loader2, Plus, List, Map } from "lucide-react";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import PageHeader from "@/app/components/page-header";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { WorkOrder } from "@/types/field-service/work-orders/work-orders";
import SearchBar from "../components/search-bar";
import { getWorkOrders, deleteWorkOrder } from "@/api/field-service/work-orders/work-orders";
import { toast } from "sonner";
import TableFiltersRow from "../components/table-filters/table-filters";
import WorkOrdersTable from "./components/work-orders-table";
import WorkOrderDeleteModal from "./components/work-order-delete-modal";
import WorkOrderCreateModal from "./components/work-order-create-modal";
import WorkOrdersMapView from "./components/work-orders-map-view";
import { useTableFilters } from "@/hooks/use-table-filters";
import { useWorkOrderTablePreferences } from "@/hooks/use-work-order-table-preferences";
import { WorkOrderColumnSelector } from "./components/work-order-column-selector";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/shadcn-io/tabs";

const WorkOrdersPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [workOrderToDelete, setWorkOrderToDelete] = useState<WorkOrder | null>(null);
    const [deletingWorkOrder, setDeletingWorkOrder] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Use the table filters hook with session storage (no default filters)
    const { tableFilters, setTableFilters } = useTableFilters();

    // Column preferences persisted in localStorage
    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = useWorkOrderTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) =>
            setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback(
        (order: string[]) => setColumnOrder(order),
        [setColumnOrder],
    );

    const [newWorkOrderModalOpen, setNewWorkOrderModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"list" | "map">("list");

    // Fetch work orders function
    const fetchWorkOrders = async (query: string = "") => {
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        if (!orgId) return;

        try {
            const response = await getWorkOrders(orgId, query, null, tableFilters || undefined);
            if (response.success && response.success.work_orders) {
                setWorkOrders(response.success.work_orders);
                setNextPageToken(response.success.next_page_token || null);
                if (!tableFilters) {
                    setTableFilters(response.success.params);
                }
            } else {
                toast.error(t("workorders.errorFetchingWorkOrders") || "Error fetching work orders");
            }
        } catch (error) {
            toast.error(t("workorders.errorFetchingWorkOrders") || "Error fetching work orders");
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchWorkOrders();
    }, []);

    // Load more work orders
    const loadMoreWorkOrders = async () => {
        if (!orgId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getWorkOrders(orgId, searchQuery, nextPageToken, tableFilters || undefined);
            if (response.success && response.success.work_orders) {
                setWorkOrders(prev => [...prev, ...response.success.work_orders]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("workorders.errorFetchingWorkOrders") || "Error fetching work orders");
            }
        } catch (error) {
            toast.error(t("workorders.errorFetchingWorkOrders") || "Error fetching work orders");
        } finally {
            setLoadingMore(false);
            setIsLoading(false);
        }
    };

    // Handle delete confirmation
    const handleDeleteConfirm = (workOrder: WorkOrder) => {
        setWorkOrderToDelete(workOrder);
        setDeleteModalOpen(true);
    };

    // Handle delete execution
    const handleDeleteWorkOrder = async () => {
        if (!workOrderToDelete || !orgId) return;

        setDeletingWorkOrder(true);
        try {
            const response = await deleteWorkOrder(orgId, workOrderToDelete.id);
            if (response.success) {
                toast.success(t("workorders.workOrderDeleted", "Work order deleted successfully"));
                // Remove from local state
                setWorkOrders(prev => prev.filter(w => w.id !== workOrderToDelete.id));
            } else {
                toast.error(t("workorders.errorDeletingWorkOrder", "Error deleting work order"));
            }
        } catch (error) {
            toast.error(t("workorders.errorDeletingWorkOrder", "Error deleting work order"));
        } finally {
            setDeletingWorkOrder(false);
            setDeleteModalOpen(false);
            setWorkOrderToDelete(null);
        }
    };

    // Navigate to work order detail
    const handleViewWorkOrder = (workOrder: WorkOrder) => {
        navigate(`/${orgId}/work-orders/${workOrder.id}`);
    };

    // Render table actions
    const renderTableActions = (workOrder: WorkOrder) => {
        return (
            <CustomActionsDropdown
                items={[
                    {
                        label: t("common.delete", "Delete"),
                        icon: "trash-2",
                        onClick: () => handleDeleteConfirm(workOrder),
                        variant: "destructive",
                    },
                ]}
            />
        );
    };

    // Handle work order created
    const handleWorkOrderCreated = () => {
        fetchWorkOrders(searchQuery);
        setNewWorkOrderModalOpen(false);
    };

    return (
        <>
            {/* Header */}
            <PageHeader
                title={t("workorders.title", "Work Orders")}
                description={t("workorders.description", "Manage your organization's work orders")}
                showBackButton={false}
                action={
                    <div className="flex items-center gap-2">
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "list" | "map")}>
                            <TabsList className="h-9 border-none rounded-md" activeClassName='border-none rounded-md'>
                                <TabsTrigger value="list" className="gap-2">
                                    <List className="h-4 w-4" />
                                </TabsTrigger>
                                <TabsTrigger value="map" className="gap-2">
                                    <Map className="h-4 w-4" />
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Button onClick={() => setNewWorkOrderModalOpen(true)}>
                            <Plus className="h-4 w-4" />
                            {t("workorders.addWorkOrder", "Add Work Order")}
                        </Button>
                    </div>
                }
            />

            <SearchBar
                value={searchQuery}
                isLoading={isSearching}
                onChange={(query) => setSearchQuery(query)}
                onSearch={fetchWorkOrders}
                placeholder={t("workorders.searchPlaceholder", "Search work orders...")}
            />

            {tableFilters && (
                <TableFiltersRow
                    value={tableFilters}
                    onChange={(filters) => setTableFilters(filters)}
                    onFilter={(_) => fetchWorkOrders(searchQuery)}
                    endSlot={
                        <WorkOrderColumnSelector
                            columnVisibility={columnVisibility}
                            columnOrder={columnOrder}
                            onColumnVisibilityChange={handleColumnVisibilityChange}
                            onColumnOrderChange={handleColumnOrderChange}
                            onReset={resetPreferences}
                        />
                    }
                />
            )}

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "list" | "map")} className="flex-1">
                <TabsContents transition={{ duration: 0 }} className="mt-2">
                    <TabsContent value="list" transition={{ duration: 0 }} className="mt-0">
                        <WorkOrdersTable
                            workOrders={workOrders}
                            isLoading={isLoading}
                            renderActions={renderTableActions}
                            onRowClick={handleViewWorkOrder}
                            searchQuery={searchQuery}
                            columnVisibility={columnVisibility}
                            onColumnVisibilityChange={setColumnVisibility}
                            columnOrder={columnOrder}
                            onColumnOrderChange={setColumnOrder}
                            columnSizing={columnSizing}
                            onColumnSizingChange={setColumnSizing}
                        />
                        {nextPageToken && (
                            <div className="flex justify-center mt-6">
                                <Button
                                    variant="outline"
                                    onClick={loadMoreWorkOrders}
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
                    </TabsContent>
                    <TabsContent value="map" transition={{ duration: 0 }} className="mt-0 max-h-[calc(100vh-14rem)] min-h-[400px] overflow-hidden flex flex-col">
                        <WorkOrdersMapView
                            workOrders={workOrders}
                            isLoading={isLoading}
                            nextPageToken={nextPageToken}
                            isLoadingMore={loadingMore}
                            onLoadMore={loadMoreWorkOrders}
                        />
                    </TabsContent>
                </TabsContents>
            </Tabs>

            {/* Delete Confirmation Dialog */}
            <WorkOrderDeleteModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                workOrder={workOrderToDelete}
                onConfirm={handleDeleteWorkOrder}
                isDeleting={deletingWorkOrder}
            />

            {/* New Work Order Modal */}
            <WorkOrderCreateModal
                open={newWorkOrderModalOpen}
                onOpenChange={setNewWorkOrderModalOpen}
                onWorkOrderCreatedOrUpdated={handleWorkOrderCreated}
            />
        </>
    );
};

export default WorkOrdersPage;

