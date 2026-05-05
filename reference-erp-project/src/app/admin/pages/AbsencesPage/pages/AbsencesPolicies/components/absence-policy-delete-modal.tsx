import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";

interface AbsencePolicy {
    id: string;
    name: string;
    description?: string;
    number_of_counters: number;
    created_at: string;
}

interface AbsencePolicyDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    policy: AbsencePolicy | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const AbsencePolicyDeleteModal = ({
    open,
    onOpenChange,
    policy,
    onConfirm,
    isDeleting,
}: AbsencePolicyDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t("absence-policies.policies.deletePolicy", "Delete Absence Policy")}
            description={
                <>
                    {t(
                        "absence-policies.policies.deletePolicyConfirmation",
                        "Are you sure you want to delete this absence policy? This action cannot be undone."
                    )}
                    {policy && (
                        <div className="mt-4 p-3 bg-muted rounded-md">
                            <p className="font-semibold">{policy.name}</p>
                            {policy.description && (
                                <p className="text-sm text-muted-foreground">
                                    {policy.description}
                                </p>
                            )}
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default AbsencePolicyDeleteModal;
