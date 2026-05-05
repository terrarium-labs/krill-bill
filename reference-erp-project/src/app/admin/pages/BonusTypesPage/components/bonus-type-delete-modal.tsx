import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { BonusType } from "@/types/general/bonus-types";

type BonusTypeDeleteModalProps = {
    open: boolean;
    bonusType: BonusType | null;
    deleting: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
};

const BonusTypeDeleteModal = ({
    open,
    bonusType,
    deleting,
    onOpenChange,
    onConfirm,
}: BonusTypeDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t("admin.bonusTypes.deleteBonusType", "Delete Bonus Type")}
            description={
                <>
                    {t(
                        "admin.bonusTypes.deleteBonusTypeConfirmation",
                        "Are you sure you want to delete this bonus type? This action cannot be undone."
                    )}
                    {bonusType && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>{bonusType.name}</strong>
                            {bonusType.description && ` - ${bonusType.description}`}
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={deleting}
        />
    );
};

export default BonusTypeDeleteModal;
