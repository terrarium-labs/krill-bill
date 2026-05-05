import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { Workplace } from "@/types/general/workplaces";

export interface WorkplaceDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    workplace: Workplace | null;
    onConfirm: () => Promise<void>;
    isDeleting: boolean;
}

export const WorkplaceDeleteModal = ({
    isOpen,
    onClose,
    workplace,
    onConfirm,
    isDeleting,
}: WorkplaceDeleteModalProps) => {
    const { t } = useTranslation();

    if (!workplace) return null;

    return (
        <DeleteModal
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            title={t(
                "admin.workplaces.deleteWorkplace",
                "Delete Workplace"
            )}
            description={
                <>
                    {t(
                        "admin.workplaces.deleteWorkplaceConfirmation",
                        "Are you sure you want to delete this workplace? This action cannot be undone."
                    )}
                    <div className="mt-2 p-2 bg-muted rounded">
                        <strong>{workplace.name}</strong>
                    </div>
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default WorkplaceDeleteModal;
