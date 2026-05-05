import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { WorkOrder } from "@/types/field-service/work-orders/work-orders";

interface WorkOrderDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workOrder: WorkOrder | null;
    onConfirm: () => void;
    isDeleting?: boolean;
}

const WorkOrderDeleteModal: React.FC<WorkOrderDeleteModalProps> = ({
    open,
    onOpenChange,
    workOrder,
    onConfirm,
    isDeleting = false,
}) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t("workorders.deleteWorkOrder", "Delete Work Order")}
            description={
                <>
                    {t(
                        "workorders.deleteWorkOrderConfirmation",
                        "Are you sure you want to delete this work order? This action cannot be undone."
                    )}
                    {workOrder && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>
                                {workOrder.name ||
                                    t(
                                        "workorders.untitledWorkOrder",
                                        "Untitled Work Order"
                                    )}
                            </strong>
                            {workOrder.client &&
                                ` - ${workOrder.client.trade_name}`}
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default WorkOrderDeleteModal;
