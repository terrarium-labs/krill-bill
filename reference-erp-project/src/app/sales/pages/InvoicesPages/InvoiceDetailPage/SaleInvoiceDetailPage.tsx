import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import PageHeader from "@/app/components/page-header";
import { useSaleInvoice } from "../contexts/SaleInvoiceContext";
import { Button } from "@/components/ui/button";
import { Check, Copy, Save, ChevronLeft } from "lucide-react";
import IdBadge from "@/app/components/id-badge";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/shadcn-io/tabs";
import FilesSection from "@/app/components/files/files-section";
import InfoSaleInvoiceSection from "./components/info-sale-invoice-section";
import OverviewSaleInvoiceSection from "./components/overview-sale-invoice-section";
import SaleInvoiceItemsSection from "./components/sale-invoice-items-section";
import { deleteSalesInvoice, approveSalesInvoice, patchSalesInvoice } from "@/api/sales-invoices/sales-invoices";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { ConfirmationDialog } from "../components/confirmation-dialog";
import SaleInvoiceDeleteModal from "../components/sale-invoice-delete-modal";
import { ChangeNumberSeriesModal } from "../components/change-number-series-modal";
import CurrencyModal from "./components/currency-modal";
import ThreadSection from "@/app/components/thread-section";
import Tag from "@/app/components/tag/tag";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import EventsTimeline from "@/app/components/events-timeline";
import PaymentsSection from "./components/payments-section";
import InvoicePdfViewer from "./components/invoice-pdf-viewer";
import AdditionalFieldsSection from "./components/additional-fields-section";
import PaymentGuidesSection from "./components/payment-guides-section";

const SaleInvoiceDetailPage = () => {
    const { t } = useTranslation();
    const { invoice, saveInvoice, refreshInvoice, isReadOnly } = useSaleInvoice();
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);
    const [isApprovingInvoice, setIsApprovingInvoice] = useState(false);
    const [isDeletingInvoice, setIsDeletingInvoice] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showChangeNumberSeriesModal, setShowChangeNumberSeriesModal] = useState(false);
    const [isChangingNumberSeries, setIsChangingNumberSeries] = useState(false);
    const [showCurrencyModal, setShowCurrencyModal] = useState(false);
    const [invoicePanelOpen, setInvoicePanelOpen] = useState(false);

    // Invoice number is generated with a document series when approved
    const isDraft = invoice.status === "draft";

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const result = await saveInvoice();

            if (result.success) {
                toast.success(t('salesInvoices.invoiceUpdated', 'Sales invoice updated successfully'));
            } else {
                toast.error(result.error || t('salesInvoices.invoiceUpdateFailed', 'Failed to update sales invoice'));
            }
        } catch (error) {
            console.error("Error saving sales invoice:", error);
            toast.error(t('salesInvoices.invoiceUpdateError', 'Error updating sales invoice'));
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        if (isReadOnly) return;

        const down = (e: KeyboardEvent) => {
            if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                const target = e.target as HTMLElement;
                if (
                    target.isContentEditable ||
                    target instanceof HTMLInputElement ||
                    target instanceof HTMLTextAreaElement ||
                    target instanceof HTMLSelectElement
                ) {
                    return;
                }
                e.preventDefault();
                handleSave();
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [handleSave, isReadOnly]);

    const handleChangeNumberSeries = async (serialNumberId: string) => {
        if (!orgId) return;

        setIsChangingNumberSeries(true);
        try {
            const response = await patchSalesInvoice(orgId, invoice.id, {
                serial_number_type_id: serialNumberId,
            });

            if (response.success) {
                toast.success(t('salesInvoices.numberSeriesChanged', 'Document series changed successfully'));
                refreshInvoice();
                setShowChangeNumberSeriesModal(false);
            } else {
                toast.error(t('salesInvoices.numberSeriesChangeFailed', 'Failed to change document series'));
            }
        } catch (error) {
            console.error("Error changing document series:", error);
            toast.error(t('salesInvoices.numberSeriesChangeError', 'Error changing document series'));
        } finally {
            setIsChangingNumberSeries(false);
        }
    };

    const handleApproveInvoice = async () => {
        if (!orgId) return;

        setIsApprovingInvoice(true);
        try {
            const response = await approveSalesInvoice(orgId, invoice.id);

            if (response.success) {
                toast.success(t('salesInvoices.invoiceApproved', 'Sales invoice approved successfully'));
                refreshInvoice();
                setShowApproveDialog(false);
            } else {
                toast.error(t('salesInvoices.invoiceApproveFailed', 'Failed to approve sales invoice'));
            }
        } catch (error) {
            console.error("Error approving sales invoice:", error);
            toast.error(t('salesInvoices.invoiceApproveError', 'Error approving sales invoice'));
        } finally {
            setIsApprovingInvoice(false);
        }
    };

    const handleDeleteInvoice = async () => {
        if (!orgId) return;

        setIsDeletingInvoice(true);
        try {
            const response = await deleteSalesInvoice(orgId, invoice.id);

            if (response.success) {
                toast.success(t('salesInvoices.invoiceDeleted', 'Sales invoice deleted successfully'));
                setShowDeleteDialog(false);
                navigate(`/${orgId}/sales/invoices`);
            } else {
                toast.error(t('salesInvoices.invoiceDeleteFailed', 'Failed to delete sales invoice'));
            }
        } catch (error) {
            console.error("Error deleting sales invoice:", error);
            toast.error(t('salesInvoices.invoiceDeleteError', 'Error deleting sales invoice'));
        } finally {
            setIsDeletingInvoice(false);
        }
    };

    const handleCopyInvoiceNumber = async () => {
        if (!invoice.invoice_number) return;

        try {
            await navigator.clipboard.writeText(invoice.invoice_number);
            setIsCopied(true);
            toast.success(t('common.copiedToClipboard', 'Copied to clipboard'));
            setTimeout(() => setIsCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy:", error);
            toast.error(t('common.copyFailed', 'Failed to copy'));
        }
    };

    return (
        <>
            <div className="flex max-h-[calc(100vh-6rem)] min-h-[calc(100vh-6rem)] flex-row items-stretch overflow-hidden">
                <ScrollArea className="h-full min-h-0 min-w-0 flex-1 pr-3">
                    <div className="flex flex-col gap-4 min-w-0 pr-1">
                            <PageHeader
                                origins={invoice.origins}
                                title={
                                    <div className="flex items-center gap-2 cursor-pointer hover:underline rounded-md" onClick={handleCopyInvoiceNumber}>
                                        {invoice.invoice_number ? invoice.invoice_number : t('salesInvoices.noNumber', '(Draft Sales Invoice)')}
                                        {invoice.invoice_number && (isCopied ? <Check className={`h-4 w-4 text-green-500`} /> : <Copy className={`h-4 w-4`} />)}
                                    </div>
                                }
                                showBackButton={true}
                                action={
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Tag text={invoice.status} className="capitalize" />
                                        <IdBadge id={invoice.id} />
                                        {isDraft && (
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowApproveDialog(true)}
                                            >
                                                <Check className="h-4 w-4 mr-2" />
                                                {t('common.approveInvoice', 'Approve Invoice')}
                                            </Button>
                                        )}
                                        {!isReadOnly && (
                                            <Button
                                                onClick={handleSave}
                                                disabled={isSaving}
                                            >
                                                <Save className="h-4 w-4 mr-2" />
                                                {isSaving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                                            </Button>
                                        )}
                                        <CustomActionsDropdown
                                            items={[
                                                {
                                                    label: t('invoices.currency', 'Currency'),
                                                    icon: 'coins',
                                                    onClick: () => setShowCurrencyModal(true),
                                                },
                                                {
                                                    label: t('common.actions.changeNumberSeries', 'Change Document Series'),
                                                    icon: 'file-digit',
                                                    onClick: () => setShowChangeNumberSeriesModal(true),
                                                    showOption: isDraft,
                                                },
                                                {
                                                    label: t('common.delete', 'Delete'),
                                                    icon: 'trash-2',
                                                    onClick: () => setShowDeleteDialog(true),
                                                    variant: 'destructive',
                                                }
                                            ]}
                                        />
                                    </div>
                                }
                            />
                            {/* Overview Card */}
                            <OverviewSaleInvoiceSection />
                            {/* Invoice Info Section */}
                            <InfoSaleInvoiceSection />
                            {/* Invoice Items Section */}
                            <SaleInvoiceItemsSection />
                            {/* Additional Fields Section */}
                            <AdditionalFieldsSection />
                            {/* Payment Guides Section */}
                            <PaymentGuidesSection />
                    </div>
                </ScrollArea>
                <button
                    type="button"
                    aria-label={t(
                        "invoices.openSidePanel",
                        "Open document, payments and activity",
                    )}
                    title={t(
                        "invoices.openSidePanel",
                        "Open document, payments and activity",
                    )}
                    onClick={() => setInvoicePanelOpen(true)}
                    className="flex w-7 shrink-0 flex-col items-center justify-center self-stretch border-l border-border bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                    <ChevronLeft className="h-5 w-5 shrink-0" aria-hidden />
                </button>
            </div>

            <Sheet open={invoicePanelOpen} onOpenChange={setInvoicePanelOpen}>
                <SheetContent
                    side="right"
                    className="flex h-full min-h-0 w-full max-w-none flex-col gap-0 overflow-hidden rounded-l-xl border-l p-0 sm:max-w-xl md:max-w-2xl lg:max-w-3xl"
                >
                    <SheetTitle className="sr-only">
                        {t(
                            "invoices.sidePanelTitle",
                            "Document, payments & activity",
                        )}
                    </SheetTitle>
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-6 pt-4 pr-12">
                        <Tabs
                            defaultValue={isDraft ? "document" : "payments"}
                            className="flex min-h-0 flex-1 flex-col gap-0"
                        >
                            <TabsList
                                className="-translate-y-px h-auto w-full shrink-0 flex-wrap justify-start gap-1 border-b-2 border-border bg-background py-1"
                                activeClassName="border-b-2 border-primary -mb-[2px]"
                            >
                                <TabsTrigger className="py-1.5" value="document">
                                    {t("invoices.document", "Document")}
                                </TabsTrigger>
                                {!isDraft && (
                                    <TabsTrigger className="py-1.5" value="payments">
                                        {t("invoices.payments", "Payments")}
                                    </TabsTrigger>
                                )}
                                <TabsTrigger className="py-1.5" value="messages">
                                    {t("admin.absences.tabs.types", "Messages")}
                                </TabsTrigger>
                                <TabsTrigger className="py-1.5" value="history">
                                    {t("admin.absences.tabs.types", "History")}
                                </TabsTrigger>
                                <TabsTrigger className="py-1.5" value="files">
                                    {t("admin.absences.tabs.types", "Files")}
                                </TabsTrigger>
                            </TabsList>
                            <TabsContents
                                transition={{ duration: 0 }}
                                className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden"
                            >
                                <TabsContent
                                    value="document"
                                    transition={{ duration: 0 }}
                                    className="mt-0 flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto overflow-x-hidden"
                                >
                                    <InvoicePdfViewer />
                                </TabsContent>
                                {!isDraft && (
                                    <TabsContent
                                        value="payments"
                                        transition={{ duration: 0 }}
                                        className="mt-0 flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto overflow-x-hidden"
                                    >
                                        <PaymentsSection invoiceId={invoice.id} />
                                    </TabsContent>
                                )}
                                <TabsContent
                                    value="messages"
                                    transition={{ duration: 0 }}
                                    className="mt-0 flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto overflow-x-hidden"
                                >
                                    <ThreadSection entityId={invoice.id} />
                                </TabsContent>
                                <TabsContent
                                    value="history"
                                    transition={{ duration: 0 }}
                                    className="mt-0 flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto overflow-x-hidden"
                                >
                                    <EventsTimeline
                                        entityId={invoice.id}
                                        showSearchbar="sticky"
                                        showTitle={false}
                                    />
                                </TabsContent>
                                <TabsContent
                                    value="files"
                                    transition={{ duration: 0 }}
                                    className="mt-0 flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto overflow-x-hidden"
                                >
                                    <FilesSection
                                        entity_id={invoice.id}
                                        showBreadcrumbs={false}
                                        showCreateFolder={false}
                                    />
                                </TabsContent>
                            </TabsContents>
                        </Tabs>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Confirmation Dialogs */}
            <ConfirmationDialog
                open={showApproveDialog}
                onOpenChange={setShowApproveDialog}
                title={t('salesInvoices.approveInvoiceTitle', 'Approve Sales Invoice')}
                description={t('salesInvoices.approveInvoiceDescription', 'Are you sure you want to approve this sales invoice? The invoice number will be generated from the selected document series.')}
                confirmText={t('common.approve', 'Approve')}
                cancelText={t('common.cancel', 'Cancel')}
                onConfirm={handleApproveInvoice}
                isLoading={isApprovingInvoice}
            />

            <SaleInvoiceDeleteModal
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                invoice={invoice}
                onConfirm={handleDeleteInvoice}
                isDeleting={isDeletingInvoice}
            />

            <ChangeNumberSeriesModal
                open={showChangeNumberSeriesModal}
                onOpenChange={setShowChangeNumberSeriesModal}
                onConfirm={handleChangeNumberSeries}
                currentSerialNumberId={invoice.serial_number_type?.id || null}
                orgId={orgId || ""}
                isLoading={isChangingNumberSeries}
            />

            <CurrencyModal
                open={showCurrencyModal}
                onOpenChange={setShowCurrencyModal}
                invoiceId={invoice.id}
                currentCurrency={invoice.currency}
                currentExchangeRate={invoice.exchange_rate}
                onSuccess={refreshInvoice}
            />
        </>
    );
};

export default SaleInvoiceDetailPage;
