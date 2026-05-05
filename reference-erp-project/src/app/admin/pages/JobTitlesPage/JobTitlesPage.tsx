import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PageHeader from "@/app/components/page-header";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import SearchBar from "@/app/components/search-bar";
import { toast } from "sonner";
import JobTitleEditModal from "./components/job-title-edit-modal";
import { getOrgJobTitles, deleteOrgJobTitle } from '@/api/orgs/job-titles/job-titles';
import { JobTitle } from "@/types/general/job-titles";
import TableFiltersRow from "@/app/components/table-filters/table-filters";
import JobTitlesTable from "./components/job-titles-table";
import JobTitleDeleteModal from "./components/job-title-delete-modal";
import { useTableFilters } from "@/hooks/use-table-filters";
import { CustomActionsDropdown } from "@/app/components/custom-actions-dropdown";
import { useJobTitlesTablePreferences } from "@/hooks/use-job-titles-table-preferences";
import { JobTitleColumnSelector } from "./components/job-title-column-selector";

const JobTitlesPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = useJobTitlesTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) => setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback((order: string[]) => setColumnOrder(order), [setColumnOrder]);
    const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [jobTitleToDelete, setJobTitleToDelete] = useState<JobTitle | null>(null);
    const [deletingJobTitle, setDeletingJobTitle] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [newJobTitleModalOpen, setNewJobTitleModalOpen] = useState(false);
    const [editJobTitleModalOpen, setEditJobTitleModalOpen] = useState(false);
    const [jobTitleToEdit, setJobTitleToEdit] = useState<JobTitle | null>(null);
    
    // Use the table filters hook with session storage (no default filters)
    const { tableFilters, setTableFilters } = useTableFilters();

    // Fetch job titles function
    const fetchJobTitles = async (query: string = "") => {
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        if (!orgId) return;

        try {
            const response = await getOrgJobTitles(orgId, query || undefined, undefined, tableFilters || undefined);
            if (response.success && response.success.job_titles) {
                setJobTitles(response.success.job_titles);
                setNextPageToken(response.success.next_page_token || null);
                if (!tableFilters) {
                    setTableFilters(response.success.params);
                }
            } else {
                toast.error(t("admin.jobTitles.errorFetchingJobTitles") || "Error fetching job titles");
            }
        } catch (error) {
            toast.error(t("admin.jobTitles.errorFetchingJobTitles") || "Error fetching job titles");
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchJobTitles();
    }, []);

    // Load more job titles
    const loadMoreJobTitles = async () => {
        if (!orgId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getOrgJobTitles(orgId, searchQuery || undefined, nextPageToken, tableFilters || undefined);
            if (response.success && response.success.job_titles) {
                setJobTitles(prev => [...prev, ...response.success.job_titles]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("admin.jobTitles.errorFetchingJobTitles") || "Error fetching job titles");
            }
        } catch (error) {
            toast.error(t("admin.jobTitles.errorFetchingJobTitles") || "Error fetching job titles");
        } finally {
            setLoadingMore(false);
            setIsLoading(false);
        }
    };

    // Handle edit job title
    const handleEditJobTitle = useCallback((jobTitle: JobTitle) => {
        setJobTitleToEdit(jobTitle);
        setEditJobTitleModalOpen(true);
    }, []);

    // Handle delete confirmation
    const handleDeleteConfirm = useCallback((jobTitle: JobTitle) => {
        setJobTitleToDelete(jobTitle);
        setDeleteModalOpen(true);
    }, []);

    // Define renderActions for table rows
    const renderActions = useCallback((jobTitle: JobTitle) => {
        return (
            <CustomActionsDropdown
                items={[
                    {
                        label: t("common.edit", "Edit"),
                        icon: "edit",
                        onClick: () => handleEditJobTitle(jobTitle),
                    },
                    {
                        label: t("common.delete", "Delete"),
                        icon: "trash-2",
                        onClick: () => handleDeleteConfirm(jobTitle),
                        variant: "destructive",
                    },
                ]}
            />
        );
    }, [t, handleEditJobTitle, handleDeleteConfirm]);

    // Handle delete execution
    const handleDeleteJobTitle = async () => {
        if (!jobTitleToDelete || !orgId) return;

        setDeletingJobTitle(true);
        try {
            const response = await deleteOrgJobTitle(orgId, jobTitleToDelete.id);
            if (response.success) {
                toast.success(t("admin.jobTitles.jobTitleDeleted", "Job title deleted successfully"));
                // Remove from local state
                setJobTitles(prev => prev.filter(g => g.id !== jobTitleToDelete.id));
            } else {
                toast.error(t("admin.jobTitles.errorDeletingJobTitle", "Error deleting job title"));
            }
        } catch (error) {
            toast.error(t("admin.jobTitles.errorDeletingJobTitle", "Error deleting job title"));
        } finally {
            setDeletingJobTitle(false);
            setDeleteModalOpen(false);
            setJobTitleToDelete(null);
        }
    };

    // Navigate to job title detail
    const handleViewJobTitle = (jobTitleId: string) => {
        navigate(`/${orgId}/admin/job-titles/${jobTitleId}`);
    };

    return (
        <>
            {/* Header */}
            <PageHeader
                title={t("admin.jobTitles.title", "Job Titles")}
                description={t("admin.jobTitles.description", "Manage your organization's job titles.")}
                docs={{ slug: "pd_admin_job_titles" }}
                action={
                    <div className="flex items-center gap-2">
                        <Button onClick={() => setNewJobTitleModalOpen(true)}>
                            <Plus className="h-4 w-4" />
                            {t("admin.jobTitles.addJobTitle", "Add Job Title")}
                        </Button>
                    </div>
                }
            />

            <SearchBar
                value={searchQuery}
                isLoading={isSearching}
                onChange={(query) => setSearchQuery(query)}
                onSearch={fetchJobTitles}
                placeholder={t("admin.jobTitles.searchPlaceholder", "Search job titles...")}
            />

            {/* Filters */}
            {tableFilters && (
                <TableFiltersRow
                    value={tableFilters}
                    onChange={(filters) => setTableFilters(filters)}
                    onFilter={(_) => fetchJobTitles(searchQuery)}
                    endSlot={
                        <JobTitleColumnSelector
                            columnVisibility={columnVisibility}
                            columnOrder={columnOrder}
                            onColumnVisibilityChange={handleColumnVisibilityChange}
                            onColumnOrderChange={handleColumnOrderChange}
                            onReset={resetPreferences}
                        />
                    }
                />
            )}

            <JobTitlesTable
                jobTitles={jobTitles}
                isLoading={isLoading}
                loadingMore={loadingMore}
                hasMore={!!nextPageToken}
                searchQuery={searchQuery}
                onRowClick={handleViewJobTitle}
                onLoadMore={loadMoreJobTitles}
                onAddJobTitle={() => setNewJobTitleModalOpen(true)}
                renderActions={renderActions}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                columnOrder={columnOrder}
                onColumnOrderChange={setColumnOrder}
                columnSizing={columnSizing}
                onColumnSizingChange={setColumnSizing}
            />

            <JobTitleEditModal
                open={newJobTitleModalOpen}
                onOpenChange={setNewJobTitleModalOpen}
                onJobTitleCreated={fetchJobTitles}
            />

            <JobTitleEditModal
                open={editJobTitleModalOpen}
                onOpenChange={(open) => {
                    setEditJobTitleModalOpen(open);
                    if (!open) {
                        setJobTitleToEdit(null);
                    }
                }}
                onJobTitleCreated={fetchJobTitles}
                jobTitleToEdit={jobTitleToEdit}
                mode="edit"
            />

            <JobTitleDeleteModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                jobTitle={jobTitleToDelete}
                deleting={deletingJobTitle}
                onConfirm={handleDeleteJobTitle}
            />
        </>
    );
};

export default JobTitlesPage;

