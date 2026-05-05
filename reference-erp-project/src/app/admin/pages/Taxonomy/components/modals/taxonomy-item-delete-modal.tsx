import { useTranslation } from "@/hooks/useTranslation";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { Item } from "@/types/items/items";

interface TaxonomyItemDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: Item | null;
    onConfirm: () => Promise<void>;
    isDeleting: boolean;
}

const TaxonomyItemDeleteModal = ({
    open,
    onOpenChange,
    item,
    onConfirm,
    isDeleting,
}: TaxonomyItemDeleteModalProps) => {
    const { t } = useTranslation();

    const handleOpenChange = (next: boolean) => {
        onOpenChange(next);
        if (!next) {
            setTimeout(() => {
                document.body.style.removeProperty("pointer-events");
            }, 100);
        }
    };

    return (
        <DeleteModal
            open={open}
            onOpenChange={handleOpenChange}
            title={t("taxonomy.items.deleteItem", "Remove Item")}
            description={t(
                "taxonomy.items.deleteItemDescription",
                "Are you sure you want to remove '{{name}}' from this hierarchy?",
                { name: item?.name }
            )}
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default TaxonomyItemDeleteModal;
