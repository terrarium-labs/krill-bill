import { useEffect, useState } from "react";
import { useEmployee } from "@/app/employees/contexts/EmployeeContext";
import { Workorder } from "@/types/work-orders/work-orders";
import { toast } from "sonner";
import { getEmployeeWorkOrders } from "@/api/employees/work-orders/work-orders";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import WorkOrdersTable from "@/app/work-orders/components/work-orders-table";
import SearchBar from "@/app/components/search-bar";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";


const EmployeeDetailPageWorkorders = () => {
    const { t } = useTranslation();
    const { employee } = useEmployee();
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    const [workOrders, setWorkOrders] = useState<Workorder[]>([]);
    const [loading, setLoading] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearching, setIsSearching] = useState(false);


    // Fetch work orders function
    const fetchWorkOrders = async (query: string = "") => {
        if (query) {
            setIsSearching(true);
        } else {
            setLoading(true);
        }
        if (!orgId || !employee) return;

        try {
            const response = await getEmployeeWorkOrders(orgId, employee.id, query, undefined);
            if (response.success && response.success.work_orders) {
                setWorkOrders(response.success.work_orders);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("employees.workOrders.errorFetchingWorkOrders") || "Error fetching work orders");
            }
        } catch (error) {
            toast.error(t("employees.workOrders.errorFetchingWorkOrders") || "Error fetching work orders");
        } finally {
            setIsSearching(false);
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        if (orgId && employee) {
            fetchWorkOrders();
        }
    }, [orgId, employee]);

    // Load more work orders
    const loadMoreWorkOrders = async () => {
        if (!orgId || !nextPageToken || loadingMore || loading) return;

        setLoadingMore(true);
        try {
            const response = await getEmployeeWorkOrders(orgId, employee.id, searchQuery, nextPageToken);
            if (response.success && response.success.work_orders) {
                setWorkOrders(prev => [...prev, ...response.success.work_orders]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("employees.workOrders.errorFetchingWorkOrders") || "Error fetching work orders");
            }
        } catch (error) {
            toast.error(t("employees.workOrders.errorFetchingWorkOrders") || "Error fetching work orders");
        } finally {
            setLoadingMore(false);
            setLoading(false);
        }
    };

    // Navigate to work order detail
    const handleViewWorkOrder = (workOrder: Workorder) => {
        navigate(`/${orgId}/work-orders/${workOrder.id}`);
    };

    // Render table actions
    const renderTableActions = (workOrder: Workorder) => {
        return (
            <CustomActionsDropdown
                items={[
                    {
                        label: t("common.view", "View"),
                        icon: "eye",
                        onClick: () => { },
                    },
                ]}
            />
        );
    };

    return (
        <>

            <SearchBar
                value={searchQuery}
                isLoading={isSearching}
                onChange={(query) => setSearchQuery(query)}
                onSearch={fetchWorkOrders}
                placeholder={t("workorders.searchPlaceholder", "Search work orders...")}
            />


            {/* Work Orders Table
            <WorkOrdersTable
                workOrders={workOrders}
                isLoading={loading}
                renderActions={renderTableActions}
                onRowClick={handleViewWorkOrder}
                searchQuery={searchQuery}
            /> */}

            {/* Load More Button */}
            {
                nextPageToken && (
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
                )
            }


        </>
    );
};

export default EmployeeDetailPageWorkorders;