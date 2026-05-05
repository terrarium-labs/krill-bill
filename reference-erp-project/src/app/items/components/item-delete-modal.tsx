import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { Item } from "@/types/items/items";

interface ItemDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: Item | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const ItemDeleteModal = ({
    isOpen,
    onClose,
    item,
    onConfirm,
    isDeleting,
}: ItemDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            title={t("items.deleteItem", "Delete Item")}
            description={
                <>
                    {t(
                        "items.deleteItemConfirmation",
                        "Are you sure you want to delete this item? This action cannot be undone."
                    )}
                    {item && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>{item.name}</strong>
                            {item.item_code && ` (${item.item_code})`}
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default ItemDeleteModal;
