import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { Rate } from "@/types/general/rates";

interface ItemRateDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    rate: Rate | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const ItemRateDeleteModal = ({
    open,
    onOpenChange,
    rate,
    onConfirm,
    isDeleting,
}: ItemRateDeleteModalProps) => {
    const { t } = useTranslation();

    const handleOpenChange = (next: boolean) => {
        onOpenChange(next);
        if (!next) {
            setTimeout(() => {
                document.body.style.removeProperty("pointer-events");
            }, 100);
        }
    };

    return (
        <DeleteModal
            open={open}
            onOpenChange={handleOpenChange}
            title={t("rates.deleteRate", "Delete Rate")}
            description={
                <>
                    {t(
                        "rates.deleteRateConfirmation",
                        "Are you sure you want to delete this rate? This action cannot be undone."
                    )}
                    {rate && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>{rate.name}</strong>
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default ItemRateDeleteModal;
