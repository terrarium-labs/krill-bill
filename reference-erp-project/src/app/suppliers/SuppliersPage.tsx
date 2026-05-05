import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import PageHeader from "@/app/components/page-header";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { Supplier } from "@/types/suppliers/supplier";
import SearchBar from "../components/search-bar";
import { getSuppliers, deleteSupplier } from "@/api/suppliers/suppliers";
import { toast } from "sonner";
import SupplierEditModal from "./components/supplier-edit-modal";
import SupplierCreateModal from "./components/supplier-create-modal";
import SupplierDeleteModal from "./components/supplier-delete-modal";
import TableFiltersRow from "../components/table-filters/table-filters";
import SuppliersTable from "./components/suppliers-table";
import { useTableFilters } from "@/hooks/use-table-filters";
import { useSuppliersTablePreferences } from "@/hooks/use-suppliers-table-preferences";
import { SupplierColumnSelector } from "./components/supplier-column-selector";

const SuppliersPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
    const [deletingSupplier, setDeletingSupplier] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
    
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
    } = useSuppliersTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) =>
            setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback(
        (order: string[]) => setColumnOrder(order),
        [setColumnOrder],
    );

    // Fetch suppliers function
    const fetchSuppliers = async (query: string = "") => {
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        if (!orgId) return;

        try {
            const response = await getSuppliers(orgId, query, undefined, tableFilters || undefined);
            if (response.success && response.success.suppliers) {
                setSuppliers(response.success.suppliers);
                setNextPageToken(response.success.next_page_token || null);
                if (!tableFilters) {
                    setTableFilters(response.success.params);
                }
            } else {
                toast.error(t("suppliers.errorFetchingSuppliers") || "Error fetching suppliers");
            }
        } catch (error) {
            toast.error(t("suppliers.errorFetchingSuppliers") || "Error fetching suppliers");
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchSuppliers();
    }, []);

    // Load more suppliers
    const loadMoreSuppliers = async () => {
        if (!orgId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getSuppliers(orgId, searchQuery || undefined, nextPageToken, tableFilters || undefined);
            if (response.success && response.success.suppliers) {
                setSuppliers(prev => [...prev, ...response.success.suppliers]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("suppliers.errorFetchingSuppliers") || "Error fetching suppliers");
            }
        } catch (error) {
            toast.error(t("suppliers.errorFetchingSuppliers") || "Error fetching suppliers");
        } finally {
            setLoadingMore(false);
            setIsLoading(false);
        }
    };

    // Handle create supplier (opens multistep Create modal)
    const handleCreateSupplier = () => {
        setCreateModalOpen(true);
    };

    // Handle edit supplier (opens Edit modal, used from table row actions)
    const handleEditSupplier = (supplier: Supplier) => {
        setSupplierToEdit(supplier);
        setEditModalOpen(true);
    };

    // Handle delete confirmation
    const handleDeleteConfirm = (supplier: Supplier) => {
        setSupplierToDelete(supplier);
        setDeleteModalOpen(true);
    };

    // Handle delete execution
    const handleDeleteSupplier = async () => {
        if (!supplierToDelete || !orgId) return;

        setDeletingSupplier(true);
        try {
            const response = await deleteSupplier(orgId, supplierToDelete.id);
            if (response.success) {
                toast.success(t("suppliers.supplierDeleted", "Supplier deleted successfully"));
                // Remove from local state
                setSuppliers(prev => prev.filter(s => s.id !== supplierToDelete.id));
            } else {
                toast.error(t("suppliers.errorDeletingSupplier", "Error deleting supplier"));
            }
        } catch (error) {
            toast.error(t("suppliers.errorDeletingSupplier", "Error deleting supplier"));
        } finally {
            setDeletingSupplier(false);
            setDeleteModalOpen(false);
            setSupplierToDelete(null);
        }
    };

    // Navigate to supplier detail
    const handleViewSupplier = (supplierId: string) => {
        navigate(`/${orgId}/suppliers/${supplierId}`);
    };

    // Render actions for table (Edit opens Edit modal, Delete opens delete modal)
    const renderTableActions = (supplier: Supplier) => {
        return (
            <div className="flex justify-center items-center">
                <CustomActionsDropdown
                    items={[
                        {
                            label: t("common.edit", "Edit"),
                            icon: "edit",
                            onClick: () => handleEditSupplier(supplier),
                        },
                        {
                            label: t("common.delete", "Delete"),
                            icon: "trash-2",
                            onClick: () => handleDeleteConfirm(supplier),
                            variant: "destructive",
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
                title={t("suppliers.title", "Suppliers")}
                description={t("suppliers.description", "Manage your organization's suppliers")}
                showBackButton={false}
                action={
                    <div className="flex items-center gap-2">
                        <Button onClick={handleCreateSupplier}>
                            <Plus className=" h-4 w-4" />
                            {t("suppliers.addSupplier", "Add Supplier")}
                        </Button>
                    </div>
                }
            />

            <SearchBar
                value={searchQuery}
                isLoading={isSearching}
                onChange={(query) => setSearchQuery(query)}
                onSearch={fetchSuppliers}
                placeholder={t("suppliers.searchPlaceholder", "Search suppliers...")}
            />

            {tableFilters && (
                <TableFiltersRow
                    value={tableFilters}
                    onChange={(filters) => setTableFilters(filters)}
                    onFilter={(_) => fetchSuppliers(searchQuery)}
                    endSlot={
                        <SupplierColumnSelector
                            columnVisibility={columnVisibility}
                            columnOrder={columnOrder}
                            onColumnVisibilityChange={handleColumnVisibilityChange}
                            onColumnOrderChange={handleColumnOrderChange}
                            onReset={resetPreferences}
                        />
                    }
                />
            )}

            {/* Suppliers Table */}
            <SuppliersTable
                suppliers={suppliers}
                isLoading={isLoading}
                renderActions={renderTableActions}
                onRowClick={(supplier) => handleViewSupplier(supplier.id)}
                clickableRows={true}
                onEmptyStateAction={handleCreateSupplier}
                searchQuery={searchQuery}
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
                            onClick={loadMoreSuppliers}
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

            {/* Create modal: multistep wizard (Add Supplier button + empty state) */}
            <SupplierCreateModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
                onSupplierCreated={fetchSuppliers}
            />

            {/* Edit modal: single form + header actions (table row Edit) */}
            <SupplierEditModal
                open={editModalOpen}
                onOpenChange={(open) => {
                    if (!open) setSupplierToEdit(null);
                    setEditModalOpen(open);
                }}
                onSupplierCreatedOrUpdated={fetchSuppliers}
                supplier={supplierToEdit}
                mode="edit"
                renderActions={
                    supplierToEdit
                        ? () => (
                              <CustomActionsDropdown
                                  items={[
                                      {
                                          label: t("common.delete", "Delete"),
                                          icon: "trash-2",
                                          onClick: () => {
                                              setEditModalOpen(false);
                                              handleDeleteConfirm(supplierToEdit);
                                          },
                                          variant: "destructive",
                                      },
                                  ]}
                              />
                          )
                        : undefined
                }
            />

            {/* Delete Confirmation Modal */}
            <SupplierDeleteModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                supplier={supplierToDelete}
                onConfirm={handleDeleteSupplier}
                isDeleting={deletingSupplier}
            />
        </>
    );
};

export default SuppliersPage;

