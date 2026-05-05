import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { Checklist } from "@/types/general/checklists";

interface ChecklistDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    checklist: Checklist | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const ChecklistDeleteModal = ({
    open,
    onOpenChange,
    checklist,
    onConfirm,
    isDeleting,
}: ChecklistDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t("checklists.deleteChecklist", "Delete Checklist")}
            description={
                <>
                    {t(
                        "checklists.deleteConfirmation",
                        "Are you sure you want to delete this checklist? This action cannot be undone."
                    )}
                    {checklist && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>{checklist.name}</strong>
                            {checklist.description &&
                                ` - ${checklist.description}`}
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default ChecklistDeleteModal;
