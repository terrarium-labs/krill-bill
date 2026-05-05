import { useTranslation } from "@/hooks/useTranslation";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { FlattenedItemHierarchy } from "../taxonomy-table";
import { ItemHierarchy } from "@/types/general/taxonomy";

interface TaxonomyDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    taxonomy: ItemHierarchy | FlattenedItemHierarchy | null;
    onConfirm: () => Promise<void>;
    isDeleting: boolean;
}

const TaxonomyDeleteModal = ({
    open,
    onOpenChange,
    taxonomy,
    onConfirm,
    isDeleting,
}: TaxonomyDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t("taxonomy.deleteHierarchy", "Delete Item Hierarchy")}
            description={
                <>
                    {t(
                        "taxonomy.deleteConfirmation",
                        "Are you sure you want to delete this item hierarchy? This action cannot be undone."
                    )}
                    {taxonomy && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>{taxonomy.name}</strong>
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default TaxonomyDeleteModal;
