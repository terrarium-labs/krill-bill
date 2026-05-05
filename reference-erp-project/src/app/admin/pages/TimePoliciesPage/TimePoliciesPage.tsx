import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import PageHeader from "@/app/components/page-header";
import SearchBar from "@/app/components/search-bar";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { TimePolicy } from "@/types/general/time-policies";
import TimePolicyEditModal from './components/time-policy-edit-modal';
import TimePoliciesTable from './components/time-policies-table';
import TimePolicyDeleteModal from './components/time-policy-delete-modal';
import { getTimePolicies, deleteTimePolicy } from "@/api/orgs/time-policies/time-policies";
import { useTimePoliciesTablePreferences } from "@/hooks/use-time-policies-table-preferences";
import { TimePolicyColumnSelector } from "./components/time-policy-column-selector";

const TimePoliciesContent = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = useTimePoliciesTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) => setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback((order: string[]) => setColumnOrder(order), [setColumnOrder]);
    const [timePolicies, setTimePolicies] = useState<TimePolicy[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [policyToDelete, setPolicyToDelete] = useState<TimePolicy | null>(null);
    const [deletingPolicy, setDeletingPolicy] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [policyModalMode, setPolicyModalMode] = useState<'create' | 'edit'>('create');
    const [policyToEdit, setPolicyToEdit] = useState<TimePolicy | null>(null);
    const navigate = useNavigate();

    // Fetch time policies function
    const fetchTimePolicies = async (query: string = "") => {
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        if (!orgId) return;

        try {
            const response = await getTimePolicies(orgId, query, null);
            if (response.success && response.success.time_policies) {
                setTimePolicies(response.success.time_policies);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("timePolicies.fetchError", "Failed to fetch time policies"));
            }
        } catch (error) {
            toast.error(t("timePolicies.fetchError", "Failed to fetch time policies"));
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    // Load more time policies
    const loadMoreTimePolicies = async () => {
        if (!orgId || !nextPageToken || isLoadingMore || isLoading) return;

        setIsLoadingMore(true);
        try {
            const response = await getTimePolicies(orgId, searchQuery, nextPageToken);
            if (response.success && response.success.time_policies) {
                setTimePolicies(prev => [...prev, ...response.success.time_policies]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("timePolicies.fetchError", "Failed to fetch time policies"));
            }
        } catch (error) {
            toast.error(t("timePolicies.fetchError", "Failed to fetch time policies"));
        } finally {
            setIsLoadingMore(false);
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchTimePolicies();
    }, []);

    // Handle delete confirmation
    const handleDeleteConfirm = (policy: TimePolicy) => {
        setPolicyToDelete(policy);
        setDeleteModalOpen(true);
    };

    // Handle open create modal
    const handleOpenCreateModal = () => {
        setPolicyModalMode('create');
        setPolicyToEdit(null);
        setIsModalOpen(true);
    };

    // Handle open edit modal
    const handleOpenEditModal = (policy: TimePolicy) => {
        setPolicyModalMode('edit');
        setPolicyToEdit(policy);
        setIsModalOpen(true);
    };

    // Render actions for table
    const renderTableActions = (policy: TimePolicy) => {
        return (
            <CustomActionsDropdown
                items={[
                    {
                        label: t("common.edit", "Edit"),
                        icon: "edit",
                        onClick: () => handleOpenEditModal(policy),
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
            const response = await deleteTimePolicy(orgId, policyToDelete.id);
            if (response.success) {
                toast.success(t("timePolicies.policyDeleted", "Time policy deleted successfully"));
                setTimePolicies(prev => prev.filter(p => p.id !== policyToDelete.id));
            } else {
                toast.error(t("timePolicies.errorDeletingPolicy", "Error deleting time policy"));
            }
        } catch (error) {
            toast.error(t("timePolicies.errorDeletingPolicy", "Error deleting time policy"));
        } finally {
            setDeletingPolicy(false);
            setDeleteModalOpen(false);
            setPolicyToDelete(null);
        }
    };

    const handleRowClick = (policy: TimePolicy) => {
        navigate(`${policy.id}`);
    };

    const handleEditModalClose = () => {
        setIsModalOpen(false);
        setDeleteModalOpen(false);
    };

    const handleTimePolicyCreatedOrUpdated = () => {
        fetchTimePolicies();
        handleEditModalClose();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                title={t("timePolicies.title", "Time Policies")}
                description={t("timePolicies.description", "Manage time policies, time slots and overtime rules.")}
                showBackButton={true}
                docs={{ slug: "pd_admin_time_policies" }}
                action={
                    <Button onClick={handleOpenCreateModal}>
                        <Plus className="h-4 w-4" />
                        {t("timePolicies.addPolicy", "New policy")}
                    </Button>
                }
            />

            <SearchBar
                value={searchQuery}
                className="w-full"
                isLoading={isSearching}
                onChange={(query) => setSearchQuery(query)}
                onSearch={fetchTimePolicies}
                placeholder={t("timePolicies.searchPlaceholder", "Search time policies...")}
            />

            <div className="flex justify-end">
                <TimePolicyColumnSelector
                    columnVisibility={columnVisibility}
                    columnOrder={columnOrder}
                    onColumnVisibilityChange={handleColumnVisibilityChange}
                    onColumnOrderChange={handleColumnOrderChange}
                    onReset={resetPreferences}
                />
            </div>

            {/* Time Policies Table */}
            <TimePoliciesTable
                data={timePolicies}
                isLoading={isLoading}
                renderActions={renderTableActions}
                onRowClick={handleRowClick}
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
            {nextPageToken && (
                <div className="flex justify-center mt-6">
                    <Button
                        variant="outline"
                        onClick={loadMoreTimePolicies}
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

            {/* Time Policy New/Edit Modal */}
            <TimePolicyEditModal
                open={isModalOpen}
                onOpenChange={handleEditModalClose}
                onTimePolicyCreatedOrUpdated={handleTimePolicyCreatedOrUpdated}
                orgId={orgId!}
                mode={policyModalMode}
                policy={policyToEdit ?? undefined}
                renderActions={
                    policyModalMode === 'edit' && policyToEdit
                        ? () => (
                              <CustomActionsDropdown
                                  items={[
                                      {
                                          label: t("common.delete", "Delete"),
                                          icon: "trash-2",
                                          onClick: () => {
                                              setIsModalOpen(false);
                                              setTimeout(() => {
                                                  handleDeleteConfirm(policyToEdit);
                                              }, 100);
                                          },
                                          variant: "destructive",
                                      },
                                  ]}
                              />
                          )
                        : undefined
                }
            />

            {/* Delete Confirmation Dialog */}
            <TimePolicyDeleteModal
                open={deleteModalOpen}
                onOpenChange={(open) => {
                    setDeleteModalOpen(open);
                    if (!open) {
                        setPolicyToDelete(null);
                        setDeletingPolicy(false);
                    }
                }}
                policy={policyToDelete}
                onConfirm={handleDeletePolicy}
                isDeleting={deletingPolicy}
            />
        </div>
    );
};

const TimePoliciesPage = () => {
    return <TimePoliciesContent />;
};

export default TimePoliciesPage;

