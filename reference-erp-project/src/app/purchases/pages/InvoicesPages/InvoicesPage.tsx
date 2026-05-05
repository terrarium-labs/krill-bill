import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import PageHeader from "@/app/components/page-header";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { PurchaseInvoice, InvoicesMetadata } from "@/types/invoices/invoices";
import SearchBar from "@/app/components/search-bar";
import { deletePurchaseInvoice, getPurchaseInvoices, postPurchaseInvoice } from "@/api/purchase-invoices/purchase-invoices";
import { toast } from "sonner";
import PurchaseInvoiceDeleteModal from "./components/purchase-invoice-delete-modal";
import TableFiltersRow from "@/app/components/table-filters/table-filters";
import PurchaseInvoicesTable from "./components/purchase-invoices-table";
import { useTableFilters } from "@/hooks/use-table-filters";
import { usePurchaseInvoicesTablePreferences } from "@/hooks/use-purchase-invoices-table-preferences";
import { PurchaseInvoiceColumnSelector } from "./components/purchase-invoice-column-selector";

const InvoicesPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState<PurchaseInvoice | null>(null);
    const [deletingInvoice, setDeletingInvoice] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [metadata, setMetadata] = useState<InvoicesMetadata | null>(null);

    // Use the table filters hook with session storage (no default filters)
    const { tableFilters, setTableFilters } = useTableFilters();

    // Column preferences persisted in localStorage
    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = usePurchaseInvoicesTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) =>
            setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback(
        (order: string[]) => setColumnOrder(order),
        [setColumnOrder],
    );

    // Fetch invoices function
    const fetchInvoices = async (query: string = "") => {
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        if (!orgId) return;

        try {
            const response = await getPurchaseInvoices(orgId, query, undefined, tableFilters || undefined);
            if (response.success && response.success.invoices) {
                setInvoices(response.success.invoices);
                setNextPageToken(response.success.next_page_token || null);
                setMetadata(response.success.metadata || null);
                if (!tableFilters) {
                    setTableFilters(response.success.params);
                }
            } else {
                toast.error(t("invoices.errorFetchingInvoices") || "Error fetching invoices");
            }
        } catch (error) {
            toast.error(t("invoices.errorFetchingInvoices") || "Error fetching invoices");
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchInvoices();
    }, []);

    // Load more invoices
    const loadMoreInvoices = async () => {
        if (!orgId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getPurchaseInvoices(orgId, searchQuery || undefined, nextPageToken, tableFilters || undefined);
            if (response.success && response.success.invoices) {
                setInvoices(prev => [...prev, ...response.success.invoices]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("invoices.errorFetchingInvoices") || "Error fetching invoices");
            }
        } catch (error) {
            toast.error(t("invoices.errorFetchingInvoices") || "Error fetching invoices");
        } finally {
            setLoadingMore(false);
            setIsLoading(false);
        }
    };

    // Handle create invoice
    const handleCreateInvoice = async () => {
        if (!orgId) return;
        try {
            const response = await postPurchaseInvoice(orgId, {});
            if (response.success) {
                toast.success(t("invoices.invoiceCreated", "Invoice created successfully"));
                navigate(`/${orgId}/purchases/invoices/${response.success.invoice_id}`);
                fetchInvoices();
            } else {
                toast.error(t("invoices.errorCreatingInvoice", "Error creating invoice"));
            }
        } catch (error) {
            toast.error(t("invoices.errorCreatingInvoice", "Error creating invoice"));
        }
    };

    // Handle delete confirmation
    const handleDeleteConfirm = (invoice: PurchaseInvoice) => {
        setInvoiceToDelete(invoice);
        setDeleteModalOpen(true);
    };

    // Handle delete execution
    const handleDeleteInvoice = async () => {
        if (!invoiceToDelete || !orgId) return;

        setDeletingInvoice(true);
        try {
            const response = await deletePurchaseInvoice(orgId, invoiceToDelete.id);
            if (response.success) {
                toast.success(t("invoices.invoiceDeleted", "Invoice deleted successfully"));
                fetchInvoices();
            } else {
                toast.error(t("invoices.errorDeletingInvoice", "Error deleting invoice"));
            }
            setDeleteModalOpen(false);
            setInvoiceToDelete(null);
        } catch (error) {
            toast.error(t("invoices.errorDeletingInvoice", "Error deleting invoice"));
        } finally {
            setDeletingInvoice(false);
        }
    };

    // Handle edit invoice
    const handleEditInvoice = (invoice: PurchaseInvoice) => {
        navigate(`/${orgId}/purchases/invoices/${invoice.id}`);
    };

    // Navigate to invoice detail
    const handleViewInvoice = (invoiceId: string) => {
        navigate(`/${orgId}/purchases/invoices/${invoiceId}`);
    };

    // Render actions for table
    const renderTableActions = (invoice: PurchaseInvoice) => {
        const isDraft = invoice.status === "draft";

        return (
            <div className="flex justify-center items-center">
                <CustomActionsDropdown
                    items={[
                        {
                            label: t("common.edit", "Edit"),
                            icon: "edit",
                            onClick: () => handleEditInvoice(invoice),
                        },
                        {
                            label: t("common.delete", "Delete"),
                            icon: "trash-2",
                            onClick: () => handleDeleteConfirm(invoice),
                            variant: "destructive",
                            showOption: isDraft,
                        },
                    ]}
                />
            </div>
        );
    };

    return (
        <>
            {/* Header */}
            <PageHeader
                title={t("invoices.purchaseInvoices", "Purchase Invoices")}
                description={t("invoices.purchaseInvoicesDescription", "Manage your organization's purchase invoices")}
                showBackButton={false}
                action={
                    <div className="flex items-center gap-2">
                        <Button onClick={handleCreateInvoice}>
                            <Plus className="h-4 w-4" />
                            {t("invoices.addInvoice", "Add Invoice")}
                        </Button>
                    </div>
                }
            />

            <SearchBar
                value={searchQuery}
                isLoading={isSearching}
                onChange={(query) => setSearchQuery(query)}
                onSearch={fetchInvoices}
                placeholder={t("invoices.searchPlaceholder", "Search invoices...")}
            />

            {tableFilters && (
                <TableFiltersRow
                    value={tableFilters}
                    onChange={(filters) => setTableFilters(filters)}
                    onFilter={(_) => fetchInvoices(searchQuery)}
                    endSlot={
                        <PurchaseInvoiceColumnSelector
                            columnVisibility={columnVisibility}
                            columnOrder={columnOrder}
                            onColumnVisibilityChange={handleColumnVisibilityChange}
                            onColumnOrderChange={handleColumnOrderChange}
                            onReset={resetPreferences}
                        />
                    }
                />
            )}

            {/* Invoices Table */}
            <PurchaseInvoicesTable
                invoices={invoices}
                isLoading={isLoading}
                renderActions={renderTableActions}
                onRowClick={(invoice) => handleViewInvoice(invoice.id)}
                clickableRows={true}
                onEmptyStateAction={handleCreateInvoice}
                searchQuery={searchQuery}
                metadata={metadata}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                columnOrder={columnOrder}
                onColumnOrderChange={setColumnOrder}
                columnSizing={columnSizing}
                onColumnSizingChange={setColumnSizing}
            />

            {/* Load More Button */}
            {
                nextPageToken && (
                    <div className="flex justify-center mt-6">
                        <Button
                            variant="outline"
                            onClick={loadMoreInvoices}
                            disabled={loadingMore}
                            className="min-w-32"
                        >
                            {loadingMore ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t("common.loading", "Loading...")}
                                </>
                            ) : (
                                t("common.loadMore", "Load More")
                            )}
                        </Button>
                    </div>
                )
            }

            {/* Delete Confirmation Modal */}
            <PurchaseInvoiceDeleteModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                invoice={invoiceToDelete}
                onConfirm={handleDeleteInvoice}
                isDeleting={deletingInvoice}
            />
        </>
    );
};

export default InvoicesPage;