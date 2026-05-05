import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PanelRightOpen } from "lucide-react";
import OriginTreeDiagram from "@/app/components/origin-tree-diagram";
import { getWorkOrderOriginTree } from "@/api/field-service/work-orders/origin-tree/origin-tree";
import { OriginItem } from "@/types/general/origin-tree";
import { useWorkOrder } from "../../../contexts/WorkOrderContext";
import HistoryClientLocationDrawer from "./components/history-client-location-drawer";

const WorkOrderDetailPageHistory = () => {
    const { t } = useTranslation();
    const { workOrder } = useWorkOrder();
    const { workOrderId, orgId } = useParams<{ orgId: string; workOrderId: string }>();
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<OriginItem[]>([]);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const hasClient = !!workOrder?.client;
    const hasLocation = !!workOrder?.location;
    const showDrawerButton = hasClient || hasLocation;

    useEffect(() => {
        const fetchOriginTree = async () => {
            if (!workOrderId || !orgId) return;

            setLoading(true);
            try {
                const response = await getWorkOrderOriginTree(orgId, workOrderId);
                if (response.success) {
                    setItems(response.success.origin_tree || []);
                } else {
                    toast.error(t("workOrders.errorFetchingOriginTree", "Error fetching origin tree"));
                }
            } catch {
                toast.error(t("workOrders.errorFetchingOriginTree", "Error fetching origin tree"));
            } finally {
                setLoading(false);
            }
        };

        fetchOriginTree();
    }, [workOrderId, orgId, t]);

    const diagramContent = (
        <div className="relative h-full min-h-0 w-full overflow-hidden">
            <div className="absolute inset-0 max-h-full max-w-full">
                <OriginTreeDiagram
                    showTimeline={true}
                    defaultSelectedId={workOrderId}
                    items={items}
                    isLoading={loading}
                    renderActions={
                        showDrawerButton ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDrawerOpen(true)}
                            >
                                <PanelRightOpen className="h-4 w-4 mr-2" />
                                {t("workOrders.showClientHistory", "Show Client History")}
                            </Button>
                        ) : undefined
                    }
                />
            </div>
        </div>
    );

    return (
        <div className="relative h-[calc(100vh-6rem)] min-h-0 w-full max-h-[calc(100vh-6rem)] max-w-full overflow-hidden">
            {diagramContent}
            {showDrawerButton && (
                <HistoryClientLocationDrawer
                    open={drawerOpen}
                    onOpenChange={setDrawerOpen}
                    workOrder={workOrder ?? null}
                    workOrderId={workOrderId ?? undefined}
                />
            )}
        </div>
    );
};

export default WorkOrderDetailPageHistory;
