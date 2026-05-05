import { useTranslation } from "react-i18next";
import PageHeader from "@/app/components/page-header";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { SerialNumber } from "@/types/general/serial-numbers";
import {
    getOrgSerialNumbers,
    postOrgSerialNumber,
    patchOrgSerialNumber,
    deleteOrgSerialNumber,
} from "@/api/orgs/serial-numbers/serial-numbers";
import { toast } from "sonner";
import SearchBar from "@/app/components/search-bar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CustomActionsDropdown } from "@/app/components/custom-actions-dropdown";
import SerialNumbersTable from "./components/serial-numbers-table";
import SerialNumberEditModal from "./components/serial-number-edit-modal";
import SerialNumberDeleteModal from "./components/serial-number-delete-modal";
import { useSerialNumbersTablePreferences } from "@/hooks/use-serial-numbers-table-preferences";
import { SerialNumbersColumnSelector } from "./components/serial-numbers-column-selector";

const SerialNumbersPage = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>([]);

    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = useSerialNumbersTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) =>
            setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback(
        (order: string[]) => setColumnOrder(order),
        [setColumnOrder],
    );
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [serialNumberToEdit, setSerialNumberToEdit] = useState<SerialNumber | null>(null);
    const [serialNumberToDelete, setSerialNumberToDelete] = useState<SerialNumber | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Fetch serial numbers
    const fetchSerialNumbers = async (query: string = "") => {
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        if (!orgId) return;

        try {
            const response = await getOrgSerialNumbers(
                orgId,
                undefined,
                query,
                null
            );
            if (response.success && response.success.serial_numbers) {
                setSerialNumbers(response.success.serial_numbers);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("admin.serialNumbers.fetchError", "Failed to fetch serial numbers"));
            }
        } catch (error) {
            console.error("Error fetching serial numbers:", error);
            toast.error(t("admin.serialNumbers.fetchError", "Failed to fetch serial numbers"));
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSerialNumbers();
    }, [orgId]);

    // Handle create modal
    const handleOpenCreateModal = () => {
        setModalMode("create");
        setSerialNumberToEdit(null);
        setModalOpen(true);
    };

    // Handle edit modal
    const handleOpenEditModal = (serialNumber: SerialNumber) => {
        setModalMode("edit");
        setSerialNumberToEdit(serialNumber);
        setModalOpen(true);
    };

    // Handle submit (create or edit)
    const handleSubmit = async (data: {
        entity: "orders" | "sales_invoices" | "purchase_invoices";
        name: string;
        value: string;
        last_num_value: number;
    }) => {
        if (!orgId) return;

        try {
            if (modalMode === "create") {
                const response = await postOrgSerialNumber(orgId, data);
                if (response.success) {
                    toast.success(t("admin.serialNumbers.createSuccess", "Serial number created successfully"));
                    fetchSerialNumbers();
                }
            } else if (modalMode === "edit" && serialNumberToEdit) {
                const response = await patchOrgSerialNumber(orgId, serialNumberToEdit.id, data);
                if (response.success) {
                    toast.success(t("admin.serialNumbers.updateSuccess", "Serial number updated successfully"));
                    fetchSerialNumbers();
                }
            }
        } catch (error) {
            console.error("Error submitting serial number:", error);
            toast.error(
                t(
                    "admin.serialNumbers.submitError",
                    modalMode === "create" ? "Failed to create serial number" : "Failed to update serial number"
                )
            );
        }
    };

    // Handle delete
    const handleOpenDeleteModal = (serialNumber: SerialNumber) => {
        setSerialNumberToDelete(serialNumber);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!orgId || !serialNumberToDelete) return;

        setIsDeleting(true);
        try {
            const response = await deleteOrgSerialNumber(orgId, serialNumberToDelete.id);
            if (response.success) {
                toast.success(t("admin.serialNumbers.deleteSuccess", "Serial number deleted successfully"));
                fetchSerialNumbers();
                setIsDeleteModalOpen(false);
                setSerialNumberToDelete(null);
            }
        } catch (error) {
            console.error("Error deleting serial number:", error);
            toast.error(t("admin.serialNumbers.deleteError", "Failed to delete serial number"));
        } finally {
            setIsDeleting(false);
        }
    };

    // Handle load more
    const handleLoadMore = async () => {
        if (!orgId || !nextPageToken || loadingMore) return;

        setLoadingMore(true);
        try {
            const response = await getOrgSerialNumbers(
                orgId,
                undefined,
                searchQuery,
                nextPageToken
            );
            if (response.success && response.success.serial_numbers) {
                setSerialNumbers(prev => [...prev, ...response.success.serial_numbers]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("admin.serialNumbers.fetchError", "Failed to fetch serial numbers"));
            }
        } catch (error) {
            console.error("Error loading more serial numbers:", error);
            toast.error(t("admin.serialNumbers.fetchError", "Failed to fetch serial numbers"));
        } finally {
            setLoadingMore(false);
        }
    };

    // Render table actions
    const renderTableActions = (serialNumber: SerialNumber) => {
        return (
            <CustomActionsDropdown
                items={[
                    {
                        label: t("common.edit", "Edit"),
                        icon: "edit",
                        onClick: () => handleOpenEditModal(serialNumber),
                    },
                    {
                        label: t("common.delete", "Delete"),
                        icon: "trash-2",
                        onClick: () => handleOpenDeleteModal(serialNumber),
                        variant: "destructive",
                    },
                ]}
            />
        );
    };

    return (
        <>
            {/* Header */}
            <PageHeader
                title={t("admin.serialNumbers.title", "Document Series")}
                description={t(
                    "admin.serialNumbers.description",
                    "Manage serial number patterns for your documents."
                )}
                docs={{ slug: "pd_admin_serial_numbers" }}
                action={
                    <div className="flex items-center gap-2">
                        <Button onClick={handleOpenCreateModal}>
                            <Plus className="h-4 w-4" />
                            {t("admin.serialNumbers.addSerialNumber", "Add Serial Number")}
                        </Button>
                    </div>
                }
            />

            <div className="flex items-center gap-2">
                <SearchBar
                    value={searchQuery}
                    className="flex-1"
                    isLoading={isSearching}
                    onChange={(query) => setSearchQuery(query)}
                    onSearch={fetchSerialNumbers}
                    placeholder={t("admin.serialNumbers.searchPlaceholder", "Search serial numbers...")}
                />
                <SerialNumbersColumnSelector
                    columnVisibility={columnVisibility}
                    columnOrder={columnOrder}
                    onColumnVisibilityChange={handleColumnVisibilityChange}
                    onColumnOrderChange={handleColumnOrderChange}
                    onReset={resetPreferences}
                />
            </div>

            {/* Serial Numbers Table */}
            <SerialNumbersTable
                data={serialNumbers}
                isLoading={isLoading}
                renderActions={renderTableActions}
                onRowClick={handleOpenEditModal}
                clickableRows={true}
                onEmptyStateAction={handleOpenCreateModal}
                searchQuery={searchQuery}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                columnOrder={columnOrder}
                onColumnOrderChange={setColumnOrder}
                columnSizing={columnSizing}
                onColumnSizingChange={setColumnSizing}
            />

            {/* Load More Button */}
            {nextPageToken && !isLoading && (
                <div className="flex justify-center mt-6">
                    <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                    >
                        {loadingMore ? t("common.loading", "Loading...") : t("common.loadMore", "Load More")}
                    </Button>
                </div>
            )}

            {/* Create/Edit Modal */}
            <SerialNumberEditModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                onSubmit={handleSubmit}
                mode={modalMode}
                serialNumber={serialNumberToEdit}
                renderActions={
                    modalMode === "edit" && serialNumberToEdit
                        ? () => (
                              <CustomActionsDropdown
                                  items={[
                                      {
                                          label: t("common.delete", "Delete"),
                                          icon: "trash-2",
                                          onClick: () => {
                                              handleOpenDeleteModal(serialNumberToEdit);
                                              setModalOpen(false);
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
            <SerialNumberDeleteModal
                open={isDeleteModalOpen}
                onOpenChange={setIsDeleteModalOpen}
                serialNumber={serialNumberToDelete}
                onConfirm={handleDelete}
                isDeleting={isDeleting}
            />
        </>
    );
};

export default SerialNumbersPage;

