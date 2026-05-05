import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router";
import { AlertTriangle, Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import PageHeader from "@/app/components/page-header";
import SearchBar from "@/app/components/search-bar";
import TableFiltersRow from "@/app/components/table-filters/table-filters";
import { useTableFilters } from "@/hooks/use-table-filters";
import { getWorkOrders } from "@/api/field-service/work-orders/work-orders";
import { WorkOrder } from "@/types/field-service/work-orders/work-orders";
import { formatDate } from "@/utils/miscelanea";
import { MissionControlLiveClock } from "@/app/mission-control/components/mission-control-live-clock";
import OrdersPresetFilters, { type PresetFilterKey } from "./components/orders-preset-filters";
import OrdersGroupSelector, { type GroupByMode } from "./components/orders-group-selector";
import OrdersGroupedList from "./components/orders-grouped-list";
import OrdersAIInsightsSheet from "./components/orders-ai-insights-sheet";
import { StatusesProvider } from "@/app/contexts/StatusesContext";

function isOverdue(wo: WorkOrder): boolean {
    if (!wo.due_date) return false;
    const cat = wo.status?.category;
    if (cat === "done" || cat === "closed") return false;
    return new Date(wo.due_date) < new Date();
}

function isThisWeek(wo: WorkOrder): boolean {
    if (!wo.start_date) return false;
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(now.getDate() + diffToMonday);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const startDate = new Date(wo.start_date);
    return startDate >= weekStart && startDate < weekEnd;
}

function isUnassigned(wo: WorkOrder): boolean {
    return !wo.assignees || wo.assignees.length === 0;
}

function applyPresetFilters(orders: WorkOrder[], activeFilters: Set<PresetFilterKey>): WorkOrder[] {
    if (activeFilters.size === 0) return orders;

    return orders.filter((wo) => {
        for (const f of activeFilters) {
            switch (f) {
                case "urgent":
                    if (wo.priority !== "urgent" && wo.priority !== "high") return false;
                    break;
                case "overdue":
                    if (!isOverdue(wo)) return false;
                    break;
                case "this_week":
                    if (!isThisWeek(wo)) return false;
                    break;
                case "unassigned":
                    if (!isUnassigned(wo)) return false;
                    break;
                case "not_billed":
                    if (wo.is_billed) return false;
                    break;
                case "in_progress": {
                    const cat = wo.status?.category;
                    if (cat !== "active") return false;
                    break;
                }
                case "completed": {
                    const cat = wo.status?.category;
                    if (cat !== "done" && cat !== "closed") return false;
                    break;
                }
            }
        }
        return true;
    });
}

function MissionControlOrdersPage() {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();

    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const { tableFilters, setTableFilters } = useTableFilters({
        route: "mission-control-orders",
    });

    const [activePresets, setActivePresets] = useState<Set<PresetFilterKey>>(new Set());
    const [groupBy, setGroupBy] = useState<GroupByMode>("none");
    const [insightsOpen, setInsightsOpen] = useState(false);

    const fetchWorkOrders = useCallback(async (query: string = "") => {
        if (!orgId) return;
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }

        try {
            const response = await getWorkOrders(orgId, query, null, tableFilters || undefined);
            if (response.success && response.success.work_orders) {
                setWorkOrders(response.success.work_orders);
                setNextPageToken(response.success.next_page_token || null);
                setLastUpdated(new Date());
                if (!tableFilters) {
                    setTableFilters(response.success.params);
                }
            } else {
                toast.error(t("missionControl.orders.errorFetching", "Error fetching work orders"));
            }
        } catch {
            toast.error(t("missionControl.orders.errorFetching", "Error fetching work orders"));
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    }, [orgId, tableFilters]);

    useEffect(() => {
        fetchWorkOrders();
    }, []);

    const loadMore = async () => {
        if (!orgId || !nextPageToken || loadingMore || isLoading) return;
        setLoadingMore(true);
        try {
            const response = await getWorkOrders(orgId, searchQuery, nextPageToken, tableFilters || undefined);
            if (response.success && response.success.work_orders) {
                setWorkOrders((prev) => [...prev, ...response.success.work_orders]);
                setNextPageToken(response.success.next_page_token || null);
            }
        } catch {
            toast.error(t("missionControl.orders.errorFetching", "Error fetching work orders"));
        } finally {
            setLoadingMore(false);
        }
    };

    const handleRefresh = () => {
        fetchWorkOrders(searchQuery);
    };

    const togglePreset = (key: PresetFilterKey) => {
        setActivePresets((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const filteredOrders = useMemo(
        () => applyPresetFilters(workOrders, activePresets),
        [workOrders, activePresets],
    );

    const assignedOrders = useMemo(
        () => filteredOrders.filter((wo) => !isUnassigned(wo)),
        [filteredOrders],
    );

    const ordersToDisplay = groupBy === "none" ? filteredOrders : assignedOrders;

    const containerRef = useRef<HTMLDivElement>(null);
    const [dockBounds, setDockBounds] = useState<{ left: number; width: number } | null>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const update = () => {
            const rect = el.getBoundingClientRect();
            setDockBounds((prev) => {
                if (prev && Math.abs(prev.left - rect.left) < 1 && Math.abs(prev.width - rect.width) < 1) return prev;
                return { left: rect.left, width: rect.width };
            });
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        window.addEventListener("resize", update);
        return () => { ro.disconnect(); window.removeEventListener("resize", update); };
    }, []);

    return (
        <StatusesProvider>
            <OrdersAIInsightsSheet open={insightsOpen} onOpenChange={setInsightsOpen} />
            <div ref={containerRef} className="flex h-full min-h-0 flex-1 flex-col gap-2">
                <PageHeader
                    title={t("missionControl.orders.title", "Orders")}
                    description={
                        <div className="flex items-center gap-2 justify-center">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse mt-0.5" />
                            <span>
                                {t("missionControl.orders.lastUpdated", "Last updated {{date}}", {
                                    date: formatDate(lastUpdated, {
                                        showTime: true,
                                        showDay: true,
                                        showMonth: true,
                                        showYear: true,
                                    }),
                                })}
                            </span>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-4! w-4!"
                                        onClick={handleRefresh}
                                    >
                                        <RefreshCcw className="max-h-3 max-w-3" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {t("missionControl.orders.refresh", "Refresh now")}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    }
                    onBack={() => navigate(`/${orgId}/mission-control`)}
                    action={
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <SearchBar
                                value={searchQuery}
                                isLoading={isSearching}
                                onChange={(query) => setSearchQuery(query)}
                                onSearch={fetchWorkOrders}
                                placeholder={t("missionControl.orders.searchPlaceholder", "Search...")}
                                className="w-40 sm:w-48"
                                inputClassName="h-8 text-xs"
                            />
                            <div className="h-8 w-px bg-border shrink-0" />
                            <MissionControlLiveClock size="xl" />
                            <div className="h-8 w-px bg-border shrink-0" />
                            <Button
                                variant="default"
                                className="bg-red-600 hover:bg-red-900 text-white shrink-0"
                            >
                                <AlertTriangle className="h-5 w-5" />
                                {t("missionControl.main.emergency", "Urgent Plan")}
                            </Button>
                        </div>
                    }
                />

                <div className="flex items-center justify-between gap-2">
                    {tableFilters && (
                        <div className="flex-1 min-w-0">
                            <TableFiltersRow
                                value={tableFilters}
                                onChange={(filters) => setTableFilters(filters)}
                                onFilter={() => fetchWorkOrders(searchQuery)}
                            />
                        </div>
                    )}
                    <OrdersGroupSelector value={groupBy} onChange={setGroupBy} />
                </div>

                {isLoading ? (
                    <div className="flex flex-1 min-h-0 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pb-20">
                        <OrdersGroupedList
                            workOrders={ordersToDisplay}
                            groupBy={groupBy}
                            isLoading={false}
                            searchQuery={searchQuery}
                        />

                        {nextPageToken && (
                            <div className="flex justify-center pt-2">
                                <Button variant="outline" onClick={loadMore} disabled={loadingMore} className="min-w-32">
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
                    </div>
                )}

                {/* Floating preset dock — fixed to viewport but scoped to this container's bounds */}
                <div
                    className="pointer-events-none fixed z-40 flex justify-center px-4"
                    style={{
                        bottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))",
                        left: dockBounds?.left ?? 0,
                        width: dockBounds?.width ?? "100%",
                    }}
                >
                    <div className="pointer-events-auto flex h-14 w-fit max-w-full overflow-x-auto rounded-full border border-border/50 bg-background/10 shadow-lg backdrop-blur-md transition-colors hover:bg-background/15 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        <OrdersPresetFilters
                            activeFilters={activePresets}
                            onToggle={togglePreset}
                            floating
                            onInsightsClick={() => setInsightsOpen(true)}
                            insightsCount={3}
                        />
                    </div>
                </div>
            </div>
        </StatusesProvider>
    );
}

export default MissionControlOrdersPage;
