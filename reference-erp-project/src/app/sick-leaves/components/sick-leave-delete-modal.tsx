import { useTranslation } from "react-i18next";
import { SickLeave } from "@/types/employees/sick-leaves";
import { formatDate } from "@/utils/miscelanea";
import { DeleteModal } from "@/app/components/modals/delete-modal";

interface SickLeaveDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    sickLeave: SickLeave | null;
    onConfirm: () => Promise<void>;
    isDeleting: boolean;
}

export const SickLeaveDeleteModal = ({
    isOpen,
    onClose,
    sickLeave,
    onConfirm,
    isDeleting,
}: SickLeaveDeleteModalProps) => {
    const { t } = useTranslation();

    if (!sickLeave) return null;

    return (
        <DeleteModal
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            title={t("sick-leaves.deleteSickLeave", "Delete Sick Leave")}
            description={t(
                "sick-leaves.deleteSickLeaveDescription",
                "Are you sure you want to delete this sick leave? This action cannot be undone."
            )}
            onConfirm={onConfirm}
            isDeleting={isDeleting}
            contentClassName="max-w-md"
        >
            <div className="space-y-2 p-3 rounded-md bg-muted/50 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">
                        {t("sick-leaves.period", "Period")}:
                    </span>
                    <span className="font-medium">
                        {formatDate(sickLeave.start_date)} -{" "}
                        {formatDate(sickLeave.end_date)}
                    </span>
                </div>
            </div>
        </DeleteModal>
    );
};

export default SickLeaveDeleteModal;
