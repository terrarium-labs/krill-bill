import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { Order } from "@/types/orders/orders";
import SearchBar from "@/app/components/search-bar";
import { getWorkOrderOrders } from "@/api/field-service/work-orders/orders/orders";
import { toast } from "sonner";
import OrdersTable from "@/app/purchases/pages/OrdersPages/components/orders-table";

const WorkOrderDetailPagePurchases = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId, workOrderId } = useParams<{ orgId: string; workOrderId: string }>();
    const [orders, setOrders] = useState<Order[]>([]);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch orders function
    const fetchOrders = async (query: string = "") => {
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        if (!orgId || !workOrderId) return;

        try {
            const response = await getWorkOrderOrders(orgId, workOrderId);
            if (response.success && response.success.orders) {
                setOrders(response.success.orders);
                setNextPageToken(response.success.next_page_token || null);
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
    }, [orgId, workOrderId]);

    // Load more orders
    const loadMoreOrders = async () => {
        if (!orgId || !workOrderId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getWorkOrderOrders(orgId, workOrderId);
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

    // Handle edit order
    const handleEditOrder = (order: Order) => {
        navigate(`/${orgId}/purchases/orders/${order.id}`);
    };

    // Navigate to order detail
    const handleViewOrder = (orderId: string) => {
        navigate(`/${orgId}/purchases/orders/${orderId}`);
    };

    // Render actions for orders table
    const renderTableActions = (order: Order) => {
        return (
            <div className="flex justify-center items-center">
                <CustomActionsDropdown
                    items={[
                        {
                            label: t("common.edit", "Edit"),
                            icon: "edit",
                            onClick: () => handleEditOrder(order),
                        },
                    ]}
                />
            </div>
        );
    };

    return (
        <div className="space-y-8">
            {/* Orders section */}
            <div className="space-y-4">
                <h3 className="text-base font-semibold">
                    {t("orders.title", "Orders")}
                </h3>
                <SearchBar
                    value={searchQuery}
                    isLoading={isSearching}
                    onChange={(query) => setSearchQuery(query)}
                    onSearch={fetchOrders}
                    placeholder={t("orders.searchPlaceholder", "Search orders...")}
                />

                <OrdersTable
                    orders={orders}
                    isLoading={isLoading}
                    renderActions={renderTableActions}
                    onRowClick={(order) => handleViewOrder(order.id)}
                    clickableRows={true}
                    searchQuery={searchQuery}
                />

                {nextPageToken && (
                    <div className="flex justify-center">
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
                )}
            </div>
        </div>

    );
};

export default WorkOrderDetailPagePurchases;