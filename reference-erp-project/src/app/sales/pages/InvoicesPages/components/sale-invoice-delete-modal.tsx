import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { SaleInvoice } from "@/types/invoices/invoices";

interface SaleInvoiceDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    invoice: SaleInvoice | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const SaleInvoiceDeleteModal = ({
    open,
    onOpenChange,
    invoice,
    onConfirm,
    isDeleting,
}: SaleInvoiceDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t(
                "salesInvoices.deleteInvoiceTitle",
                "Delete Sales Invoice"
            )}
            description={
                <>
                    {t(
                        "salesInvoices.deleteInvoiceDescription",
                        "Are you sure you want to delete this sales invoice? This action cannot be undone."
                    )}
                    {invoice && (
                        <div className="mt-4 p-3 bg-muted rounded-md">
                            <p className="font-semibold">
                                {invoice.invoice_number || invoice.id}
                            </p>
                            {invoice.client?.trade_name && (
                                <p className="text-sm text-muted-foreground">
                                    {invoice.client.trade_name}
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

export default SaleInvoiceDeleteModal;
