import { Loader2, PackagePlus, Play, Square, PanelRightClose, PanelRightOpen, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useWorkOrder } from "@/app/work-orders/contexts/WorkOrderContext";
import { useChatContext } from "@/app/chat/context/ChatContext";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useOrgMe } from "@/app/contexts/OrgMeContext";
import {
    postWorkOrderMeStartTimeTracking,
    postWorkOrderMeStopTimeTracking,
} from "@/api/field-service/work-orders/time-trackings/time-trackings";
import { toast } from "sonner";
import WorkOrderCompletionTimeEditModal from "./modals/work-order-completion-time-edit-modal";

interface WorkOrderQuickActionsContainerProps {
    isSidebarCollapsed?: boolean;
    onToggleSidebar?: () => void;
}

const WorkOrderQuickActionsContainer = ({ isSidebarCollapsed = false, onToggleSidebar }: WorkOrderQuickActionsContainerProps) => {
    const { t } = useTranslation();
    const { workOrder, supervisors, assignees, activeTimeTracking, refreshActiveTimeTracking, refreshWorkOrder } = useWorkOrder();
    const { autoSendMessage } = useChatContext();
    const { me } = useOrgMe();
    const { orgId, workOrderId } = useParams<{ orgId: string; workOrderId: string }>();
    const [showTimeTracking, setShowTimeTracking] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isLoadingTimeTracking, setIsLoadingTimeTracking] = useState(false);
    const [completionTimeModalOpen, setCompletionTimeModalOpen] = useState(false);

    // Check if user is supervisor or assignee
    useEffect(() => {
        if (!me?.employee?.id) {
            setShowTimeTracking(false);
            return;
        }
        const isSupervisor = supervisors.some((s) => s.id === me.employee?.id) ?? false;
        const isAssignee = assignees.some((a) => a.employee?.id === me.employee?.id) ?? false;
        setShowTimeTracking(isSupervisor || isAssignee);
    }, [me?.employee?.id, supervisors, assignees]);

    // Update elapsed time
    useEffect(() => {
        if (!activeTimeTracking) {
            setElapsedTime(0);
            return;
        }
        const calculateElapsedTime = () => {
            const startTime = new Date(activeTimeTracking.start_time).getTime();
            const now = Date.now();
            const elapsed = Math.max(0, Math.floor((now - startTime) / 1000));
            setElapsedTime(elapsed);
        };
        calculateElapsedTime();
        const interval = setInterval(calculateElapsedTime, 1000);
        return () => clearInterval(interval);
    }, [activeTimeTracking]);

    const formatElapsedTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    const handleStartTimeTracking = async () => {
        if (!orgId || !workOrderId) return;
        setIsLoadingTimeTracking(true);
        try {
            const response = await postWorkOrderMeStartTimeTracking(orgId, workOrderId);
            if (response.success) {
                toast.success(t("workOrders.timeTracking.started", "Time tracking started"));
                setElapsedTime(0);
                refreshActiveTimeTracking();
            } else {
                toast.error(t("workOrders.timeTracking.errorStarting", "Error starting time tracking"));
            }
        } catch (error) {
            toast.error(t("workOrders.timeTracking.errorStarting", "Error starting time tracking"));
        } finally {
            setIsLoadingTimeTracking(false);
        }
    };

    const handleStopTimeTracking = async () => {
        if (!orgId || !workOrderId) return;
        setIsLoadingTimeTracking(true);
        try {
            const response = await postWorkOrderMeStopTimeTracking(orgId, workOrderId);
            if (response.success) {
                toast.success(t("workOrders.timeTracking.stopped", "Time tracking stopped"));
                refreshActiveTimeTracking();
            } else {
                toast.error(t("workOrders.timeTracking.errorStopping", "Error stopping time tracking"));
            }
        } catch (error) {
            toast.error(t("workOrders.timeTracking.errorStopping", "Error stopping time tracking"));
        } finally {
            setIsLoadingTimeTracking(false);
        }
    };

    const handleRequestMaterial = () => {
        if (workOrder?.id) {
            autoSendMessage("@Steve " + t("workOrders.openPurchaseOrder", "Open a purchase order for WorkOrder #") + workOrder.id);
        }
    };

    return (
        <>
            <div className="space-y-4">
                {/* Quick Actions Buttons Row */}
                <div className="flex items-center gap-4">
                    <div className="grid grid-cols-3 gap-4 flex-1">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setCompletionTimeModalOpen(true)}
                            className="w-full"
                        >
                            <Clock className="h-4 w-4 mr-2" />
                            {t("workOrders.completionTime.button", "Completion time")}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRequestMaterial}
                            className="w-full"
                        >
                            <PackagePlus className="h-4 w-4 mr-2" />
                            {t("workOrders.requestMaterial", "Request Material")}
                        </Button>
                        <Button
                        type="button"
                        variant={activeTimeTracking ? "destructive" : "outline"}
                        size="sm"
                        onClick={activeTimeTracking ? handleStopTimeTracking : handleStartTimeTracking}
                        disabled={isLoadingTimeTracking}
                        className="w-full"
                    >
                        {isLoadingTimeTracking ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : activeTimeTracking ? (
                            <>
                                <Square className="h-4 w-4 mr-2" />
                                {formatElapsedTime(elapsedTime)}
                            </>
                        ) : (
                            <>
                                <Play className="h-4 w-4 mr-2" />
                                {t("workOrders.startTracking", "Start Tracking")}
                            </>
                        )}
                    </Button>
                </div>

                {onToggleSidebar && (
                    <Button
                        type="button"
                        variant="ghost"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={onToggleSidebar}
                        title={isSidebarCollapsed ? t('common.expandSidebar', 'Expand Sidebar') : t('common.collapseSidebar', 'Collapse Sidebar')}
                    >
                        {isSidebarCollapsed ? <PanelRightOpen className="h-8 w-8 text-muted-foreground" /> : <PanelRightClose className="h-8 w-8 text-muted-foreground" />}
                    </Button>
                )}
            </div>
        </div>

            {orgId && workOrderId && (
                <WorkOrderCompletionTimeEditModal
                    open={completionTimeModalOpen}
                    onOpenChange={setCompletionTimeModalOpen}
                    onSuccess={refreshWorkOrder}
                />
            )}
    </>
    );
};

export default WorkOrderQuickActionsContainer;
