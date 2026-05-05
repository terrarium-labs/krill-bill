import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { IndirectCost } from "@/types/financials/indirect-costs";

export interface IndirectCostDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    indirectCost: IndirectCost | null;
    onConfirm: () => Promise<void>;
    isDeleting: boolean;
}

const IndirectCostDeleteModal = ({
    isOpen,
    onClose,
    indirectCost,
    onConfirm,
    isDeleting,
}: IndirectCostDeleteModalProps) => {
    const { t } = useTranslation();

    if (!indirectCost) return null;

    return (
        <DeleteModal
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            title={t(
                "settings.indirectCosts.deleteIndirectCost",
                "Delete Indirect Cost"
            )}
            description={
                <>
                    {t(
                        "settings.indirectCosts.deleteConfirmation",
                        "Are you sure you want to delete this indirect cost? This action cannot be undone."
                    )}
                    <div className="mt-2 p-2 bg-muted rounded">
                        <strong>{indirectCost.name}</strong>
                    </div>
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default IndirectCostDeleteModal;
