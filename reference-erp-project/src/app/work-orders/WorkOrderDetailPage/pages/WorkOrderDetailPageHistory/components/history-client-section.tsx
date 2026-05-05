import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getWorkOrders } from "@/api/field-service/work-orders/work-orders";
import { WorkOrder } from "@/types/field-service/work-orders/work-orders";
import { TableFilters } from "@/types/general/filters";
import { useTableFilters } from "@/hooks/use-table-filters";
import WorkOrderCard from "../../../../../components/cards/work-order-card";
import DateLabel from "@/app/components/labels/date-label";

function getDateKey(createdAt: string | null | undefined): string {
    if (!createdAt) return "";
    return new Date(createdAt).toISOString().slice(0, 10);
}

const clientOnlyFilterTemplate = (clientId: string): TableFilters => ({
    global_operator: "AND",
    filters: [
        {
            key: "client",
            type: "array",
            options: [],
            endpoint: { path: "/orgs/{{org_id}}/clients", key: "clients", type: "list" },
            is_sortable: false,
            operator: "inArray",
            value: [clientId],
        },
    ],
    order_by: null,
    keys: [
        {
            key: "client",
            type: "array",
            options: [],
            endpoint: { path: "/orgs/{{org_id}}/clients", key: "clients", type: "list" },
            is_sortable: false,
            operator: "inArray",
            value: [clientId],
        },
    ],
});

interface HistoryClientSectionProps {
    clientId: string;
    currentWorkOrderId?: string;
}

export function HistoryClientSection({ clientId, currentWorkOrderId }: HistoryClientSectionProps) {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const defaultFilters = clientOnlyFilterTemplate(clientId);
    const { tableFilters } = useTableFilters({
        defaultFilters,
        autoSave: false,
    });

    useEffect(() => {
        const fetchWorkOrders = async () => {
            if (!orgId || !tableFilters) return;
            setIsLoading(true);
            try {
                const response = await getWorkOrders(orgId, "", null, tableFilters);
                if (response.success && response.success.work_orders) {
                    setWorkOrders(response.success.work_orders);
                } else {
                    toast.error(t("workorders.errorFetchingWorkOrders", "Error fetching work orders"));
                }
            } catch {
                toast.error(t("workorders.errorFetchingWorkOrders", "Error fetching work orders"));
            } finally {
                setIsLoading(false);
            }
        };

        fetchWorkOrders();
    }, [orgId, tableFilters, t]);

    if (isLoading) {
        return (
            <ScrollArea className="h-[calc(100vh-14rem)]">
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                    {t("common.loading", "Loading...")}
                </div>
            </ScrollArea>
        );
    }

    return (
        <ScrollArea className="h-[calc(100vh-14rem)]">
            <div className="flex flex-col gap-3 py-2">
                {workOrders.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-4">
                        {t("workOrders.noWorkOrdersForClient", "No work orders for this client")}
                    </div>
                ) : (
                    (() => {
                        const items: React.ReactNode[] = [];
                        let lastDateKey = "";
                        workOrders.forEach((wo) => {
                            const dateKey = getDateKey(wo.created_at);
                            if (dateKey && dateKey !== lastDateKey) {
                                lastDateKey = dateKey;
                                items.push(
                                    <DateLabel
                                        key={`date-${dateKey}`}
                                        data={wo.created_at}
                                        options={{ hide: ["hours", "minutes", "seconds"] }}
                                        className="text-muted-foreground text-sm"
                                    />
                                );
                            }
                            items.push(
                                <WorkOrderCard
                                    key={wo.id}
                                    workOrder={wo}
                                    isSelected={currentWorkOrderId === wo.id}
                                    variant="location"
                                />
                            );
                        });
                        return items;
                    })()
                )}
            </div>
        </ScrollArea>
    );
}
