import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { TimeTracking } from "@/types/field-service/work-orders/time-trackings";
import { formatDate } from "@/utils/miscelanea";
import EmployeeLabel from "@/app/components/labels/employee-label";

interface WorkOrderTimeTrackingDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    timeTracking: TimeTracking | null;
    onConfirm: () => void;
    isDeleting?: boolean;
}

const WorkOrderTimeTrackingDeleteModal: React.FC<WorkOrderTimeTrackingDeleteModalProps> = ({
    open,
    onOpenChange,
    timeTracking,
    onConfirm,
    isDeleting = false,
}) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t(
                "workOrders.deleteTimeTracking",
                "Delete Time Tracking"
            )}
            description={
                <>
                    {t(
                        "workOrders.deleteTimeTrackingConfirmation",
                        "Are you sure you want to delete this time tracking? This action cannot be undone."
                    )}
                    {timeTracking && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <div className="flex items-center gap-2 mb-2">
                                <EmployeeLabel data={timeTracking.user} />
                            </div>
                            <div className="text-sm text-muted-foreground">
                                <div>
                                    {t("workorders.startTime", "Start Time")}:{" "}
                                    {formatDate(timeTracking.start_time, {
                                        showTime: true,
                                        showSeconds: true,
                                    })}
                                </div>
                                <div>
                                    {t("workorders.endTime", "End Time")}:{" "}
                                    {formatDate(timeTracking.end_time, {
                                        showTime: true,
                                        showSeconds: true,
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default WorkOrderTimeTrackingDeleteModal;
