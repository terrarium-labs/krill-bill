import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { StatusTemplate } from "@/types/general/status-templates";

interface StatusTemplateDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    statusTemplate: StatusTemplate | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const StatusTemplateDeleteModal = ({
    open,
    onOpenChange,
    statusTemplate,
    onConfirm,
    isDeleting,
}: StatusTemplateDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t(
                "statusTemplates.deleteTemplate",
                "Delete Status Template"
            )}
            description={
                <>
                    {t(
                        "statusTemplates.deleteConfirmation",
                        "Are you sure you want to delete this status template? This action cannot be undone."
                    )}
                    {statusTemplate && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>{statusTemplate.name}</strong>
                            {statusTemplate.description &&
                                ` - ${statusTemplate.description}`}
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default StatusTemplateDeleteModal;
