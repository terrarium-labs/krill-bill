import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnCallGroup } from "@/types/field-service/on-call/groups";
import {
  getOrgOnCallGroups,
  patchOrgOnCallGroup,
  deleteOrgOnCallGroup,
} from "@/api/field-service/on-call/groups/groups";
import SearchBar from "@/app/components/search-bar";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import OnCallGroupsTable from "./components/on-call-groups-table";
import OnCallGroupEditModal from "./components/on-call-group-edit-modal";
import OnCallGroupDeleteModal from "./components/on-call-group-delete-modal";
import OnCallGroupAddModal from "./components/on-call-group-add-modal";
import { toast } from "sonner";
import { useOnCallGroupsTablePreferences } from "@/hooks/use-on-call-groups-table-preferences";
import { OnCallGroupColumnSelector } from "./components/on-call-group-column-selector";

const OnCallPageGroups = () => {
  const { t } = useTranslation();
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();

  const [onCallGroups, setOnCallGroups] = useState<OnCallGroup[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<OnCallGroup | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<OnCallGroup | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const {
    columnVisibility,
    setColumnVisibility,
    columnOrder,
    setColumnOrder,
    columnSizing,
    setColumnSizing,
    resetPreferences,
  } = useOnCallGroupsTablePreferences();

  const handleColumnVisibilityChange = useCallback(
    (id: string, visible: boolean) =>
      setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
    [setColumnVisibility],
  );
  const handleColumnOrderChange = useCallback(
    (order: string[]) => setColumnOrder(order),
    [setColumnOrder],
  );

  const fetchGroups = async (query: string = "") => {
    if (query) {
      setIsSearching(true);
    } else {
      setIsLoading(true);
    }
    if (!orgId) return;

    try {
      const response = await getOrgOnCallGroups(orgId, query || undefined, undefined);
      const groups =
        (response.success as { on_call_groups?: OnCallGroup[] })?.on_call_groups ??
        (response.success as { groups?: OnCallGroup[] })?.groups;
      if (response.success && groups) {
        setOnCallGroups(groups);
        setNextPageToken((response.success as { next_page_token?: string }).next_page_token ?? null);
      } else {
        toast.error(t("on-call.errorLoadingGroups", "Error loading groups"));
      }
    } catch (error) {
      console.error("Error fetching on-call groups:", error);
      toast.error(t("on-call.errorLoadingGroups", "Error loading groups"));
    } finally {
      setIsSearching(false);
      setIsLoading(false);
    }
  };

  const loadMoreGroups = async () => {
    if (!orgId || !nextPageToken || loadingMore || isLoading) return;

    setLoadingMore(true);
    try {
      const response = await getOrgOnCallGroups(orgId, searchQuery || undefined, nextPageToken);
      const groups =
        (response.success as { on_call_groups?: OnCallGroup[] })?.on_call_groups ??
        (response.success as { groups?: OnCallGroup[] })?.groups;
      if (response.success && groups) {
        setOnCallGroups((prev) => [...prev, ...groups]);
        setNextPageToken((response.success as { next_page_token?: string }).next_page_token ?? null);
      } else {
        toast.error(t("on-call.errorLoadingGroups", "Error loading groups"));
      }
    } catch (error) {
      console.error("Error fetching on-call groups:", error);
      toast.error(t("on-call.errorLoadingGroups", "Error loading groups"));
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (orgId) {
      fetchGroups();
    }
  }, [orgId]);

  const handleRowClick = useCallback(
    (group: OnCallGroup) => {
      if (orgId) navigate(`/${orgId}/on-call/groups/${group.id}`);
    },
    [orgId, navigate]
  );

  const handleSave = useCallback(
    async (group: OnCallGroup, updates: { name: string; description: string; color: string }): Promise<boolean> => {
      if (!orgId) return false;
      const response = await patchOrgOnCallGroup(orgId, group.id, {
        name: updates.name,
        description: updates.description || null,
        color: updates.color,
      });
      if (response.error) {
        toast.error(t("on-call.groups.errorUpdatingGroup", "Error updating group"));
        return false;
      }
      setOnCallGroups((prev) =>
        prev.map((g) =>
          g.id === group.id
            ? { ...g, name: updates.name, description: updates.description || null, color: updates.color }
            : g
        )
      );
      setEditingGroup((prev) =>
        prev?.id === group.id
          ? { ...prev, name: updates.name, description: updates.description || null, color: updates.color }
          : prev
      );
      toast.success(t("on-call.groups.groupUpdated", "Group updated"));
      return true;
    },
    [orgId, t]
  );

  const handleDeleteClick = useCallback((group: OnCallGroup) => {
    setGroupToDelete(group);
    setEditModalOpen(false);
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!groupToDelete || !orgId) return;
    setIsDeleting(true);
    try {
      const response = await deleteOrgOnCallGroup(orgId, groupToDelete.id);
      if (response.error) {
        toast.error(t("on-call.groups.errorDeletingGroup", "Error deleting group"));
        return;
      }
      setOnCallGroups((prev) => prev.filter((g) => g.id !== groupToDelete.id));
      setGroupToDelete(null);
      setDeleteModalOpen(false);
      toast.success(t("on-call.groups.groupDeleted", "Group deleted"));
    } finally {
      setIsDeleting(false);
    }
  }, [groupToDelete, orgId, t]);

  const renderActions = useCallback(
    (group: OnCallGroup) => (
      <CustomActionsDropdown
        items={[
          {
            label: t("common.view", "View"),
            icon: "eye",
            onClick: () => handleRowClick(group),
          },
          {
            label: t("common.edit", "Edit"),
            icon: "pencil",
            onClick: () => {
              setEditingGroup(group);
              setEditModalOpen(true);
            },
          },
          {
            label: t("common.delete", "Delete"),
            icon: "trash-2",
            onClick: () => handleDeleteClick(group),
            variant: "destructive",
          },
        ]}
      />
    ),
    [t, handleRowClick, handleDeleteClick]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <SearchBar
          value={searchQuery}
          onChange={(query) => setSearchQuery(query)}
          onSearch={fetchGroups}
          isLoading={isSearching}
          placeholder={t("on-call.groups.searchGroupsPlaceholder", "Search groups...")}
          className="flex-1"
        />
        <OnCallGroupColumnSelector
          columnVisibility={columnVisibility}
          columnOrder={columnOrder}
          onColumnVisibilityChange={handleColumnVisibilityChange}
          onColumnOrderChange={handleColumnOrderChange}
          onReset={resetPreferences}
        />
        <Button onClick={() => setAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          {t("on-call.groups.addGroup", "Add Group")}
        </Button>
      </div>

      <OnCallGroupsTable
        groups={onCallGroups}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onAddGroup={undefined}
        renderActions={renderActions}
        onRowClick={handleRowClick}
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
            onClick={loadMoreGroups}
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

      <OnCallGroupEditModal
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) setEditingGroup(null);
        }}
        group={editingGroup}
        onSave={handleSave}
        renderActions={(group) => (
          <CustomActionsDropdown
            size="sm"
            items={[
              {
                label: t("common.delete", "Delete"),
                icon: "trash-2",
                onClick: () => handleDeleteClick(group),
                variant: "destructive",
              },
            ]}
          />
        )}
      />

      <OnCallGroupAddModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onGroupCreated={fetchGroups}
      />

      <OnCallGroupDeleteModal
        open={deleteModalOpen}
        onOpenChange={(open) => {
          setDeleteModalOpen(open);
          if (!open) setGroupToDelete(null);
        }}
        group={groupToDelete}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default OnCallPageGroups;
