import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { TimeSlot } from "@/types/general/time-policies";

interface TimePolicyShiftDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    timeSlot: TimeSlot | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const TimePolicyShiftDeleteModal = ({
    open,
    onOpenChange,
    timeSlot,
    onConfirm,
    isDeleting,
}: TimePolicyShiftDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t(
                "timePolicies.shifts.delete",
                "Delete Shift"
            )}
            description={
                <>
                    {t(
                        "timePolicies.shifts.deleteConfirmation",
                        "Are you sure you want to delete this shift? This action cannot be undone."
                    )}
                    {timeSlot && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>{timeSlot.name}</strong>
                            {timeSlot.description &&
                                ` - ${timeSlot.description}`}
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default TimePolicyShiftDeleteModal;
