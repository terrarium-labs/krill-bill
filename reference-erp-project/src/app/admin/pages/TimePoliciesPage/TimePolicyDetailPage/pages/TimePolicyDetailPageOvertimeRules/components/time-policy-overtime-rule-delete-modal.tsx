import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { OvertimeRule } from "@/types/general/time-policies";

interface TimePolicyOvertimeRuleDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    overtimeRule: OvertimeRule | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const TimePolicyOvertimeRuleDeleteModal: React.FC<TimePolicyOvertimeRuleDeleteModalProps> = ({
    open,
    onOpenChange,
    overtimeRule,
    onConfirm,
    isDeleting,
}) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t(
                "timePolicies.overtimeRules.delete",
                "Delete Overtime Rule"
            )}
            description={
                <>
                    {t(
                        "timePolicies.overtimeRules.deleteConfirmation",
                        "Are you sure you want to delete this overtime rule? This action cannot be undone."
                    )}
                    {overtimeRule && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>{overtimeRule.name}</strong>
                            {overtimeRule.description &&
                                ` - ${overtimeRule.description}`}
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default TimePolicyOvertimeRuleDeleteModal;
