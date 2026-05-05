import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { CommutingRate } from "@/types/general/commuting-rates";

interface CommutingRateDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    commutingRate: CommutingRate | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const CommutingRateDeleteModal = ({
    open,
    onOpenChange,
    commutingRate,
    onConfirm,
    isDeleting,
}: CommutingRateDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t(
                "commutingRates.deleteRate",
                "Delete Commuting Rate"
            )}
            description={t(
                "commutingRates.deleteRateDescription",
                'Are you sure you want to delete "{{name}}"? This action cannot be undone.',
                { name: commutingRate?.name ?? "" }
            )}
            onConfirm={onConfirm}
            isDeleting={isDeleting}
            contentClassName="max-w-md"
        />
    );
};

export default CommutingRateDeleteModal;
