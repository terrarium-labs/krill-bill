import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import PageHeader from "@/app/components/page-header";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { SaleInvoice, InvoicesMetadata } from "@/types/invoices/invoices";
import SearchBar from "@/app/components/search-bar";
import { deleteSalesInvoice, getSalesInvoices, postSalesInvoice } from "@/api/sales-invoices/sales-invoices";
import { toast } from "sonner";
import SaleInvoiceDeleteModal from "./components/sale-invoice-delete-modal";
import TableFiltersRow from "@/app/components/table-filters/table-filters";
import SalesInvoicesTable from "./components/sales-invoices-table";
import { useTableFilters } from "@/hooks/use-table-filters";
import WorkOrdersSelectionModal from "./components/work-orders-selection-modal";
import { useSalesInvoicesTablePreferences } from "@/hooks/use-sales-invoices-table-preferences";
import { SalesInvoiceColumnSelector } from "./components/sales-invoice-column-selector";

const SalesInvoicesPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const [invoices, setInvoices] = useState<SaleInvoice[]>([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState<SaleInvoice | null>(null);
    const [deletingInvoice, setDeletingInvoice] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [metadata, setMetadata] = useState<InvoicesMetadata | null>(null);
    const [woSelectionModalOpen, setWoSelectionModalOpen] = useState(false);
    const [creatingFromWo, setCreatingFromWo] = useState(false);

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
    } = useSalesInvoicesTablePreferences();

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
            const response = await getSalesInvoices(orgId, query, undefined, tableFilters || undefined);
            if (response.success && response.success.invoices) {
                setInvoices(response.success.invoices);
                setNextPageToken(response.success.next_page_token || null);
                setMetadata(response.success.metadata || null);
                if (!tableFilters) {
                    setTableFilters(response.success.params);
                }
            } else {
                toast.error(t("salesInvoices.errorFetchingInvoices") || "Error fetching sales invoices");
            }
        } catch (error) {
            toast.error(t("salesInvoices.errorFetchingInvoices") || "Error fetching sales invoices");
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
            const response = await getSalesInvoices(orgId, searchQuery || undefined, nextPageToken, tableFilters || undefined);
            if (response.success && response.success.invoices) {
                setInvoices(prev => [...prev, ...response.success.invoices]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("salesInvoices.errorFetchingInvoices") || "Error fetching sales invoices");
            }
        } catch (error) {
            toast.error(t("salesInvoices.errorFetchingInvoices") || "Error fetching sales invoices");
        } finally {
            setLoadingMore(false);
            setIsLoading(false);
        }
    };

    // Handle create invoice
    const handleCreateInvoice = async () => {
        if (!orgId) return;
        try {
            const response = await postSalesInvoice(orgId, {});
            if (response.success) {
                toast.success(t("salesInvoices.invoiceCreated", "Sales invoice created successfully"));
                navigate(`/${orgId}/sales/invoices/${response.success.invoice_id}`);
                fetchInvoices();
            } else {
                toast.error(t("salesInvoices.errorCreatingInvoice", "Error creating sales invoice"));
            }
        } catch (error) {
            toast.error(t("salesInvoices.errorCreatingInvoice", "Error creating sales invoice"));
        }
    };

    // Handle create invoice from work orders
    const handleCreateFromWorkOrders = async (workOrderIds: string[], groupByHeaders: boolean) => {
        if (!orgId) return;
        setCreatingFromWo(true);
        try {
            const response = await postSalesInvoice(orgId, {
                origin_ids: workOrderIds,
                group_by_headers: groupByHeaders,
            });
            if (response.success) {
                toast.success(t("salesInvoices.invoiceCreated", "Sales invoice created successfully"));
                setWoSelectionModalOpen(false);
                navigate(`/${orgId}/sales/invoices/${response.success.invoice_id}`);
            } else {
                toast.error(t("salesInvoices.errorCreatingInvoice", "Error creating sales invoice"));
            }
        } catch {
            toast.error(t("salesInvoices.errorCreatingInvoice", "Error creating sales invoice"));
        } finally {
            setCreatingFromWo(false);
        }
    };

    // Handle delete confirmation
    const handleDeleteConfirm = (invoice: SaleInvoice) => {
        setInvoiceToDelete(invoice);
        setDeleteModalOpen(true);
    };

    // Handle delete execution
    const handleDeleteInvoice = async () => {
        if (!invoiceToDelete || !orgId) return;

        setDeletingInvoice(true);
        try {
            const response = await deleteSalesInvoice(orgId, invoiceToDelete.id);
            if (response.success) {
                toast.success(t("salesInvoices.invoiceDeleted", "Sales invoice deleted successfully"));
                fetchInvoices();
            } else {
                toast.error(t("salesInvoices.errorDeletingInvoice", "Error deleting sales invoice"));
            }
            setDeleteModalOpen(false);
            setInvoiceToDelete(null);
        } catch (error) {
            toast.error(t("salesInvoices.errorDeletingInvoice", "Error deleting sales invoice"));
        } finally {
            setDeletingInvoice(false);
        }
    };

    // Handle edit invoice
    const handleEditInvoice = (invoice: SaleInvoice) => {
        navigate(`/${orgId}/sales/invoices/${invoice.id}`);
    };

    // Navigate to invoice detail
    const handleViewInvoice = (invoiceId: string) => {
        navigate(`/${orgId}/sales/invoices/${invoiceId}`);
    };

    // Render actions for table
    const renderTableActions = (invoice: SaleInvoice) => {
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
                title={t("salesInvoices.title", "Sales Invoices")}
                description={t("salesInvoices.description", "Manage your organization's sales invoices")}
                showBackButton={false}
                action={
                    <div className="flex items-center gap-0">
                        <Button onClick={handleCreateInvoice} className="rounded-r-none">
                            <Plus className="h-4 w-4" />
                            {t("salesInvoices.addInvoice", "New Invoice")}
                        </Button>
                        <CustomActionsDropdown
                            triggerIcon="chevron-down"
                            className="rounded-l-none border-muted/50 border-l-1 h-9 px-2"
                            triggerVariant="default"
                            items={[
                                {
                                    label: t("salesInvoices.addInvoiceFromWorkOrders", "From WorkOrders"),
                                    icon: "wrench",
                                    onClick: () => setWoSelectionModalOpen(true),
                                },
                            ]}
                        />
                    </div>
                }
            />
            <SearchBar
                value={searchQuery}
                isLoading={isSearching}
                onChange={(query) => setSearchQuery(query)}
                onSearch={fetchInvoices}
                placeholder={t("salesInvoices.searchPlaceholder", "Search invoices...")}
            />

            {tableFilters && (
                <TableFiltersRow
                    value={tableFilters}
                    onChange={(filters) => setTableFilters(filters)}
                    onFilter={(_) => fetchInvoices(searchQuery)}
                    endSlot={
                        <SalesInvoiceColumnSelector
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
            <SalesInvoicesTable
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
            <SaleInvoiceDeleteModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                invoice={invoiceToDelete}
                onConfirm={handleDeleteInvoice}
                isDeleting={deletingInvoice}
            />

            {/* Work Orders Selection Modal */}
            <WorkOrdersSelectionModal
                open={woSelectionModalOpen}
                onOpenChange={setWoSelectionModalOpen}
                onConfirm={handleCreateFromWorkOrders}
                isLoading={creatingFromWo}
            />
        </>
    );
};

export default SalesInvoicesPage;
