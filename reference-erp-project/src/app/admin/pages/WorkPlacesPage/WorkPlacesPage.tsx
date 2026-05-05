import { useTranslation } from "react-i18next";
import PageHeader from "@/app/components/page-header";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "react-router";
import WorkplaceEditModal from "./components/workplace-edit-modal";
import SearchBar from "@/app/components/search-bar";
import { getWorkplaces, deleteWorkplace } from "@/api/orgs/workplaces/workplaces";
import { Workplace } from "@/types/general/workplaces";
import { WorkplacesTable } from "./components/workplaces-table";
import WorkplaceDeleteModal from "./components/workplace-delete-modal";
import TableFiltersRow from "@/app/components/table-filters/table-filters";
import { useTableFilters } from "@/hooks/use-table-filters";
import { CustomActionsDropdown } from "@/app/components/custom-actions-dropdown";
import { useWorkplacesTablePreferences } from "@/hooks/use-workplaces-table-preferences";
import { WorkplaceColumnSelector } from "./components/workplace-column-selector";

const WorkplacesPage = () => {
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
  } = useWorkplacesTablePreferences();

  const handleColumnVisibilityChange = useCallback(
    (id: string, visible: boolean) => setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
    [setColumnVisibility],
  );
  const handleColumnOrderChange = useCallback((order: string[]) => setColumnOrder(order), [setColumnOrder]);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newWorkplaceModalOpen, setNewWorkplaceModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [workplaceToDelete, setWorkplaceToDelete] = useState<Workplace | null>(null);
  const [deletingWorkplace, setDeletingWorkplace] = useState(false);
  
  // Use the table filters hook with session storage (no default filters)
  const { tableFilters, setTableFilters } = useTableFilters();

  // Fetch workplaces function
  const fetchWorkplaces = async (query: string = "") => {
    if (query) {
      setIsSearching(true);
    } else {
      setIsLoading(true);
    }
    if (!orgId) return;

    try {
      const response = await getWorkplaces(orgId, query || null, null, tableFilters || null);
      if (response.success && response.success.workplaces) {
        setWorkplaces(response.success.workplaces);
        setNextPageToken(response.success.next_page_token || null);
        if (!tableFilters) {
          setTableFilters(response.success.params);
        }
      } else {
        toast.error(t("admin.workplaces.errorFetchingWorkplaces") || "Error fetching workplaces");
      }
    } catch (error) {
      toast.error(t("admin.workplaces.errorFetchingWorkplaces") || "Error fetching workplaces");
    } finally {
      setIsSearching(false);
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (orgId) {
      fetchWorkplaces();
    }
  }, [orgId]);

  // Load more workplaces
  const loadMoreWorkplaces = async () => {
    if (!orgId || !nextPageToken || loadingMore || isLoading) return;

    setLoadingMore(true);
    try {
      const response = await getWorkplaces(orgId, searchQuery, nextPageToken, tableFilters || null);
      if (response.success && response.success.workplaces) {
        setWorkplaces(prev => [...prev, ...response.success.workplaces]);
        setNextPageToken(response.success.next_page_token || null);
      } else {
        toast.error(t("admin.workplaces.errorFetchingWorkplaces") || "Error fetching workplaces");
      }
    } catch (error) {
      toast.error(t("admin.workplaces.errorFetchingWorkplaces") || "Error fetching workplaces");
    } finally {
      setLoadingMore(false);
      setIsLoading(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback((workplace: Workplace) => {
    setWorkplaceToDelete(workplace);
    setDeleteModalOpen(true);
  }, []);

  // Define renderActions for table rows
  const renderActions = useCallback((workplace: Workplace) => {
    return (
      <CustomActionsDropdown
        items={[
          {
            label: t("common.delete", "Delete"),
            icon: "trash-2",
            onClick: () => handleDeleteConfirm(workplace),
            variant: "destructive",
          },
        ]}
      />
    );
  }, [t, handleDeleteConfirm]);

  // Handle delete execution
  const handleDeleteWorkplace = async () => {
    if (!workplaceToDelete || !orgId) return;

    setDeletingWorkplace(true);
    try {
      const response = await deleteWorkplace(orgId, workplaceToDelete.id);
      if (response.success) {
        toast.success(t("admin.workplaces.workplaceDeleted", "Workplace deleted successfully"));
        // Remove from local state
        setWorkplaces(prev => prev.filter(w => w.id !== workplaceToDelete.id));
      } else {
        toast.error(t("admin.workplaces.errorDeletingWorkplace", "Error deleting workplace"));
      }
    } catch (error) {
      toast.error(t("admin.workplaces.errorDeletingWorkplace", "Error deleting workplace"));
    } finally {
      setDeletingWorkplace(false);
      setDeleteModalOpen(false);
      setWorkplaceToDelete(null);
    }
  };


  return (
    <>
      {/* Header */}
      <PageHeader
        title={t("admin.workplaces.title", "Workplaces")}
        description={t(
          "admin.workplaces.description",
          "Set and manage your organization's workplaces."
        )}
        docs={{ slug: "pd_admin_workplaces" }}
        action={
          <div className="flex items-center gap-2">
            <Button onClick={() => setNewWorkplaceModalOpen(true)}>
              <Plus className="h-4 w-4" />
              {t("admin.workplaces.addWorkplace", "Add workplace")}
            </Button>
          </div>
        }
      />

      <SearchBar
        value={searchQuery}
        isLoading={isSearching}
        onChange={(query) => setSearchQuery(query)}
        onSearch={fetchWorkplaces}
        placeholder={t("admin.workplaces.searchPlaceholder", "Search workplaces...")}
      />

      {/* Filters */}
      {tableFilters && (
        <TableFiltersRow
          value={tableFilters}
          onChange={(filters) => setTableFilters(filters)}
          onFilter={(_) => fetchWorkplaces(searchQuery)}
          endSlot={
            <WorkplaceColumnSelector
              columnVisibility={columnVisibility}
              columnOrder={columnOrder}
              onColumnVisibilityChange={handleColumnVisibilityChange}
              onColumnOrderChange={handleColumnOrderChange}
              onReset={resetPreferences}
            />
          }
        />
      )}

      {/* Workplaces Table */}
      <WorkplacesTable
        workplaces={workplaces}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onAddWorkplace={() => setNewWorkplaceModalOpen(true)}
        renderActions={renderActions}
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
            onClick={loadMoreWorkplaces}
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

      <WorkplaceEditModal
        open={newWorkplaceModalOpen}
        onOpenChange={setNewWorkplaceModalOpen}
        onWorkplaceCreated={fetchWorkplaces}
        orgId={orgId!}
      />

      {/* Delete Confirmation Dialog */}
      <WorkplaceDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setWorkplaceToDelete(null);
        }}
        workplace={workplaceToDelete}
        onConfirm={handleDeleteWorkplace}
        isDeleting={deletingWorkplace}
      />
    </>
  );
};

export default WorkplacesPage;
