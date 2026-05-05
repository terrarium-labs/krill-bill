import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { StockLocation } from "@/types/items/stock";

interface WarehouseDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    location: StockLocation | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const WarehouseDeleteModal = ({
    open,
    onOpenChange,
    location,
    onConfirm,
    isDeleting,
}: WarehouseDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t("warehouses.deleteWarehouse", "Delete Warehouse")}
            description={
                <>
                    {t(
                        "warehouses.deleteWarehouseConfirmation",
                        "Are you sure you want to delete this warehouse? This action cannot be undone."
                    )}
                    {location && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>{location.name}</strong>
                            {location.address_line_1 &&
                                ` - ${location.address_line_1}`}
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default WarehouseDeleteModal;
