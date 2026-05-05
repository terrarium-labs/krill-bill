import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import PageHeader from "@/app/components/page-header";
import SearchBar from "@/app/components/search-bar";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { CustomActionsDropdown } from "@/app/components/custom-actions-dropdown";
import AbsencePolicyEditModal from './components/absence-policy-edit-modal';
import AbsencePolicyDeleteModal from './components/absence-policy-delete-modal';
import AbsencePoliciesTable from './components/absence-policies-table';
import { getAbsencePolicies, deleteAbsencePolicy } from "@/api/orgs/absences/absences";
import { useAbsencePoliciesTablePreferences } from "@/hooks/use-absence-policies-table-preferences";
import { AbsencePoliciesColumnSelector } from "./components/absence-policies-column-selector";

// Define AbsencePolicy type for this page (combining table and modal needs)
interface AbsencePolicy {
    id: string;
    name: string;
    description?: string;
    number_of_counters: number;
    created_at: string;
    is_default?: boolean;
}

// Componente interno que tiene acceso al contexto de selección
const AbsencePoliciesContent = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [absencePolicies, setAbsencePolicies] = useState<AbsencePolicy[]>([]);

    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = useAbsencePoliciesTablePreferences();

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
    const [policyToDelete, setPolicyToDelete] = useState<AbsencePolicy | null>(null);
    const [deletingPolicy, setDeletingPolicy] = useState(false);
    const [policyModalOpen, setPolicyModalOpen] = useState(false);
    const [policyModalMode, setPolicyModalMode] = useState<'create' | 'edit'>('create');
    const [policyToEdit, setPolicyToEdit] = useState<AbsencePolicy | null>(null);
    const navigate = useNavigate();

    // Fetch absence policies function
    const fetchAbsencePolicies = async (query: string = "") => {
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        if (!orgId) return;

        try {
            const response = await getAbsencePolicies(orgId, query, null);
            if (response.success && response.success.absence_policies) {
                setAbsencePolicies(response.success.absence_policies);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("absence-policies.policies.fetchError", "Failed to fetch absence policies"));
            }
        } catch (error) {
            toast.error(t("absence-policies.policies.fetchError", "Failed to fetch absence policies"));
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    // Load more absence policies
    const loadMoreAbsencePolicies = async () => {
        if (!orgId || !nextPageToken || isLoadingMore || isLoading) return;

        setIsLoadingMore(true);
        try {
            const response = await getAbsencePolicies(orgId, searchQuery, nextPageToken);
            if (response.success && response.success.absence_policies) {
                setAbsencePolicies(prev => [...prev, ...response.success.absence_policies]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("absence-policies.policies.fetchError", "Failed to fetch absence policies"));
            }
        } catch (error) {
            toast.error(t("absence-policies.policies.fetchError", "Failed to fetch absence policies"));
        } finally {
            setIsLoadingMore(false);
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchAbsencePolicies();
    }, []);

    // Handle create policy
    const handleCreatePolicy = () => {
        setPolicyToEdit(null);
        setPolicyModalMode('create');
        setPolicyModalOpen(true);
    };

    // Handle edit policy
    const handleEditPolicy = (policy: AbsencePolicy) => {
        setPolicyToEdit(policy);
        setPolicyModalMode('edit');
        setPolicyModalOpen(true);
    };

    // Handle edit modal close
    const handleEditModalClose = (open: boolean) => {
        setPolicyModalOpen(open);
        if (!open) {
            // Reset delete modal state when edit modal closes
            setDeleteModalOpen(false);
            setPolicyToEdit(null);
        }
    };

    // Handle delete confirmation
    const handleDeleteConfirm = (policy: AbsencePolicy) => {
        setPolicyToDelete(policy);
        setDeleteModalOpen(true);
    };

    // Render actions for table
    const renderTableActions = (policy: AbsencePolicy) => {
        return (
            <CustomActionsDropdown
                items={[
                    {
                        label: t("common.edit", "Edit"),
                        icon: "edit",
                        onClick: () => handleEditPolicy(policy),
                    },
                    {
                        label: t("common.delete", "Delete"),
                        icon: "trash-2",
                        onClick: () => handleDeleteConfirm(policy),
                        variant: "destructive",
                    },
                ]}
            />
        );
    };

    // Handle delete execution
    const handleDeletePolicy = async () => {
        if (!policyToDelete || !orgId) return;

        setDeletingPolicy(true);
        try {
            const response = await deleteAbsencePolicy(orgId, policyToDelete.id);
            if (response.success) {
                toast.success(t("absence-policies.policies.policyDeleted", "Absence policy deleted successfully"));
                // Remove from local state
                setAbsencePolicies(prev => prev.filter(p => p.id !== policyToDelete.id));
            } else {
                toast.error(t("absence-policies.policies.errorDeletingPolicy", "Error deleting absence policy"));
            }
        } catch (error) {
            toast.error(t("absence-policies.policies.errorDeletingPolicy", "Error deleting absence policy"));
        } finally {
            setDeletingPolicy(false);
            setDeleteModalOpen(false);
            setPolicyToDelete(null);
        }
    };

    const handleRowClick = (absencePolicy: AbsencePolicy) => {
        navigate(`${absencePolicy.id}`);
    };

    const handleAbsencePolicyCreatedOrUpdated = () => {
        // Refresh the absence policies list
        fetchAbsencePolicies();
    };

    return (
        <>
            {/* Header */}
            <PageHeader
                title={""}
                description={""}
                showBackButton={false}
            />

            <div className="flex w-full gap-2 justify-center items-center">

                <SearchBar
                    value={searchQuery}
                    className="w-full"
                    isLoading={isSearching}
                    onChange={(query) => setSearchQuery(query)}
                    onSearch={fetchAbsencePolicies}
                    placeholder={t("absence-policies.policies.searchPlaceholder", "Search absence policies...")}
                />

                <AbsencePoliciesColumnSelector
                    columnVisibility={columnVisibility}
                    columnOrder={columnOrder}
                    onColumnVisibilityChange={handleColumnVisibilityChange}
                    onColumnOrderChange={handleColumnOrderChange}
                    onReset={resetPreferences}
                />

                <Button onClick={handleCreatePolicy}>
                    <Plus className="h-4 w-4" />
                    {t("absence-policies.policies.addPolicy", "New policy")}
                </Button>

            </div>

            {/* Absence Policies Table */}
            <AbsencePoliciesTable
                absencePolicies={absencePolicies}
                isLoading={isLoading}
                renderActions={renderTableActions}
                onRowClick={handleRowClick}
                clickableRows={true}
                onEmptyStateAction={handleCreatePolicy}
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
                        onClick={loadMoreAbsencePolicies}
                        disabled={isLoadingMore}
                        className="min-w-32"
                    >
                        {isLoadingMore ? (
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

            <AbsencePolicyEditModal
                open={policyModalOpen}
                onOpenChange={handleEditModalClose}
                onAbsencePolicyCreatedOrUpdated={handleAbsencePolicyCreatedOrUpdated}
                orgId={orgId!}
                policy={policyToEdit as any}
                mode={policyModalMode}
                renderActions={policyModalMode === 'edit' ? () => (
                    <CustomActionsDropdown
                        items={[
                            {
                                label: t("common.delete", "Delete"),
                                icon: "trash-2",
                                onClick: () => {
                                    setPolicyModalOpen(false);
                                    handleDeleteConfirm(policyToEdit!);
                                },
                                variant: "destructive",
                            },
                        ]}
                    />
                ) : undefined}
            />

            {/* Delete Confirmation Modal */}
            <AbsencePolicyDeleteModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                policy={policyToDelete}
                onConfirm={handleDeletePolicy}
                isDeleting={deletingPolicy}
            />
        </>
    );
};

// Componente principal 
const AbsencesPolicies = () => {
    return <AbsencePoliciesContent />;
};

export default AbsencesPolicies;