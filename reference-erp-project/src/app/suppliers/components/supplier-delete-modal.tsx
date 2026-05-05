import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { Supplier } from "@/types/suppliers/supplier";

interface SupplierDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    supplier: Supplier | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const SupplierDeleteModal = ({
    open,
    onOpenChange,
    supplier,
    onConfirm,
    isDeleting,
}: SupplierDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t("suppliers.deleteSupplier", "Delete Supplier")}
            description={
                <>
                    {t(
                        "suppliers.deleteSupplierConfirmation",
                        "Are you sure you want to delete this supplier? This action cannot be undone."
                    )}
                    {supplier && (
                        <div className="mt-4 p-3 bg-muted rounded-md">
                            <p className="font-semibold">{supplier.trade_name}</p>
                            {supplier.supplier_name && (
                                <p className="text-sm text-muted-foreground">
                                    {supplier.supplier_name}
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

export default SupplierDeleteModal;
