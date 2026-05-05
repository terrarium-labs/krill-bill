import PageHeader from "../components/page-header";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router";
import { SickLeave } from "@/types/employees/sick-leaves";
import {
    getSickLeaves,
    patchSickLeave,
    deleteSickLeave,
    postSickLeave,
} from "@/api/orgs/sick-leaves/sick-leaves";
import { toast } from "sonner";
import SearchBar from "@/app/components/search-bar";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import SickLeavesTable from "./components/sick-leaves-table";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import SickLeaveEditModal from "./components/sick-leave-edit-modal";
import SickLeaveDeleteModal from "./components/sick-leave-delete-modal";
import SickLeaveViewModal from "./components/sick-leave-view-modal";
import TableFiltersRow from "@/app/components/table-filters/table-filters";
import { useTableFilters } from "@/hooks/use-table-filters";
import { useSickLeavesTablePreferences } from "@/hooks/use-sick-leaves-table-preferences";
import { SickLeaveColumnSelector } from "./components/sick-leave-column-selector";

const SickLeavesPage = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();

    const [sickLeaves, setSickLeaves] = useState<SickLeave[]>([]);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearching, setIsSearching] = useState(false);
    
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
    } = useSickLeavesTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) =>
            setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback(
        (order: string[]) => setColumnOrder(order),
        [setColumnOrder],
    );

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSickLeave, setSelectedSickLeave] = useState<SickLeave | null>(null);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");

    // View modal state
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingSickLeave, setViewingSickLeave] = useState<SickLeave | null>(null);

    // Delete modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingSickLeave, setDeletingSickLeave] = useState<SickLeave | null>(null);
    const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

    // Fetch time records function
    const fetchSickLeaves = async (query: string = "") => {
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        if (!orgId) return;

        try {
            const response = await getSickLeaves(
                orgId,
                undefined,
                undefined,
                undefined,
                query || undefined,
                undefined,
                tableFilters || undefined
            );
            if (response.success && response.success.sick_leaves) {
                setSickLeaves(response.success.sick_leaves);
                setNextPageToken(response.success.next_page_token || null);
                if (!tableFilters) {
                  setTableFilters(response.success.params);
                }
            } else {
                toast.error(t("employees.sickLeaves.errorFetchingSickLeaves") || "Error fetching sick leaves");
            }
        } catch (error) {
            toast.error(t("employees.sickLeaves.errorFetchingSickLeaves") || "Error fetching sick leaves");
            console.error("Error fetching sick leaves:", error);
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        if (orgId) {
            fetchSickLeaves();
        }
    }, [orgId]);

    // Load more time records
    const loadMoreSickLeaves = async () => {
        if (!orgId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getSickLeaves(
                orgId,
                undefined,
                undefined,
                undefined,
                searchQuery || undefined,
                nextPageToken,
                tableFilters || undefined
            );
            if (response.success && response.success.sick_leaves) {
                setSickLeaves(prev => [...prev, ...response.success.sick_leaves]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("employees.sickLeaves.errorFetchingSickLeaves") || "Error fetching sick leaves");
            }
        } catch (error) {
            toast.error(t("employees.sickLeaves.errorFetchingSickLeaves") || "Error fetching sick leaves");
            console.error("Error fetching sick leaves:", error);
        } finally {
            setLoadingMore(false);
        }
    };

    // Action handlers
    const handleEditSickLeave = (sickLeave: SickLeave) => {
        setSelectedSickLeave(sickLeave);
        setModalMode("edit");
        setIsModalOpen(true);
    };

    const handleNewSickLeave = () => {
        setSelectedSickLeave(null);
        setModalMode("create");
        setIsModalOpen(true);
    };

    const handleModalClose = (open: boolean) => {
        setIsModalOpen(open);
        if (!open) {
            setSelectedSickLeave(null);
        }
    };

    // View modal handlers
    const handleOpenViewModal = (sickLeave: SickLeave) => {
        setViewingSickLeave(sickLeave);
        setIsViewModalOpen(true);
    };

    const handleViewModalClose = (open: boolean) => {
        setIsViewModalOpen(open);
        if (!open) {
            setViewingSickLeave(null);
        }
    };

    // Custom API functions for admin control over employee sick leaves
    const handleCreateSickLeave = async (data: {
        employee_id: string;
        name: string;
        start_date: string;
        end_date: string;
        description: string | null;
    }) => {
        if (!orgId) return { error: "Missing orgId" };
        return postSickLeave(orgId, data);
    };

    const handleUpdateSickLeave = async (
        sickLeaveId: string,
        data: {
            employee_id: string;
            name: string;
            start_date: string;
            end_date: string;
            description: string | null;
        }
    ) => {
        if (!orgId) return { error: "Missing orgId" };
        return patchSickLeave(orgId, sickLeaveId, data);
    };

    const handleSickLeaveCreatedOrUpdated = () => {
        fetchSickLeaves(searchQuery);
    };

    // Delete handlers
    const handleOpenDeleteModal = (sickLeave: SickLeave) => {
        setDeletingSickLeave(sickLeave);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setDeletingSickLeave(null);
        setIsDeleteSubmitting(false);
    };

    const handleConfirmDelete = async () => {
        if (!deletingSickLeave || !orgId) return;

        setIsDeleteSubmitting(true);
        try {
            const response = await deleteSickLeave(orgId, deletingSickLeave.id);
            if (response.success || response === undefined) {
                toast.success(t("employees.sickLeaves.deleteSuccess", "Sick leave deleted successfully"));
                await fetchSickLeaves(searchQuery);
                handleCloseDeleteModal();
            } else {
                toast.error(response.error?.message || t("employees.sickLeaves.deleteError", "Error deleting sick leave"));
            }
        } catch (error) {
            toast.error(t("employees.sickLeaves.deleteError", "Error deleting sick leave"));
            console.error("Error deleting sick leave:", error);
        } finally {
            setIsDeleteSubmitting(false);
        }
    };


    // Custom render function for table actions (Admin view - full control)
    const renderTableActions = (sickLeave: SickLeave, _allSickLeaves: SickLeave[]) => {
        return (
            <div className="flex items-center gap-2 justify-center">
                {/* Three dots menu */}
                <CustomActionsDropdown
                    items={[
                        // View option - always available
                        {
                            label: t("common.view", "View"),
                            icon: "eye",
                            onClick: () => handleOpenViewModal(sickLeave),
                        },
                        {
                            label: t("common.edit", "Edit"),
                            icon: "edit",
                            onClick: () => handleEditSickLeave(sickLeave),
                        },
                        {
                            label: t("common.delete", "Delete"),
                            icon: "trash-2",
                            onClick: () => handleOpenDeleteModal(sickLeave),
                            variant: "destructive",
                        },
                    ]}
                />
            </div>
        );
    };

    // Render function for modal header actions (three-dots menu only, no approve/reject buttons or View option)
    const renderModalActions = (sickLeave: SickLeave) => {
        return (
            <CustomActionsDropdown
                items={[
                    {
                        label: t("common.edit", "Edit"),
                        icon: "edit",
                        onClick: () => {
                            setIsViewModalOpen(false);
                            handleEditSickLeave(sickLeave);
                        },
                    },
                    {
                        label: t("common.delete", "Delete"),
                        icon: "trash-2",
                        onClick: () => handleOpenDeleteModal(sickLeave),
                        variant: "destructive",
                    },
                ]}
            />
        );
    };

    return (
        <>
            <PageHeader
                title={t("sickLeaves.title", "Sick Leaves")}
                description={t("sickLeaves.description", "Manage your organization's sick leaves.")}
                docs={{ slug: "pd_mod_sick_leaves" }}
                showBackButton={false}
                action={
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleNewSickLeave}
                            disabled={isLoading}
                        >
                            <Plus className="h-4 w-4" />
                            {t("sickLeaves.addSickLeave", "Add sick leave")}
                        </Button>
                    </div>
                }
            />

            <SearchBar
                value={searchQuery}
                isLoading={isSearching}
                onChange={(query) => setSearchQuery(query)}
                onSearch={fetchSickLeaves}
                placeholder={t("sickLeaves.searchPlaceholder", "Search sick leaves...")}
            />

            {/* Filters */}
            {tableFilters && (
                <TableFiltersRow
                    value={tableFilters}
                    onChange={(filters) => setTableFilters(filters)}
                    onFilter={(_) => fetchSickLeaves(searchQuery)}
                    endSlot={
                        <SickLeaveColumnSelector
                            columnVisibility={columnVisibility}
                            columnOrder={columnOrder}
                            onColumnVisibilityChange={handleColumnVisibilityChange}
                            onColumnOrderChange={handleColumnOrderChange}
                            onReset={resetPreferences}
                        />
                    }
                />
            )}

            {/* Sick Leaves Table */}
            <SickLeavesTable
                sickLeaves={sickLeaves}
                isLoading={isLoading}
                renderActions={renderTableActions}
                onRowClick={handleOpenViewModal}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                columnOrder={columnOrder}
                onColumnOrderChange={setColumnOrder}
                columnSizing={columnSizing}
                onColumnSizingChange={setColumnSizing}
            />

            {/* Load More Button */}
            {nextPageToken && (
                <div className="flex justify-center mt-6">
                    <Button
                        variant="outline"
                        onClick={loadMoreSickLeaves}
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
            )}

            {/* View Sick Leave Modal */}
            <SickLeaveViewModal
                open={isViewModalOpen}
                onOpenChange={handleViewModalClose}
                sickLeave={viewingSickLeave}
                renderActions={renderModalActions}
                employeeId={viewingSickLeave?.employee?.id}
            />

            {/* Create/Edit Sick Leave Modal */}
            {orgId && modalMode === "create" && (
                <SickLeaveEditModal
                    open={isModalOpen}
                    onOpenChange={handleModalClose}
                    onSickLeaveCreatedOrUpdated={handleSickLeaveCreatedOrUpdated}
                    orgId={orgId}
                    sickLeave={null}
                    mode="create"
                    onCreateSickLeave={handleCreateSickLeave}
                />
            )}

            {orgId && modalMode === "edit" && selectedSickLeave && (
                <SickLeaveEditModal
                    open={isModalOpen}
                    onOpenChange={handleModalClose}
                    onSickLeaveCreatedOrUpdated={handleSickLeaveCreatedOrUpdated}
                    orgId={orgId}
                    sickLeave={selectedSickLeave}
                    mode="edit"
                    onUpdateSickLeave={handleUpdateSickLeave}
                    renderActions={(sickLeave, closeModal) => (
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("common.delete", "Delete"),
                                    icon: "trash-2",
                                    onClick: () => {
                                        closeModal();
                                        handleOpenDeleteModal(sickLeave);
                                    },
                                    variant: "destructive",
                                },
                            ]}
                        />
                    )}
                />
            )}

            {/* Delete Modal */}
            <SickLeaveDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                sickLeave={deletingSickLeave}
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleteSubmitting}
            />
        </>
    );
};

export default SickLeavesPage;