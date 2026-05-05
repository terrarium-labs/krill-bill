import { useTranslation } from "@/hooks/useTranslation";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { Inventory } from "@/types/clients/inventory";

interface ClientLocationInventoryDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    inventory: Inventory | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const ClientLocationInventoryDeleteModal = ({
    open,
    onOpenChange,
    inventory,
    onConfirm,
    isDeleting,
}: ClientLocationInventoryDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t("inventory.deleteItem", "Delete Item")}
            description={
                <>
                    {t(
                        "inventory.deleteConfirmation",
                        "Are you sure you want to delete this inventory item? This action cannot be undone."
                    )}
                    {inventory && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>
                                {inventory.item?.name || inventory.name}
                            </strong>
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default ClientLocationInventoryDeleteModal;
