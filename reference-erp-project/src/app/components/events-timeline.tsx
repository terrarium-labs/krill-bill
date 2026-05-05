import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Clock, ChevronDown, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";
import { getEventIconConfig, fetchEventsForEntity } from "@/utils/events";
import { getTimeAgo } from "@/utils/miscelanea";
import type { Event } from "@/types/general/events";
import { DynamicIcon, IconName } from "lucide-react/dynamic";
import SearchBar from "@/app/components/search-bar";
import type { FetchEventsResult } from "@/utils/events";

/**
 * Props for the EventsTimeline component.
 * @see {@link EventsTimeline} – component usage
 */
interface EventsTimelineProps {
    /**
     * Entity ID to fetch events for (e.g., work order ID, order ID, etc.).
     * The entity type is determined from the ID format.
     * The orgId is automatically loaded from URL params.
     * If provided, the component will automatically fetch events using fetchEventsForEntity.
     */
    entityId?: string;
    /**
     * Custom function used for all fetches (initial load and "load more").
     * Called with optional search `query` and optional `pageToken` for pagination.
     * Must return `{ events: Event[], next_page_token: string | null }`.
     * When the function reference changes (e.g. selected entity), the timeline refetches.
     * Use this for custom fetch logic, or use entityId for automatic fetching.
     */
    fetchEvents?: (query?: string, pageToken?: string) => Promise<FetchEventsResult>;
    /**
     * When true (default), shows a "Timeline" header with event count above the list.
     */
    showTitle?: boolean;
    /**
     * Controls the search bar visibility and behavior:
     * - `false`: No search bar
     * - `true`: Shows search bar, sticky when focused or has content
     * - `"sticky"`: Shows search bar, always sticky at the top
     * Search triggers a refetch with the debounced query.
     */
    showSearchbar?: boolean | "sticky";
}

/**
 * Fetches and renders a vertical timeline of events.
 *
 * Two usage patterns:
 * 1. Simple: Pass `entityId` - the component automatically fetches events (orgId from URL params)
 * 2. Custom: Pass `fetchEvents` callback for custom fetch logic
 *
 * @remarks
 * - **Fetch**: Automatically uses `fetchEventsForEntity` when entityId provided, or uses custom `fetchEvents` callback.
 * - **OrgId**: Loaded automatically from URL params (useParams)
 * - **Pagination**: Scroll-based "load more" via IntersectionObserver at the bottom of the list.
 * - **Search**: If `showSearchbar` is true, the bar sticks when it has content or is focused. If `"sticky"`, it's always sticky.
 *
 * @example
 * ```tsx
 * // Simple usage with automatic fetching
 * <EventsTimeline
 *   entityId={orderId}
 *   showTitle={false}
 *   showSearchbar="sticky"
 * />
 *
 * // Custom fetch logic
 * <EventsTimeline
 *   fetchEvents={(q, token) => customFetchFunction(q, token)}
 *   showSearchbar
 * />
 * ```
 */
const EventsTimeline = ({
    entityId,
    fetchEvents: fetchEventsProp,
    showTitle = true,
    showSearchbar = true,
}: EventsTimelineProps) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [events, setEvents] = useState<Event[]>([]);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [searchInputValue, setSearchInputValue] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);
    const [expandedEventIds, setExpandedEventIds] = useState<Set<string>>(() => new Set());
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
    /** Tracks last fetch params to skip refetch when restoring from Activity hidden (state preserved, effect re-runs) */
    const lastFetchKeyRef = useRef<string | null>(null);
    const lastFetchEventsRef = useRef<((query?: string, pageToken?: string) => Promise<FetchEventsResult>) | null>(null);

    // Create fetch function from orgId/entityId if not provided
    const fetchEvents = useMemo(() => {
        if (fetchEventsProp) return fetchEventsProp;
        if (orgId && entityId) {
            return (query?: string, pageToken?: string) =>
                fetchEventsForEntity(orgId, entityId, query, pageToken);
        }
        // Return a no-op function if neither is provided
        return async () => ({ events: [], next_page_token: null });
    }, [fetchEventsProp, orgId, entityId]);

    const loadMore = useCallback(async () => {
        if (!nextPageToken || isLoadingMore || isLoading) return;
        setIsLoadingMore(true);
        try {
            const result = await fetchEvents(searchQuery || undefined, nextPageToken);
            setEvents((prev) => [...prev, ...result.events]);
            setNextPageToken(result.next_page_token);
        } catch {
            setNextPageToken(null);
        } finally {
            setIsLoadingMore(false);
        }
    }, [nextPageToken, isLoadingMore, isLoading, fetchEvents, searchQuery]);

    useEffect(() => {
        const fetchKey = `${entityId ?? "custom"}-${searchQuery}`;
        if (lastFetchKeyRef.current === fetchKey && lastFetchEventsRef.current === fetchEvents) {
            return;
        }
        lastFetchKeyRef.current = fetchKey;
        lastFetchEventsRef.current = fetchEvents;
        setNextPageToken(null);
        let cancelled = false;
        setIsLoading(true);
        fetchEvents(searchQuery || undefined, undefined)
            .then((result) => {
                if (!cancelled) {
                    setEvents(result.events);
                    setNextPageToken(result.next_page_token);
                }
            })
            .catch(() => {
                if (!cancelled) setEvents([]);
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [fetchEvents, searchQuery, entityId]);

    useEffect(() => {
        if (!nextPageToken || isLoadingMore) return;

        const scrollEl = scrollContainerRef.current;
        const sentinel = loadMoreSentinelRef.current;
        if (!scrollEl || !sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry?.isIntersecting) loadMore();
            },
            { root: scrollEl, rootMargin: "100px", threshold: 0 }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [nextPageToken, isLoadingMore, loadMore]);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
    }, []);

    const searchSticky = showSearchbar === "sticky" || (showSearchbar && (searchQuery.length > 0 || searchFocused));

    const isEmpty = !isLoading && (!events || events.length === 0);

    const renderEmployeeAvatar = (e: Event) => {
        const employee = e.employee;
        if (!employee) return <span className="text-muted-foreground text-sm">Unknown</span>;
        return (
            <EmployeeAvatar
                employee={employee}
                showName={true}
                size="sm"
                className="text-muted-foreground"
            />
        );
    };

    if (isLoading && !showSearchbar) {
        return (
            <div className="flex items-center justify-center p-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (isEmpty && !showSearchbar) {
        return (
            <div className="flex items-center justify-center p-6">
                <p className="text-sm text-muted-foreground text-center">
                    {t("events.noActivity", "No activity yet")}
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full min-h-0">
            {showTitle && (
                <div className="flex items-center justify-between py-2 mb-2 shrink-0">
                    <div className="text-sm flex items-center gap-2 font-semibold">
                        <Clock className="h-4 w-4" />
                        {t("events.timeline", "Timeline")}
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">
                        {events.length} {t("events.events", "events")}
                    </span>
                </div>
            )}

            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto min-h-0 pr-1"
            >
                {showSearchbar && (
                    <div
                        className={cn(
                            "shrink-0 mb-4 transition-shadow",
                            searchSticky && "sticky top-0 z-10 bg-background pt-1 pb-3 -mx-1 px-1"
                        )}
                        onFocusCapture={() => setSearchFocused(true)}
                        onBlurCapture={(e) => {
                            const wrapper = e.currentTarget;
                            requestAnimationFrame(() => {
                                if (!wrapper.contains(document.activeElement)) setSearchFocused(false);
                            });
                        }}
                    >
                        <SearchBar
                            value={searchInputValue}
                            onChange={setSearchInputValue}
                            onSearch={handleSearch}
                            isLoading={isLoading}
                            placeholder={t("events.searchPlaceholder", "Search events...")}
                        />
                    </div>
                )}
                {isLoading ? (
                    <div className="flex items-center justify-center p-6">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : isEmpty ? (
                    <div className="flex items-center justify-center p-6">
                        <p className="text-sm text-muted-foreground text-center">
                            {t("events.noActivity", "No activity yet")}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 pb-4">
                        {events.map((event, index) => {
                            const { icon, color } = getEventIconConfig(event.event_name);

                            return (
                                <div key={event.id} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className={cn("p-2 rounded-full border-2", color)}>
                                            <DynamicIcon name={icon as IconName} className="h-4 w-4" />
                                        </div>
                                        {index !== events.length - 1 && (
                                            <div className="w-0.5 h-12 bg-border mt-2" />
                                        )}
                                    </div>

                                    <div className="flex-1 pt-1 min-w-0">
                                        <h4 className="text-sm font-medium text-foreground">{event.title}</h4>
                                        {event.description ? (
                                            <Collapsible
                                                open={expandedEventIds.has(event.id)}
                                                onOpenChange={(open) =>
                                                    setExpandedEventIds((prev) => {
                                                        const next = new Set(prev);
                                                        if (open) next.add(event.id);
                                                        else next.delete(event.id);
                                                        return next;
                                                    })
                                                }
                                            >
                                                <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded">
                                                    {t("events.details", "Details")}
                                                    <ChevronDown
                                                        className={cn(
                                                            "h-3.5 w-3.5 transition-transform",
                                                            expandedEventIds.has(event.id) && "rotate-180"
                                                        )}
                                                    />
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                                                        {event.description}
                                                    </p>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        ) : null}
                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                            {renderEmployeeAvatar(event)}
                                            <span className="text-xs text-muted-foreground">•</span>
                                            <span className="text-xs text-muted-foreground">
                                                {getTimeAgo(new Date(event.created_at))}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {nextPageToken && (
                            <div ref={loadMoreSentinelRef} className="flex justify-center py-3">
                                {isLoadingMore && (
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventsTimeline;
