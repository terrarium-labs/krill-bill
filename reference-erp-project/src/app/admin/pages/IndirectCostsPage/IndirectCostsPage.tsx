import PageHeader from "@/app/components/page-header";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router";
import { Loader2, Plus } from "lucide-react";
import SearchBar from "@/app/components/search-bar";
import {
  getOrgIndirectCosts,
  deleteOrgIndirectCost,
} from "@/api/orgs/indirect-costs/indirect-costs";
import { IndirectCost } from "@/types/financials/indirect-costs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useOrg } from "@/app/contexts/OrgContext";
import CURRENCIES from "@/utils/currencies";
import IndirectCostsTable from "./components/indirect-costs-table";
import IndirectCostEditModal from "./components/indirect-cost-edit-modal";
import IndirectCostDeleteModal from "./components/indirect-cost-delete-modal";
import { useIndirectCostsTablePreferences } from "@/hooks/use-indirect-costs-table-preferences";
import { IndirectCostsColumnSelector } from "./components/indirect-costs-column-selector";

const IndirectCostsPage = () => {
  const { t } = useTranslation();
  const { orgId } = useParams<{ orgId: string }>();
  const { org } = useOrg();
  const [indirectCosts, setIndirectCosts] = useState<IndirectCost[]>([]);

  const {
    columnVisibility,
    setColumnVisibility,
    columnOrder,
    setColumnOrder,
    columnSizing,
    setColumnSizing,
    resetPreferences,
  } = useIndirectCostsTablePreferences();

  const handleColumnVisibilityChange = useCallback(
    (id: string, visible: boolean) =>
      setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
    [setColumnVisibility],
  );
  const handleColumnOrderChange = useCallback(
    (order: string[]) => setColumnOrder(order),
    [setColumnOrder],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingIndirectCost, setEditingIndirectCost] = useState<IndirectCost | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingIndirectCost, setDeletingIndirectCost] = useState<IndirectCost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const currencySymbol = CURRENCIES.find((c) => c.code === org?.currency)?.symbol || "€";

  const fetchIndirectCosts = async (query: string = "", pageToken?: string | null) => {
    if (!orgId) return;

    if (query) {
      setIsSearching(true);
    } else if (!pageToken) {
      setIsLoading(true);
    }

    try {
      const response = await getOrgIndirectCosts(orgId, "work_orders", query || undefined, pageToken);
      if (response.success?.indirect_costs) {
        if (pageToken) {
          setIndirectCosts(prev => [...prev, ...response.success.indirect_costs]);
        } else {
          setIndirectCosts(response.success.indirect_costs);
        }
        setNextPageToken(response.success.next_page_token || null);
      }
    } catch (error) {
      console.error("Error fetching indirect costs:", error);
      toast.error(t("settings.indirectCosts.fetchError", "Failed to load indirect costs"));
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const loadMoreIndirectCosts = async () => {
    if (!nextPageToken || loadingMore || isLoading) return;

    setLoadingMore(true);
    try {
      await fetchIndirectCosts(searchQuery, nextPageToken);
    } catch (error) {
      console.error("Error loading more indirect costs:", error);
      toast.error(t("settings.indirectCosts.fetchError", "Failed to load indirect costs"));
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchIndirectCosts();
  }, [orgId]);

  const handleCreate = useCallback(() => {
    setEditingIndirectCost(null);
    setEditModalOpen(true);
  }, []);

  const handleEdit = useCallback((indirectCost: IndirectCost) => {
    setEditingIndirectCost(indirectCost);
    setEditModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((indirectCost: IndirectCost) => {
    setDeletingIndirectCost(indirectCost);
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!orgId || !deletingIndirectCost) return;

    setIsDeleting(true);
    try {
      const response = await deleteOrgIndirectCost(orgId, deletingIndirectCost.id);
      if (response.success !== undefined) {
        toast.success(t("settings.indirectCosts.deletedSuccess", "Indirect cost deleted successfully"));
        setIndirectCosts(prev => prev.filter(ic => ic.id !== deletingIndirectCost.id));
        setDeleteModalOpen(false);
        setDeletingIndirectCost(null);
      } else {
        toast.error(response.error || t("settings.indirectCosts.deleteError", "Failed to delete indirect cost"));
      }
    } catch (error) {
      console.error("Error deleting indirect cost:", error);
      toast.error(t("settings.indirectCosts.deleteError", "Failed to delete indirect cost"));
    } finally {
      setIsDeleting(false);
    }
  }, [orgId, deletingIndirectCost, t]);

  const handleSuccess = useCallback(() => {
    fetchIndirectCosts(searchQuery);
  }, [searchQuery]);

  return (
    <>
      <PageHeader
        title={t("settings.indirectCosts.title", "Indirect Costs")}
        description={t(
          "settings.indirectCosts.pageDescription",
          "Manage indirect costs for work orders in your organization"
        )}
        showBackButton={true}
        docs={{ slug: "pd_admin_indirect_costs" }}
        action={
          <div className="flex items-center gap-2">
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4" />
              {t("settings.indirectCosts.create", "New Indirect Cost.")}
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
          onSearch={fetchIndirectCosts}
          placeholder={t("settings.indirectCosts.searchPlaceholder", "Search indirect costs...")}
        />
        <IndirectCostsColumnSelector
          columnVisibility={columnVisibility}
          columnOrder={columnOrder}
          onColumnVisibilityChange={handleColumnVisibilityChange}
          onColumnOrderChange={handleColumnOrderChange}
          onReset={resetPreferences}
        />
      </div>

      <IndirectCostsTable
        indirectCosts={indirectCosts}
        isLoading={isLoading}
        searchQuery={searchQuery}
        currencySymbol={currencySymbol}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
        columnSizing={columnSizing}
        onColumnSizingChange={setColumnSizing}
      />

      {nextPageToken && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={loadMoreIndirectCosts}
            disabled={loadingMore || isLoading}
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

      {/* Create/Edit Modal */}
      {orgId && (
        <IndirectCostEditModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onSuccess={handleSuccess}
          orgId={orgId}
          indirectCost={editingIndirectCost}
          mode={editingIndirectCost ? "update" : "create"}
          currencySymbol={currencySymbol}
        />
      )}

      {/* Delete Confirmation Modal */}
      <IndirectCostDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingIndirectCost(null);
        }}
        indirectCost={deletingIndirectCost}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default IndirectCostsPage;
