import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import PageHeader from "@/app/components/page-header";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { Order, OrdersMetadata } from "@/types/orders/orders";
import SearchBar from "@/app/components/search-bar";
import { getOrgOrders, postOrgOrder, postOrgOrderCancel, deleteOrgOrder } from "@/api/orgs/orders/orders";
import { toast } from "sonner";
import TableFiltersRow from "@/app/components/table-filters/table-filters";
import OrdersTable from "./components/orders-table";
import { OrderCancelModal } from "./components/order-cancel-modal";
import { OrderDeleteModal } from "./components/order-delete-modal";
import { X } from "lucide-react";
import { useTableFilters } from "@/hooks/use-table-filters";
import { useOrdersTablePreferences } from "@/hooks/use-orders-table-preferences";
import { OrderColumnSelector } from "./components/order-column-selector";

const OrdersPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const [orders, setOrders] = useState<Order[]>([]);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [metadata, setMetadata] = useState<OrdersMetadata | null>(null);

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
    } = useOrdersTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) =>
            setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback(
        (order: string[]) => setColumnOrder(order),
        [setColumnOrder],
    );

    const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<Order | null>(null);
    const [selectedOrderForDelete, setSelectedOrderForDelete] = useState<Order | null>(null);
    const [isCancellingOrder, setIsCancellingOrder] = useState(false);
    const [isDeletingOrder, setIsDeletingOrder] = useState(false);

    // Fetch orders function
    const fetchOrders = async (query: string = "") => {
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        if (!orgId) return;

        try {
            const response = await getOrgOrders(orgId, query, undefined, tableFilters || undefined);
            if (response.success && response.success.orders) {
                setOrders(response.success.orders);
                setNextPageToken(response.success.next_page_token || null);
                setMetadata(response.success.metadata || null);
                if (!tableFilters) {
                    setTableFilters(response.success.params);
                }
            } else {
                toast.error(t("orders.errorFetchingOrders") || "Error fetching orders");
            }
        } catch (error) {
            toast.error(t("orders.errorFetchingOrders") || "Error fetching orders");
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchOrders();
    }, []);

    // Load more orders
    const loadMoreOrders = async () => {
        if (!orgId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getOrgOrders(orgId, searchQuery || undefined, nextPageToken, tableFilters || undefined);
            if (response.success && response.success.orders) {
                setOrders(prev => [...prev, ...response.success.orders]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("orders.errorFetchingOrders") || "Error fetching orders");
            }
        } catch (error) {
            toast.error(t("orders.errorFetchingOrders") || "Error fetching orders");
        } finally {
            setLoadingMore(false);
            setIsLoading(false);
        }
    };

    // Handle create order
    const handleCreateOrder = async () => {
        if (!orgId) return;
        try {
            const response = await postOrgOrder(orgId);
            if (response.success) {
                toast.success(t("orders.orderCreated", "Order created successfully"));
                navigate(`/${orgId}/purchases/orders/${response.success.order_id}`);
                fetchOrders();
            } else {
                toast.error(t("orders.errorCreatingOrder", "Error creating order"));
            }
        } catch (error) {
            toast.error(t("orders.errorCreatingOrder", "Error creating order"));
        }
    };

    // Handle edit order
    const handleEditOrder = (order: Order) => {
        navigate(`/${orgId}/purchases/orders/${order.id}`);
    };

    // Navigate to order detail
    const handleViewOrder = (orderId: string) => {
        navigate(`/${orgId}/purchases/orders/${orderId}`);
    };

    // Handle cancel order
    const handleCancelOrder = async () => {
        if (!orgId || !selectedOrderForCancel) return;

        setIsCancellingOrder(true);
        try {
            const response = await postOrgOrderCancel(orgId, selectedOrderForCancel.id);

            if (response.success) {
                toast.success(t('orders.orderCancelled', 'Order cancelled successfully'));
                fetchOrders(searchQuery);
                setSelectedOrderForCancel(null);
            } else {
                toast.error(t('orders.orderCancelFailed', 'Failed to cancel order'));
            }
        } catch (error) {
            console.error("Error cancelling order:", error);
            toast.error(t('orders.orderCancelError', 'Error cancelling order'));
        } finally {
            setIsCancellingOrder(false);
        }
    };

    // Handle delete order
    const handleDeleteOrder = async () => {
        if (!orgId || !selectedOrderForDelete) return;

        setIsDeletingOrder(true);
        try {
            const response = await deleteOrgOrder(orgId, selectedOrderForDelete.id);

            if (response.success) {
                toast.success(t('orders.orderDeleted', 'Order deleted successfully'));
                fetchOrders(searchQuery);
                setSelectedOrderForDelete(null);
            } else {
                toast.error(t('orders.orderDeleteFailed', 'Failed to delete order'));
            }
        } catch (error) {
            console.error("Error deleting order:", error);
            toast.error(t('orders.orderDeleteError', 'Error deleting order'));
        } finally {
            setIsDeletingOrder(false);
        }
    };

    // Render actions for table
    const renderTableActions = (order: Order) => {
        const isDraft = order.status === "draft";
        const isCancelled = order.status === "cancelled";


        return (
            <div className="flex justify-center items-center">
                <CustomActionsDropdown
                    items={[
                        {
                            label: t("common.edit", "Edit"),
                            icon: "edit",
                            onClick: () => handleEditOrder(order),
                        },
                        {
                            label: t("common.cancelOrder", "Cancel"),
                            icon: "x",
                            onClick: () => setSelectedOrderForCancel(order),
                            variant: 'destructive',
                            showOption: order.status !== "received" && order.status !== "cancelled",
                        },
                        {
                            label: t("common.delete", "Delete"),
                            icon: "trash-2",
                            onClick: () => {
                                setSelectedOrderForDelete(order);
                            },
                            variant: 'destructive',
                            showOption: order.status === "draft",
                        },
                    ]}
                />
            </div>
        );
    };

    return (
        <>
            {/* Header */}
            <PageHeader
                title={t("orders.title", "Purchase Orders")}
                description={t("orders.description", "Manage your organization's purchase orders")}
                showBackButton={false}
                action={
                    <div className="flex items-center gap-2">
                        <Button onClick={handleCreateOrder}>
                            <Plus className="h-4 w-4" />
                            {t("orders.addOrder", "New Order")}
                        </Button>
                    </div>
                }
            />

            <SearchBar
                value={searchQuery}
                isLoading={isSearching}
                onChange={(query) => setSearchQuery(query)}
                onSearch={fetchOrders}
                placeholder={t("orders.searchPlaceholder", "Search orders...")}
            />

            {tableFilters && (
                <TableFiltersRow
                    value={tableFilters}
                    onChange={(filters) => setTableFilters(filters)}
                    onFilter={(_) => fetchOrders(searchQuery)}
                    endSlot={
                        <OrderColumnSelector
                            columnVisibility={columnVisibility}
                            columnOrder={columnOrder}
                            onColumnVisibilityChange={handleColumnVisibilityChange}
                            onColumnOrderChange={handleColumnOrderChange}
                            onReset={resetPreferences}
                        />
                    }
                />
            )}

            {/* Orders Table */}
            <OrdersTable
                orders={orders}
                isLoading={isLoading}
                renderActions={renderTableActions}
                onRowClick={(order) => handleViewOrder(order.id)}
                clickableRows={true}
                onEmptyStateAction={handleCreateOrder}
                searchQuery={searchQuery}
                metadata={metadata}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                columnOrder={columnOrder}
                onColumnOrderChange={setColumnOrder}
                columnSizing={columnSizing}
                onColumnSizingChange={setColumnSizing}
            />

            {/* Load More Button */}
            {
                nextPageToken && (
                    <div className="flex justify-center mt-6">
                        <Button
                            variant="outline"
                            onClick={loadMoreOrders}
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
                )
            }

            {/* Cancel Order Modal */}
            <OrderCancelModal
                open={!!selectedOrderForCancel}
                onOpenChange={(open) => !open && setSelectedOrderForCancel(null)}
                onConfirm={handleCancelOrder}
                isLoading={isCancellingOrder}
            />

            {/* Delete Order Modal */}
            <OrderDeleteModal
                open={!!selectedOrderForDelete}
                onOpenChange={(open) => !open && setSelectedOrderForDelete(null)}
                onConfirm={handleDeleteOrder}
                isLoading={isDeletingOrder}
            />
        </>
    );
};

export default OrdersPage;

