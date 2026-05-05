import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { Field } from "./custom-fields-table";

interface CustomFieldDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    field: Field | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const CustomFieldDeleteModal = ({
    open,
    onOpenChange,
    field,
    onConfirm,
    isDeleting,
}: CustomFieldDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t(
                "admin.customFields.field.deleteField",
                "Delete Field"
            )}
            description={
                <>
                    {t(
                        "admin.customFields.field.deleteFieldConfirmation",
                        "Are you sure you want to delete this field? This action cannot be undone and will remove all data associated with this field."
                    )}
                    {field && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>{field.name}</strong>
                            {field.description && ` - ${field.description}`}
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default CustomFieldDeleteModal;
