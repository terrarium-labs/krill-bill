import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { TimePolicy } from "@/types/general/time-policies";

interface TimePolicyDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    policy: TimePolicy | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const TimePolicyDeleteModal: React.FC<TimePolicyDeleteModalProps> = ({
    open,
    onOpenChange,
    policy,
    onConfirm,
    isDeleting,
}) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t("timePolicies.deletePolicy", "Delete Time Policy")}
            description={
                <>
                    {t(
                        "timePolicies.deletePolicyConfirmation",
                        "Are you sure you want to delete this time policy? This action cannot be undone."
                    )}
                    {policy && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>{policy.name}</strong>
                            {policy.description &&
                                ` - ${policy.description}`}
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default TimePolicyDeleteModal;
