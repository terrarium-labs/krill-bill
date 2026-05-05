import { useTranslation } from "react-i18next";
import PageHeader from "@/app/components/page-header";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router";
import { AuditLog } from "@/types/general/audit_logs";
import { getOrgAuditLogs } from "@/api/orgs/orgs";
import { toast } from "sonner";
import SearchBar from "@/app/components/search-bar";
import { fetchLocationFromIp } from "@/utils/ip-geolocation";
import { IpLocationData } from "@/types/general/location";
import TableFiltersRow from "@/app/components/table-filters/table-filters";
import LogsTable from "@/app/admin/pages/LogsPage/components/logs-table";
import LogDetailsDrawer from "@/app/admin/pages/LogsPage/components/log-details-drawer";
import { useTableFilters } from "@/hooks/use-table-filters";
import { useLogsTablePreferences } from "@/hooks/use-logs-table-preferences";
import { LogsColumnSelector } from "@/app/admin/pages/LogsPage/components/logs-column-selector";

const LogsPage = () => {
  const { t } = useTranslation();
  const { orgId } = useParams<{ orgId: string }>();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  const {
    columnVisibility,
    setColumnVisibility,
    columnOrder,
    setColumnOrder,
    columnSizing,
    setColumnSizing,
    resetPreferences,
  } = useLogsTablePreferences();

  const handleColumnVisibilityChange = useCallback(
    (id: string, visible: boolean) =>
      setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
    [setColumnVisibility],
  );
  const handleColumnOrderChange = useCallback(
    (order: string[]) => setColumnOrder(order),
    [setColumnOrder],
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [ipLocationMap, setIpLocationMap] = useState<Record<string, IpLocationData>>({});
  
  // Use the table filters hook with session storage (no default filters)
  const { tableFilters, setTableFilters } = useTableFilters();

  // Fetch audit logs function
  const fetchLogs = async (query: string = "") => {
    if (query) {
      setIsSearching(true);
    } else {
      setIsLoading(true);
    }
    if (!orgId) return;

    try {
      const response = await getOrgAuditLogs(
        orgId,
        query || undefined,
        undefined,
        tableFilters || undefined
      );
      if (response.success && response.success.audit_logs) {
        setLogs(response.success.audit_logs);
        setNextPageToken(response.success.next_page_token || null);
        if (!tableFilters) {
          setTableFilters(response.success.params);
        }
      } else {
        toast.error(t("admin.logs.errorFetchingLogs") || "Error fetching logs");
      }
    } catch (error) {
      toast.error(t("admin.logs.errorFetchingLogs") || "Error fetching logs");
    } finally {
      setIsSearching(false);
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (orgId) {
      fetchLogs();
    }
  }, [orgId]);

  // Load more logs
  const loadMoreLogs = async () => {
    if (!orgId || !nextPageToken || loadingMore || isLoading) return;

    setLoadingMore(true);
    try {
      const response = await getOrgAuditLogs(
        orgId,
        searchQuery || undefined,
        nextPageToken,
        tableFilters || undefined
      );
      if (response.success && response.success.audit_logs) {
        setLogs(prev => [...prev, ...response.success.audit_logs]);
        setNextPageToken(response.success.next_page_token || null);
      } else {
        toast.error(t("admin.logs.errorFetchingLogs") || "Error fetching logs");
      }
    } catch (error) {
      toast.error(t("admin.logs.errorFetchingLogs") || "Error fetching logs");
    } finally {
      setLoadingMore(false);
    }
  };

  // Open log details drawer
  const openLogDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDrawerOpen(true);
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("common.copiedToClipboard", "Copied to clipboard"));
  };

  // Fetch locations for all IPs in current logs
  useEffect(() => {
    const fetchLocations = async () => {
      for (const log of logs) {
        if (log.ip_address && !ipLocationMap[log.ip_address]) {
          const locationData = await fetchLocationFromIp(log.ip_address);
          if (locationData) {
            setIpLocationMap(prev => ({
              ...prev,
              [log.ip_address]: locationData
            }));
          }
        }
      }
    };

    fetchLocations();
  }, [logs]);

  // Get status color
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "green";
    if (status >= 300 && status < 400) return "orange";
    if (status >= 400 && status < 500) return "red";
    if (status >= 500) return "red";
    return "gray";
  };

  // Get method color
  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case "GET": return "blue";
      case "POST": return "yellow";
      case "PATCH": return "orange";
      case "PUT": return "orange";
      case "DELETE": return "red";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("admin.logs.title", "Audit Logs")}
        description={t("admin.logs.description", "View all API requests and responses.")}
        docs={{ slug: "pd_admin_logs" }}
      />

      <SearchBar
        value={searchQuery}
        isLoading={isSearching}
        onChange={(query) => setSearchQuery(query)}
        onSearch={fetchLogs}
        placeholder={t("admin.logs.searchPlaceholder", "Search logs...")}
      />

      {/* Filters */}
      {tableFilters && (
        <TableFiltersRow
          value={tableFilters}
          onChange={(filters) => setTableFilters(filters)}
          onFilter={(_) => fetchLogs(searchQuery)}
          endSlot={
            <LogsColumnSelector
              columnVisibility={columnVisibility}
              columnOrder={columnOrder}
              onColumnVisibilityChange={handleColumnVisibilityChange}
              onColumnOrderChange={handleColumnOrderChange}
              onReset={resetPreferences}
            />
          }
        />
      )}

      <LogsTable
        logs={logs}
        isLoading={isLoading}
        loadingMore={loadingMore}
        hasMore={!!nextPageToken}
        searchQuery={searchQuery}
        ipLocationMap={ipLocationMap}
        onRowClick={openLogDetails}
        onLoadMore={loadMoreLogs}
        getStatusColor={getStatusColor}
        getMethodColor={getMethodColor}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
        columnSizing={columnSizing}
        onColumnSizingChange={setColumnSizing}
      />

      <LogDetailsDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        log={selectedLog}
        ipLocationMap={ipLocationMap}
        getStatusColor={getStatusColor}
        getMethodColor={getMethodColor}
        onCopy={copyToClipboard}
      />
    </div>
  );
};

export default LogsPage;