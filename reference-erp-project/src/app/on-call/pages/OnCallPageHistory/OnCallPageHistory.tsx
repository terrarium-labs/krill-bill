import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnCallConfig } from "@/types/field-service/on-call/configs";
import {
  getOrgOnCallConfigs,
  postOrgOnCallConfigs,
  patchOrgOnCallConfig,
} from "@/api/field-service/on-call/configs/configs";
import SearchBar from "@/app/components/search-bar";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import OnCallHistoryTable from "./components/on-call-history-table";
import { toast } from "sonner";
import OnCallHistoryEditModal from "./components/on-call-history-edit-modal";
import { useOnCallHistoryTablePreferences } from "@/hooks/use-on-call-history-table-preferences";
import { OnCallHistoryColumnSelector } from "./components/on-call-history-column-selector";

const OnCallPageHistory = () => {
  const { t } = useTranslation();
  const { orgId } = useParams<{ orgId: string }>();

  const [configs, setConfigs] = useState<OnCallConfig[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<OnCallConfig | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    columnVisibility,
    setColumnVisibility,
    columnOrder,
    setColumnOrder,
    columnSizing,
    setColumnSizing,
    resetPreferences,
  } = useOnCallHistoryTablePreferences();

  const handleColumnVisibilityChange = useCallback(
    (id: string, visible: boolean) =>
      setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
    [setColumnVisibility],
  );
  const handleColumnOrderChange = useCallback(
    (order: string[]) => setColumnOrder(order),
    [setColumnOrder],
  );

  const fetchConfigs = useCallback(
    async (query: string = "", pageToken?: string | null) => {
      if (query) {
        setIsSearching(true);
      } else if (!pageToken) {
        setIsLoading(true);
      }
      if (!orgId) return;

      try {
        const response = await getOrgOnCallConfigs(
          orgId,
          query || undefined,
          pageToken ?? undefined
        );
        const data = response.success as {
          on_call_configs?: OnCallConfig[];
          configs?: OnCallConfig[];
          next_page_token?: string;
        };
        const list = data?.on_call_configs ?? data?.configs ?? [];
        if (response.success && Array.isArray(list)) {
          if (pageToken) {
            setConfigs((prev) => [...prev, ...list]);
          } else {
            setConfigs(list);
          }
          setNextPageToken(data?.next_page_token ?? null);
        } else {
          toast.error(t("on-call.configs.errorLoading", "Error loading configs"));
        }
      } catch (error) {
        console.error("Error fetching on-call configs:", error);
        toast.error(t("on-call.configs.errorLoading", "Error loading configs"));
      } finally {
        setIsSearching(false);
        setIsLoading(false);
      }
    },
    [orgId, t]
  );

  const loadMoreConfigs = useCallback(async () => {
    if (!orgId || !nextPageToken || loadingMore || isLoading) return;

    setLoadingMore(true);
    try {
      const response = await getOrgOnCallConfigs(
        orgId,
        searchQuery || undefined,
        nextPageToken
      );
      const data = response.success as {
        on_call_configs?: OnCallConfig[];
        configs?: OnCallConfig[];
        next_page_token?: string;
      };
      const list = data?.on_call_configs ?? data?.configs ?? [];
      if (response.success && Array.isArray(list)) {
        setConfigs((prev) => [...prev, ...list]);
        setNextPageToken(data?.next_page_token ?? null);
      } else {
        toast.error(t("on-call.configs.errorLoading", "Error loading configs"));
      }
    } catch (error) {
      console.error("Error fetching on-call configs:", error);
      toast.error(t("on-call.configs.errorLoading", "Error loading configs"));
    } finally {
      setLoadingMore(false);
    }
  }, [orgId, searchQuery, nextPageToken, loadingMore, isLoading, t]);

  useEffect(() => {
    if (orgId) {
      fetchConfigs();
    }
  }, [orgId]);

  const handleOpenCreate = useCallback(() => {
    setEditingConfig(null);
    setEditModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((config: OnCallConfig) => {
    setEditingConfig(config);
    setEditModalOpen(true);
  }, []);

  const handleSave = useCallback(
    async (
      config: OnCallConfig | null,
      payload: { resting_time_after_call: number; requirements: string }
    ): Promise<boolean> => {
      if (!orgId) return false;

      try {
        if (config) {
          const response = await patchOrgOnCallConfig(orgId, config.id, payload);
          if (response.error) {
            toast.error(t("on-call.configs.errorUpdating", "Error updating config"));
            return false;
          }
          const updated = (response.success as { on_call_config?: OnCallConfig })?.on_call_config
            ?? (response.success as { config?: OnCallConfig })?.config;
          if (updated) {
            setConfigs((prev) =>
              prev.map((c) => (c.id === config.id ? { ...c, ...updated } : c))
            );
          } else {
            setConfigs((prev) =>
              prev.map((c) =>
                c.id === config.id ? { ...c, ...payload } : c
              )
            );
          }
          toast.success(t("on-call.configs.configUpdated", "Config updated"));
        } else {
          const response = await postOrgOnCallConfigs(orgId, payload);
          if (response.error) {
            toast.error(t("on-call.configs.errorCreating", "Error creating config"));
            return false;
          }
          const created = (response.success as { on_call_config?: OnCallConfig })?.on_call_config
            ?? (response.success as { config?: OnCallConfig })?.config;
          if (created) {
            setConfigs((prev) => [created, ...prev]);
          }
          toast.success(t("on-call.configs.configCreated", "Config created"));
        }
        return true;
      } catch (error) {
        console.error("Error saving config:", error);
        toast.error(t("on-call.configs.errorSaving", "Error saving config"));
        return false;
      }
    },
    [orgId, t]
  );

  const renderActions = useCallback(
    (config: OnCallConfig) => (
      <CustomActionsDropdown
        items={[
          {
            label: t("common.edit", "Edit"),
            icon: "pencil",
            onClick: () => handleOpenEdit(config),
          },
        ]}
      />
    ),
    [t, handleOpenEdit]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <SearchBar
          value={searchQuery}
          onChange={(query) => setSearchQuery(query)}
          onSearch={(query) => fetchConfigs(query)}
          isLoading={isSearching}
          placeholder={t("on-call.configs.searchPlaceholder", "Search configs...")}
          className="flex-1"
        />
        <OnCallHistoryColumnSelector
          columnVisibility={columnVisibility}
          columnOrder={columnOrder}
          onColumnVisibilityChange={handleColumnVisibilityChange}
          onColumnOrderChange={handleColumnOrderChange}
          onReset={resetPreferences}
        />
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4" />
          {t("on-call.configs.addConfig", "Add Config")}
        </Button>
      </div>

      <OnCallHistoryTable
        configs={configs}
        isLoading={isLoading}
        searchQuery={searchQuery}
        renderActions={renderActions}
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
            onClick={loadMoreConfigs}
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

      <OnCallHistoryEditModal
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) setEditingConfig(null);
        }}
        config={editingConfig}
        onSave={handleSave}
      />
    </div>
  );
};

export default OnCallPageHistory;
