import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import PageHeader from "@/app/components/page-header";
import SearchBar from "@/app/components/search-bar";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { AbsenceType } from '@/types/general/absences';
import AbsenceTypeEditModal from './components/absence-type-edit-modal';
import AbsenceTypesTable from './components/absence-types-table';
import AbsenceTypeDeleteModal from './components/absence-type-delete-modal';
import { getAbsenceTypes, deleteAbsenceType } from "@/api/orgs/absences/absences";
import { CustomActionsDropdown } from "@/app/components/custom-actions-dropdown";
import { useAbsenceTypesTablePreferences } from "@/hooks/use-absence-types-table-preferences";
import { AbsenceTypesColumnSelector } from "./components/absence-types-column-selector";

// Componente interno que tiene acceso al contexto de selección
const AbsencesTypesContent = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [absenceTypes, setAbsenceTypes] = useState<AbsenceType[]>([]);

    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = useAbsenceTypesTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) =>
            setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback(
        (order: string[]) => setColumnOrder(order),
        [setColumnOrder],
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [absenceTypeToDelete, setAbsenceTypeToDelete] = useState<AbsenceType | null>(null);
    const [deletingAbsenceType, setDeletingAbsenceType] = useState(false);
    const [absenceTypeModalOpen, setAbsenceTypeModalOpen] = useState(false);
    const [absenceTypeModalMode, setAbsenceTypeModalMode] = useState<'create' | 'edit'>('create');
    const [selectedAbsenceType, setSelectedAbsenceType] = useState<AbsenceType | null>(null);

    const fetchAbsenceTypes = async (query: string = "", page_token: string | null = null) => {
        if (!orgId) return;

        // Set loading state
        if (query) {
            setIsSearching(true);
        } else if (!page_token) {
            setIsLoading(true);
        }

        try {
            const response = await getAbsenceTypes(orgId, query || null, page_token);
            if (response.success) {
                if (page_token) {
                    // Loading more results - append to existing
                    setAbsenceTypes((prev) => [
                        ...prev,
                        ...(response.success.absence_types as AbsenceType[]),
                    ]);
                } else {
                    // New search or initial load - replace existing
                    setAbsenceTypes(response.success.absence_types as AbsenceType[]);
                }
                if (response.success.next_page_token) {
                    setNextPageToken(response.success.next_page_token);
                } else {
                    setNextPageToken(null);
                }
            } else {
                toast.error(t("absences.types.errorFetching", "Error fetching absence types"));
            }
        } catch (error) {
            toast.error(t("absences.types.errorFetching", "Error fetching absence types"));
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    const loadMore = async () => {
        if (!nextPageToken || isLoadingMore) return;

        setIsLoadingMore(true);
        try {
            await fetchAbsenceTypes(searchQuery, nextPageToken);
        } catch (error) {
            toast.error(t("common.error"));
        } finally {
            setIsLoadingMore(false);
        }
    };

    // Initial load
    useEffect(() => {
        if (orgId) {
            fetchAbsenceTypes();
        }
    }, [orgId]);

    const handleRowClick = (absenceType: AbsenceType) => {
        setSelectedAbsenceType(absenceType);
        setAbsenceTypeModalMode('edit');
        setAbsenceTypeModalOpen(true);
    };

    // Handle create absence type
    const handleCreateAbsenceType = () => {
        setSelectedAbsenceType(null);
        setAbsenceTypeModalMode('create');
        setAbsenceTypeModalOpen(true);
    };

    // Handle edit modal close
    const handleEditModalClose = (open: boolean) => {
        setAbsenceTypeModalOpen(open);
        if (!open) {
            // Reset delete modal state when edit modal closes
            setDeleteModalOpen(false);
            setSelectedAbsenceType(null);
        }
    };

    const handleAbsenceTypeCreatedOrUpdated = () => {
        // Refresh the absence types list
        fetchAbsenceTypes(searchQuery);
    };

    // Handle delete confirmation
    const handleDeleteConfirm = (absenceType: AbsenceType) => {
        setAbsenceTypeToDelete(absenceType);
        setDeleteModalOpen(true);
    };

    // Render actions for table
    const renderTableActions = (absenceType: AbsenceType) => {
        return (
            <CustomActionsDropdown
                items={[
                    {
                        label: t("common.delete", "Delete"),
                        icon: "trash-2",
                        onClick: () => handleDeleteConfirm(absenceType),
                        variant: "destructive",
                    },
                ]}
            />
        );
    };

    // Handle delete execution
    const handleDeleteAbsenceType = async () => {
        if (!absenceTypeToDelete || !orgId) return;

        setDeletingAbsenceType(true);
        try {
            const response = await deleteAbsenceType(orgId, absenceTypeToDelete.id);
            if (response.success) {
                toast.success(t("absences.types.deleted", "Absence type deleted successfully"));
                // Remove from local state
                setAbsenceTypes(prev => prev.filter(at => at.id !== absenceTypeToDelete.id));
            } else {
                toast.error(t("absences.types.errorDeleting", "Error deleting absence type"));
            }
        } catch (error) {
            toast.error(t("absences.types.errorDeleting", "Error deleting absence type"));
        } finally {
            setDeletingAbsenceType(false);
            setDeleteModalOpen(false);
            setAbsenceTypeToDelete(null);
        }
    };

    return (
        <>
            {/* Header */}
            <PageHeader
                title={""}
                description={""}
                showBackButton={false}
            />

            <div className="flex items-center gap-2">
                <SearchBar
                    value={searchQuery}
                    className="w-full"
                    isLoading={isSearching}
                    onChange={(query) => setSearchQuery(query)}
                    onSearch={fetchAbsenceTypes}
                    placeholder={t("absences.types.searchPlaceholder", "Search absence types...")}
                />
                <AbsenceTypesColumnSelector
                    columnVisibility={columnVisibility}
                    columnOrder={columnOrder}
                    onColumnVisibilityChange={handleColumnVisibilityChange}
                    onColumnOrderChange={handleColumnOrderChange}
                    onReset={resetPreferences}
                />
                <Button onClick={handleCreateAbsenceType}>
                    <Plus className="h-4 w-4" />
                    {t("absences.types.addType", "New type")}
                </Button>
            </div>

            {/* Absence Types Table */}
            <AbsenceTypesTable
                absenceTypes={absenceTypes}
                isLoading={isLoading}
                renderActions={renderTableActions}
                onRowClick={handleRowClick}
                clickableRows={true}
                onEmptyStateAction={handleCreateAbsenceType}
                searchQuery={searchQuery}
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
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        className="min-w-32"
                    >
                        {isLoadingMore ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t("common.loading", "Loading...")}
                            </>
                        ) : (
                            t("common.loadMore", "Load More")
                        )}
                    </Button>
                </div>
            )}

            {/* Absence Type Edit Modal */}
            <AbsenceTypeEditModal
                open={absenceTypeModalOpen}
                onOpenChange={handleEditModalClose}
                onAbsenceTypeCreatedOrUpdated={handleAbsenceTypeCreatedOrUpdated}
                orgId={orgId!}
                absenceType={selectedAbsenceType}
                mode={absenceTypeModalMode}
                renderActions={absenceTypeModalMode === 'edit' ? () => (
                    <CustomActionsDropdown
                        items={[
                            {
                                label: t("common.delete", "Delete"),
                                icon: "trash-2",
                                onClick: () => {
                                    setAbsenceTypeModalOpen(false);
                                    handleDeleteConfirm(selectedAbsenceType!);
                                },
                                variant: "destructive",
                            },
                        ]}
                    />
                ) : undefined}
            />

            {/* Delete Confirmation Modal */}
            <AbsenceTypeDeleteModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                absenceType={absenceTypeToDelete}
                onConfirm={handleDeleteAbsenceType}
                isDeleting={deletingAbsenceType}
            />
        </>
    );
};

// Componente principal 
const AbsencesTypes = () => {
    return <AbsencesTypesContent />;
};

export default AbsencesTypes;