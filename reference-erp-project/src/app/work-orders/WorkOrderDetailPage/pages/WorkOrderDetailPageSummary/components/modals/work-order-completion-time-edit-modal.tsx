import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useWorkOrder } from "@/app/work-orders/contexts/WorkOrderContext";
import { toast } from "sonner";
import { patchWorkOrderCompletionTime } from "@/api/field-service/work-orders/completion-time/completion-time";
import { formatDateForAPI } from "@/utils/miscelanea";
import { DateTimePicker } from "@/app/components/forms-elements/date-time-picker";

interface WorkOrderCompletionTimeEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const WorkOrderCompletionTimeEditModal = ({
    open,
    onOpenChange,
    onSuccess,
}: WorkOrderCompletionTimeEditModalProps) => {
    const { t } = useTranslation();
    const [completionDate, setCompletionDate] = useState<Date | null>(() => new Date());
    const [isPatching, setIsPatching] = useState(false);
    const { workOrder } = useWorkOrder();
    const { orgId, workOrderId } = useParams<{ orgId: string; workOrderId: string }>();

    useEffect(() => {
        if (open) setCompletionDate(new Date());
    }, [open]);

    const handleOpenChange = (next: boolean) => {
        if (!next) setCompletionDate(new Date());
        onOpenChange(next);
    };

    const handleSubmit = async () => {
        if (!orgId || (!workOrder?.id && !workOrderId) || !completionDate) {
            toast.error(t("workOrders.completionTime.invalidDate", "Please select a completion date and time"));
            return;
        }
        setIsPatching(true);
        try {
            const completionTime = formatDateForAPI(completionDate, "second");
            const response = await patchWorkOrderCompletionTime(orgId || "", workOrder?.id || workOrderId || "", { completion_time: completionTime });
            if (response.success) {
                toast.success(t("workOrders.completionTime.updated", "Completion time updated"));
                onSuccess?.();
                handleOpenChange(false);
            } else {
                toast.error(response.error || t("workOrders.completionTime.error", "Error updating completion time"));
            }
        } catch {
            toast.error(t("workOrders.completionTime.error", "Error updating completion time"));
        } finally {
            setIsPatching(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[400px]" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>{t("workOrders.completionTime.title", "Completion time")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <DateTimePicker
                        label={t("workOrders.completionTime.placeholder", "Select the expected completion date and time")}
                        value={completionDate}
                        onChange={setCompletionDate}
                        showTime={true}
                        format24h={true}
                        placeholder={t("workOrders.completionTime.placeholder", "Select date and time")}
                    />
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={isPatching}
                    >
                        {t("common.cancel", "Cancel")}
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isPatching || !completionDate}
                    >
                        {isPatching ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                {t("common.saving", "Saving...")}
                            </>
                        ) : (
                            t("common.save", "Save")
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default WorkOrderCompletionTimeEditModal;
