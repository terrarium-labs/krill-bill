import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, CreditCard } from "lucide-react";
import { InvoicePayment, PaymentsMetadata } from "@/types/invoices/invoices";
import { getPurchaseInvoicePayments, deletePurchaseInvoicePayment } from "@/api/purchase-invoices/payments/payments";
import { toast } from "sonner";
import PaymentModal from "./payment-modal";
import { formatDate, formatCurrency } from "@/utils/miscelanea";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import IdBadge from "@/app/components/id-badge";
import { useInvoice } from "../../contexts/InvoiceContext";
import {
    TableProvider,
    TableHeader,
    TableHeaderGroup,
    TableHead,
    TableBody,
    TableCell,
    type ColumnDef,
} from "@/components/ui/shadcn-io/table";
import { TableRow as TableRowRaw, TableCell as TableCellRaw, TableFooter as TableFooterRaw } from "@/components/ui/table";
import DateLabel from "@/app/components/labels/date-label";
import CurrencyLabel from "@/app/components/labels/currency-label";

interface PaymentsSectionProps {
    invoiceId: string;
}

const PaymentsSection: React.FC<PaymentsSectionProps> = ({ invoiceId }) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const { invoice, refreshInvoice } = useInvoice();
    const invoiceCurrency = invoice.currency || undefined;
    const [payments, setPayments] = useState<InvoicePayment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [paymentToDelete, setPaymentToDelete] = useState<InvoicePayment | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editPayment, setEditPayment] = useState<InvoicePayment | null>(null);
    const [metadata, setMetadata] = useState<PaymentsMetadata | null>(null);

    const fetchPayments = useCallback(async (pageToken: string | null = null, append = false) => {
        if (!orgId || !invoiceId) return;

        if (!pageToken) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }

        try {
            const response = await getPurchaseInvoicePayments(orgId, invoiceId, undefined, pageToken || undefined);
            if (response.success && response.success.payments) {
                setPayments(prevPayments =>
                    append ? [...prevPayments, ...response.success.payments] : response.success.payments
                );
                setNextPageToken(response.success.next_page_token || null);
                setMetadata(response.success.metadata || null);
            } else {
                toast.error(t("invoices.errorFetchingPayments", "Error fetching payments"));
            }
        } catch (error) {
            console.error("Error fetching payments:", error);
            toast.error(t("invoices.errorFetchingPayments", "Error fetching payments"));
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [orgId, invoiceId, t]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const handleCreatePayment = () => {
        setEditPayment(null);
        setIsModalOpen(true);
    };

    const handleEditPayment = (payment: InvoicePayment) => {
        setEditPayment(payment);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (payment: InvoicePayment) => {
        setPaymentToDelete(payment);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!orgId || !invoiceId || !paymentToDelete) return;

        setIsDeleting(true);
        try {
            const response = await deletePurchaseInvoicePayment(orgId, invoiceId, paymentToDelete.id);
            if (response.success) {
                toast.success(t("invoices.paymentDeleted", "Payment deleted successfully"));
                fetchPayments(null, false);
                refreshInvoice();
                setIsDeleteDialogOpen(false);
                setPaymentToDelete(null);
            } else {
                toast.error(t("invoices.paymentDeleteFailed", "Failed to delete payment"));
            }
        } catch (error) {
            console.error("Error deleting payment:", error);
            toast.error(t("invoices.paymentDeleteError", "Error deleting payment"));
        } finally {
            setIsDeleting(false);
        }
    };

    const handleModalClose = (open: boolean) => {
        setIsModalOpen(open);
        if (!open) {
            setEditPayment(null);
            fetchPayments(null, false);
            refreshInvoice();
        }
    };

    // Table columns definition
    const columns: ColumnDef<InvoicePayment>[] = [
        {
            accessorKey: "id",
            header: t("common.id", "ID"),
            cell: ({ row }: { row: any }) => {
                const payment = row.original;
                return <IdBadge id={payment.id} hideIcon={true} customTooltip={t("common.copyId", "Copy ID")} />;
            },
            meta: {
                className: 'w-[80px]',
            },
        },
        {
            accessorKey: "payment_date",
            header: t("invoices.paymentDate", "Date"),
            cell: ({ row }: { row: any }) => {
                const payment = row.original;
                return <DateLabel data={payment.payment_date} options={{ hide: "seconds" }} />;
            },
        },
        {
            accessorKey: "amount",
            header: t("invoices.amount", "Amount"),
            cell: ({ row }: { row: any }) => {
                const payment = row.original;
                return <CurrencyLabel data={{ value: payment.amount, currency: invoiceCurrency }} />;
            },
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }: { row: any }) => {
                const payment = row.original;
                return (
                    <div onClick={(e) => e.stopPropagation()}>
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("common.edit", "Edit"),
                                    icon: "pencil",
                                    onClick: () => handleEditPayment(payment),
                                },
                                {
                                    label: t("common.delete", "Delete"),
                                    icon: "trash-2",
                                    onClick: () => handleDeleteClick(payment),
                                    variant: "destructive",
                                },
                            ]}
                        />
                    </div>
                );
            },
            meta: {
                className: 'w-[50px]',
            },
        },
    ];

    return (
        <>
            <div className="flex h-full min-h-0 flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-md font-semibold">{t("invoices.payments", "Payments")}</h3>
                    <Button onClick={handleCreatePayment} size="sm" variant="outline">
                        <Plus className="h-4 w-4" />
                        {t("invoices.add", "New Payment")}
                    </Button>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    <TableProvider data={payments} columns={columns}>
                        <TableHeader>
                            {({ headerGroup }) => (
                                <TableHeaderGroup key={headerGroup.id} headerGroup={headerGroup}>
                                    {({ header }) => <TableHead key={header.id} header={header} />}
                                </TableHeaderGroup>
                            )}
                        </TableHeader>
                        <TableBody
                            isLoading={isLoading}
                            loadingState={
                                <TableRowRaw className="hover:bg-transparent">
                                    <TableCellRaw className="h-48 text-center hover:bg-transparent" colSpan={columns.length}>
                                        <div className="flex items-center justify-center space-y-2 flex-col">
                                            <Loader2 className="h-8 w-8 animate-spin" />
                                        </div>
                                    </TableCellRaw>
                                </TableRowRaw>
                            }
                            emptyState={
                                <TableRowRaw className="hover:bg-transparent">
                                    <TableCellRaw className="h-48 text-center hover:bg-transparent" colSpan={columns.length}>
                                        <div className="flex items-center justify-center space-y-4 flex-col">
                                            <CreditCard className="h-10 w-10 text-muted-foreground" />
                                            <div className="flex flex-col items-center justify-center">
                                                <h3 className="text-lg font-medium">
                                                    {t("invoices.noPayments", "No payments yet")}
                                                </h3>
                                                <p className="text-muted-foreground">
                                                    {t("invoices.noPaymentsDescription", "Add your first payment to get started")}
                                                </p>
                                            </div>
                                            <Button variant="outline" onClick={handleCreatePayment}>
                                                <Plus className="h-4 w-4" />
                                                {t("invoices.addPayment", "Add Payment")}
                                            </Button>
                                        </div>
                                    </TableCellRaw>
                                </TableRowRaw>
                            }
                        >
                            {({ row }) => (
                                <TableRowRaw
                                    key={row.id}
                                    className="hover:bg-muted/50 cursor-pointer"
                                    onClick={() => handleEditPayment(row.original as InvoicePayment)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            cell={cell}
                                        />
                                    ))}
                                </TableRowRaw>
                            )}
                        </TableBody>
                        {metadata && payments.length > 0 && !isLoading && (
                            <TableFooterRaw>
                                <TableRowRaw className="bg-muted/50 font-medium hover:bg-muted/50">
                                    <TableCellRaw colSpan={2} className="text-left text-sm font-semibold">
                                        {t("common.totals", "Totals")}
                                    </TableCellRaw>
                                    <TableCellRaw className="text-sm font-semibold">
                                        <CurrencyLabel data={{ value: metadata.total_amount, currency: invoiceCurrency }} />
                                    </TableCellRaw>
                                    <TableCellRaw />
                                </TableRowRaw>
                            </TableFooterRaw>
                        )}
                    </TableProvider>

                    {/* Load More Button */}
                    {nextPageToken && (
                        <div className="text-center pt-4">
                            <Button
                                variant="outline"
                                onClick={() => fetchPayments(nextPageToken, true)}
                                disabled={isLoadingMore}
                            >
                                {isLoadingMore ? t('common.loading', 'Loading...') : t('common.loadMore', 'Load More')}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            <PaymentModal
                open={isModalOpen}
                onOpenChange={handleModalClose}
                invoiceId={invoiceId}
                payment={editPayment}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle>{t("invoices.deletePayment", "Delete Payment")}</DialogTitle>
                        <DialogDescription>
                            {t(
                                "invoices.deletePaymentConfirmation",
                                "Are you sure you want to delete this payment? This action cannot be undone."
                            )}
                            {paymentToDelete && (
                                <div className="mt-2 p-2 bg-muted rounded">
                                    <strong>{formatCurrency(paymentToDelete.amount, invoiceCurrency)}</strong>
                                    {" - "}
                                    {formatDate(new Date(paymentToDelete.payment_date), {
                                        showTime: false,
                                        showYear: true,
                                        useUTC: false,
                                    })}
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            disabled={isDeleting}
                        >
                            {t("common.cancel", "Cancel")}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {t("common.deleting", "Deleting...")}
                                </>
                            ) : (
                                t("common.delete", "Delete")
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default PaymentsSection;
