import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { BonusTypeEmployee } from "@/types/employees/bonus-types";

type EmployeeBonusTypeDeleteModalProps = {
    open: boolean;
    bonusTypeEmployee: BonusTypeEmployee | null;
    deleting: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
};

const EmployeeBonusTypeDeleteModal = ({
    open,
    bonusTypeEmployee,
    deleting,
    onOpenChange,
    onConfirm,
}: EmployeeBonusTypeDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t("employees.bonusTypes.deleteBonusType", "Remove Bonus Type")}
            description={
                <>
                    {t(
                        "employees.bonusTypes.deleteBonusTypeConfirmation",
                        "Are you sure you want to remove this bonus type assignment? This action cannot be undone."
                    )}
                    {bonusTypeEmployee && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>{bonusTypeEmployee.org_bonus_type?.name}</strong>
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={deleting}
        />
    );
};

export default EmployeeBonusTypeDeleteModal;
