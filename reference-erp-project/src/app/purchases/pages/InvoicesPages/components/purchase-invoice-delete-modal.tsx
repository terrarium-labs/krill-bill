import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { PurchaseInvoice } from "@/types/invoices/invoices";

interface PurchaseInvoiceDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    invoice: PurchaseInvoice | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const PurchaseInvoiceDeleteModal = ({
    open,
    onOpenChange,
    invoice,
    onConfirm,
    isDeleting,
}: PurchaseInvoiceDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t(
                "invoices.deleteInvoiceTitle",
                "Delete Invoice"
            )}
            description={
                <>
                    {t(
                        "invoices.deleteInvoiceDescription",
                        "Are you sure you want to delete this invoice? This action cannot be undone."
                    )}
                    {invoice && (
                        <div className="mt-4 p-3 bg-muted rounded-md">
                            <p className="font-semibold">
                                {invoice.invoice_number || invoice.id}
                            </p>
                            {invoice.supplier?.trade_name && (
                                <p className="text-sm text-muted-foreground">
                                    {invoice.supplier.trade_name}
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

export default PurchaseInvoiceDeleteModal;
