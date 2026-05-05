import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import PageHeader from "@/app/components/page-header";
import { useInvoice } from "../contexts/InvoiceContext";
import { Button } from "@/components/ui/button";
import { Check, Copy, Save, ChevronLeft } from "lucide-react";
import IdBadge from "@/app/components/id-badge";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/shadcn-io/tabs";
import FilesSection from "@/app/components/files/files-section";
import InfoInvoiceSection from "./components/info-invoice-section";
import OverviewInvoiceSection from "./components/overview-invoice-section";
import InvoiceItemsSection from "./components/invoice-items-section";
import PaymentsSection from "./components/payments-section";
import { deletePurchaseInvoice, approvePurchaseInvoice } from "@/api/purchase-invoices/purchase-invoices";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { ConfirmationDialog } from "../components/confirmation-dialog";
import PurchaseInvoiceDeleteModal from "../components/purchase-invoice-delete-modal";
import ThreadSection from "@/app/components/thread-section";
import Tag from "@/app/components/tag/tag";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import FileUploadDropzone from "./components/file-upload-dropzone";
import EventsTimeline from "@/app/components/events-timeline";
import CurrencyModal from "./components/currency-modal";

const InvoiceDetailPage = () => {
    const { t } = useTranslation();
    const { invoice, saveInvoice, refreshInvoice } = useInvoice();
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);
    const [isApprovingInvoice, setIsApprovingInvoice] = useState(false);
    const [isDeletingInvoice, setIsDeletingInvoice] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showCurrencyModal, setShowCurrencyModal] = useState(false);
    const [invoicePanelOpen, setInvoicePanelOpen] = useState(false);

    // Invoices are always editable, regardless of status
    const isDraft = invoice.status === "draft";

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const result = await saveInvoice();

            if (result.success) {
                toast.success(t('invoices.invoiceUpdated', 'Invoice updated successfully'));
            } else {
                toast.error(result.error || t('invoices.invoiceUpdateFailed', 'Failed to update invoice'));
            }
        } catch (error) {
            console.error("Error saving invoice:", error);
            toast.error(t('invoices.invoiceUpdateError', 'Error updating invoice'));
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        // Enable save shortcut regardless of invoice status
        const down = (e: KeyboardEvent) => {
            if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                // Do not open if the user is typing in an input
                const target = e.target as HTMLElement
                if (
                    target.isContentEditable ||
                    target instanceof HTMLInputElement ||
                    target instanceof HTMLTextAreaElement ||
                    target instanceof HTMLSelectElement
                ) {
                    return
                }

                e.preventDefault()
                handleSave();
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [handleSave])

    const handleApproveInvoice = async () => {
        if (!orgId) return;

        setIsApprovingInvoice(true);
        try {
            const response = await approvePurchaseInvoice(orgId, invoice.id);

            if (response.success) {
                toast.success(t('invoices.invoiceApproved', 'Invoice approved successfully'));
                refreshInvoice();
                setShowApproveDialog(false);
            } else {
                toast.error(t('invoices.invoiceApproveFailed', 'Failed to approve invoice'));
            }
        } catch (error) {
            console.error("Error approving invoice:", error);
            toast.error(t('invoices.invoiceApproveError', 'Error approving invoice'));
        } finally {
            setIsApprovingInvoice(false);
        }
    };

    const handleDeleteInvoice = async () => {
        if (!orgId) return;

        setIsDeletingInvoice(true);
        try {
            const response = await deletePurchaseInvoice(orgId, invoice.id);

            if (response.success) {
                toast.success(t('invoices.invoiceDeleted', 'Invoice deleted successfully'));
                setShowDeleteDialog(false);
                navigate(`/${orgId}/purchases/invoices`);
            } else {
                toast.error(t('invoices.invoiceDeleteFailed', 'Failed to delete invoice'));
            }
        } catch (error) {
            console.error("Error deleting invoice:", error);
            toast.error(t('invoices.invoiceDeleteError', 'Error deleting invoice'));
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
                                        {invoice.invoice_number ? invoice.invoice_number : t('invoices.noNumber', '(Draft Invoice)')}
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
                                        <Button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                        >
                                            <Save className="h-4 w-4 mr-2" />
                                            {isSaving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                                        </Button>
                                        <CustomActionsDropdown
                                            items={[
                                                {
                                                    label: t('invoices.currency', 'Currency'),
                                                    icon: 'coins',
                                                    onClick: () => setShowCurrencyModal(true),
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
                            <OverviewInvoiceSection />
                            {/* Invoice Info Section */}
                            <InfoInvoiceSection />
                            {/* Invoice Items Section */}
                            <InvoiceItemsSection />
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
                            defaultValue="invoice"
                            className="flex min-h-0 flex-1 flex-col gap-0"
                        >
                            <TabsList
                                className="-translate-y-px h-auto w-full shrink-0 flex-wrap justify-start gap-1 -border-b-2 border-border bg-background py-1"
                                activeClassName="border-b-2 border-primary -mb-[4px]"
                            >
                                <TabsTrigger className="py-1.5" value="invoice">
                                    {t("admin.absences.tabs.policies", "Invoice")}
                                </TabsTrigger>
                                <TabsTrigger className="py-1.5" value="payments">
                                    {t("invoices.payments", "Payments")}
                                </TabsTrigger>
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
                                    value="invoice"
                                    transition={{ duration: 0 }}
                                    className="mt-0 flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto overflow-x-hidden"
                                >
                                    <FileUploadDropzone disabled={false} />
                                </TabsContent>
                                <TabsContent
                                    value="payments"
                                    transition={{ duration: 0 }}
                                    className="mt-0 flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto overflow-x-hidden"
                                >
                                    <PaymentsSection invoiceId={invoice.id} />
                                </TabsContent>
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
                title={t('invoices.approveInvoiceTitle', 'Approve Invoice')}
                description={t('invoices.approveInvoiceDescription', 'Are you sure you want to approve this invoice?')}
                confirmText={t('common.approve', 'Approve')}
                cancelText={t('common.cancel', 'Cancel')}
                onConfirm={handleApproveInvoice}
                isLoading={isApprovingInvoice}
            />

            <PurchaseInvoiceDeleteModal
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                invoice={invoice}
                onConfirm={handleDeleteInvoice}
                isDeleting={isDeletingInvoice}
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

export default InvoiceDetailPage;
