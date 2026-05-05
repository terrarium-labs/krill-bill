import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";

interface Section {
    id: string;
    title: string;
    description?: string;
}

interface SectionDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    section: Section | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const SectionDeleteModal = ({
    open,
    onOpenChange,
    section,
    onConfirm,
    isDeleting,
}: SectionDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t(
                "admin.customFields.section.deleteSection",
                "Delete Section"
            )}
            description={
                <>
                    {t(
                        "admin.customFields.section.deleteSectionConfirmation",
                        "Are you sure you want to delete this section? This action cannot be undone and will remove all fields and data associated with this section."
                    )}
                    {section && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>{section.title}</strong>
                            {section.description &&
                                ` - ${section.description}`}
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default SectionDeleteModal;
