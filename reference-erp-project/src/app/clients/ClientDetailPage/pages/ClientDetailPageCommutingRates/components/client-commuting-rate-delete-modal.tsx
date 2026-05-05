import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import type { CommutingRate } from "@/types/general/commuting-rates";

interface ClientCommutingRateDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    commutingRate: CommutingRate | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const ClientCommutingRateDeleteModal = ({
    open,
    onOpenChange,
    commutingRate,
    onConfirm,
    isDeleting,
}: ClientCommutingRateDeleteModalProps) => {
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
            title={t(
                "clients.commutingRates.deleteCommutingRate",
                "Remove Commuting Rate"
            )}
            description={
                <>
                    {t(
                        "clients.commutingRates.deleteCommutingRateDescription",
                        "Are you sure you want to remove '{{name}}' from this client? This action cannot be undone.",
                        { name: commutingRate?.name || "-" }
                    )}
                    {commutingRate && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>{commutingRate.name || "-"}</strong>
                        </div>
                    )}
                </>
            }
            deleteText={t("common.delete", "Remove")}
            deletingText={t("common.deleting", "Removing...")}
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default ClientCommutingRateDeleteModal;
