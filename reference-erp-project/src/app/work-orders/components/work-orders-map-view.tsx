import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { ResizablePanelGroup, ResizablePanel } from "@/components/ui/resizable";
import { Loader2, Maximize2, Minimize2, TableProperties } from "lucide-react";
import { WorkOrder } from "@/types/field-service/work-orders/work-orders";
import type { Location } from "@/types/general/location";
import type { MapPoint } from "@/utils/maps";
import MultipleItemsMap from "@/app/components/maps/multiple-items-map";
import type { LocationWithPriority } from "@/utils/maps";
import { getTagColorFromString } from "@/app/components/tag/utils";
import WorkOrderCard from "@/app/components/cards/work-order-card";
import WorkOrderLocationDrawer from "@/app/work-orders/components/work-order-location-drawer";
import LocationLabel from "@/app/components/labels/location-label";
import FloatingPanel from "@/app/components/maps/components/floating-panel";
import { cn } from "@/lib/utils";

/** Priority order (higher index = higher priority) */
const PRIORITY_ORDER: Record<string, number> = {
    low: 1,
    normal: 2,
    medium: 3,
    high: 4,
    urgent: 5,
};

/** Check if location has valid coordinates */
function hasCoordinates(loc: Location | null): loc is Location & { latitude: number; longitude: number } {
    return (
        loc != null &&
        typeof (loc as Location & { latitude?: number; longitude?: number }).latitude === "number" &&
        typeof (loc as Location & { latitude?: number; longitude?: number }).longitude === "number" &&
        Number.isFinite((loc as Location & { latitude?: number }).latitude) &&
        Number.isFinite((loc as Location & { longitude?: number }).longitude)
    );
}

/** Group work orders by location key (lat,lng) */
function groupByLocation(workOrders: WorkOrder[]): Map<string, WorkOrder[]> {
    const map = new Map<string, WorkOrder[]>();
    for (const wo of workOrders) {
        if (!hasCoordinates(wo.location)) continue;
        const key = `${wo.location.latitude},${wo.location.longitude}`;
        const list = map.get(key) ?? [];
        list.push(wo);
        map.set(key, list);
    }
    return map;
}

/** Get highest priority from a list of work orders */
function getHighestPriority(workOrders: WorkOrder[]): string {
    let highestPriority = "low";
    let highestPriorityValue = 0;

    for (const wo of workOrders) {
        if (!wo.priority) continue;
        const priority = wo.priority.toLowerCase();
        const priorityValue = PRIORITY_ORDER[priority] ?? 0;
        if (priorityValue > highestPriorityValue) {
            highestPriorityValue = priorityValue;
            highestPriority = priority;
        }
    }

    return highestPriority;
}

/** Convert work orders to locations with priority and color */
function workOrdersToLocations(workOrders: WorkOrder[]): LocationWithPriority[] {
    const byLocation = groupByLocation(workOrders);
    const locations: LocationWithPriority[] = [];
    
    byLocation.forEach((wos) => {
        const firstWo = wos[0];
        const loc = firstWo?.location;
        if (!loc || !hasCoordinates(loc)) return;
        
        // Get the highest priority among all work orders at this location
        const highestPriority = getHighestPriority(wos);
        const colorName = getTagColorFromString(highestPriority);
        
        locations.push({
            ...loc,
            priority: highestPriority,
            pinColor: colorName,
        });
    });
    
    return locations;
}

const MapControlButton = ({
    onClick,
    active,
    children,
}: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
}) => (
    <button
        onClick={onClick}
        className={cn(
            "flex items-center justify-center w-8 h-8 rounded-md",
            "bg-background/90 hover:bg-accent border shadow-sm cursor-pointer transition-colors",
            active && "bg-accent ring-1 ring-ring"
        )}
    >
        {children}
    </button>
);

export interface WorkOrdersMapViewProps {
    workOrders: WorkOrder[];
    isLoading?: boolean;
    nextPageToken: string | null;
    isLoadingMore?: boolean;
    onLoadMore: () => void;
}

export default function WorkOrdersMapView({
    workOrders,
    isLoading,
    nextPageToken,
    isLoadingMore,
    onLoadMore,
}: WorkOrdersMapViewProps) {
    const { t } = useTranslation();
    const { resolvedTheme } = useTheme();
    const scrollRef = useRef<HTMLDivElement>(null);
    const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showFloatingOrders, setShowFloatingOrders] = useState(false);

    // Convert work orders to locations with priority and color
    const locations = useMemo(() => workOrdersToLocations(workOrders), [workOrders]);
    
    // Group work orders by location for pin click sheet
    const byLocation = useMemo(() => groupByLocation(workOrders), [workOrders]);

    const [selectedLocationKey, setSelectedLocationKey] = useState<string | null>(null);
    const workOrdersAtSelected = useMemo(() => {
        if (!selectedLocationKey) return [];
        return byLocation.get(selectedLocationKey) ?? [];
    }, [selectedLocationKey, byLocation]);

    const handlePinClick = useCallback((point: MapPoint) => {
        setSelectedLocationKey(`${point.lat},${point.lng}`);
    }, []);

    // Set up intersection observer for infinite scroll
    useEffect(() => {
        if (!nextPageToken || isLoadingMore) return;
        const scrollEl = scrollRef.current;
        const sentinel = loadMoreSentinelRef.current;
        if (!scrollEl || !sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry?.isIntersecting) onLoadMore();
            },
            { root: scrollEl, rootMargin: "100px", threshold: 0 }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [nextPageToken, isLoadingMore, onLoadMore]);

    // Close floating panel when exiting fullscreen
    useEffect(() => {
        if (!isFullscreen) setShowFloatingOrders(false);
    }, [isFullscreen]);

    const mapStyle = resolvedTheme === "dark" ? "dark" : "light";

    const workOrdersList = (
        <div ref={scrollRef} className="flex flex-col gap-3 p-3 overflow-y-auto h-full">
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : workOrders.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4">
                    {t("workorders.noWorkOrdersTitle", "No work orders yet")}
                </div>
            ) : (
                workOrders.map((wo) => (
                    <WorkOrderCard key={wo.id} workOrder={wo} variant="client-location" />
                ))
            )}
            {nextPageToken && (
                <div ref={loadMoreSentinelRef} className="flex justify-center py-3">
                    {isLoadingMore && (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    )}
                </div>
            )}
        </div>
    );

    const mapWithControls = (fullscreen: boolean) => (
        <div className="relative w-full h-full">
            <MultipleItemsMap
                data={locations}
                style={mapStyle}
                draggable
                showZoomControls
                className="w-full h-full"
                onPinClick={handlePinClick}
            />
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                <MapControlButton onClick={() => setIsFullscreen(!fullscreen)}>
                    {fullscreen
                        ? <Minimize2 className="h-4 w-4" />
                        : <Maximize2 className="h-4 w-4" />
                    }
                </MapControlButton>
                {fullscreen && (
                    <MapControlButton
                        onClick={() => setShowFloatingOrders(!showFloatingOrders)}
                        active={showFloatingOrders}
                    >
                        <TableProperties className="h-4 w-4" />
                    </MapControlButton>
                )}
            </div>
            <WorkOrderLocationDrawer
                open={!!selectedLocationKey}
                workOrders={workOrdersAtSelected}
                onOpenChange={(open) => !open && setSelectedLocationKey(null)}
                title={
                    <div className="flex items-center gap-2">
                        {t("workorders.workOrdersAtLocation", "Work orders at ")}{" "}
                        <LocationLabel data={workOrdersAtSelected[0]?.location} />
                    </div>
                }
            />
        </div>
    );

    if (isFullscreen) {
        return createPortal(
            <div className="fixed inset-0 z-50 bg-background">
                {mapWithControls(true)}
                {showFloatingOrders && (
                    <FloatingPanel
                        title={t("workorders.title", "Work Orders")}
                        defaultPosition={{ x: 64, y: 56 }}
                        defaultSize={{ width: 380, height: window.innerHeight - 72 }}
                        onClose={() => setShowFloatingOrders(false)}
                    >
                        {workOrdersList}
                    </FloatingPanel>
                )}
            </div>,
            document.body
        );
    }

    return (
        <ResizablePanelGroup
            direction="horizontal"
            className="h-full min-h-[calc(100vh-14rem)] max-h-[calc(100vh-14rem)] flex-1"
        >
            <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
                <div className="flex flex-col h-full pr-2 overflow-hidden">
                    {workOrdersList}
                </div>
            </ResizablePanel>
            <ResizablePanel defaultSize={65} minSize={65} maxSize={65}>
                <div className="flex flex-col h-full pl-2 overflow-hidden min-h-0">
                    <div className="flex-1 min-h-0 w-full overflow-hidden rounded-lg bg-muted/30">
                        {mapWithControls(false)}
                    </div>
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}
