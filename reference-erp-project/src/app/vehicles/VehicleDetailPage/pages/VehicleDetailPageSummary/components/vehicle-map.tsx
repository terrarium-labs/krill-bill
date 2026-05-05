import { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { Loader2, ArrowUp, ArrowDown, Maximize2, Minimize2, TableProperties, CalendarSearch } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { formatDateForAPI } from "@/utils/miscelanea";
import FloatingPanel from "@/app/components/maps/components/floating-panel";
import mapboxgl from "mapbox-gl";
import { useParams } from "react-router";
import { cn } from "@/lib/utils";
import { useVehicle } from "@/app/vehicles/contexts/VehicleContext";
import { getOrgVehicleCoordinates } from "@/api/orgs/vehicles/coordinates/coordinates";
import { VehicleCoordinates } from "@/types/general/vehicles";
import { STYLE_MAP } from "@/utils/maps";
import { formatDate, formatDecimal } from "@/utils/miscelanea";
import { getDirectionsWithWaypoints } from "@/api/mapbox/directions";
import { createMapZoomResetControl } from "@/app/components/maps/components/map-zoom-reset-control";
import EmployeeLabel from "@/app/components/labels/employee-label";
import { Employee } from "@/types/employees/employees";
import DateLabel from "@/app/components/labels/date-label";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_PUBLIC || process.env.REACT_APP_MAPBOX || "";
if (MAPBOX_TOKEN) mapboxgl.accessToken = MAPBOX_TOKEN;

const REAL_SOURCE = "vehicle-real-route";
const REAL_LAYER = "vehicle-real-layer";
const HIGHLIGHT_SOURCE = "vehicle-route-highlight";
const HIGHLIGHT_LAYER = "vehicle-route-highlight-layer";
const HOVER_SOURCE = "vehicle-route-hover";
const HOVER_LAYER = "vehicle-route-hover-layer";

const REAL_COLOR_OK = "#22c55e"; // green-500 — actual ≤ planned
const REAL_COLOR_OVER = "#ef4444"; // red-500   — actual > planned

const getRealColor = (actual: number, planned: number): string =>
    actual > 0 && actual > planned ? REAL_COLOR_OVER : REAL_COLOR_OK;


// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Haversine distance in km between two [lng, lat] points. */
const haversineKm = ([lng1, lat1]: [number, number], [lng2, lat2]: [number, number]): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/** Total road-following length of a LineString in km. */
const lineStringKm = (coords: [number, number][]): number =>
    coords.reduce((sum, c, i) => (i === 0 ? 0 : sum + haversineKm(coords[i - 1], c)), 0);

const MAPBOX_MAX_WAYPOINTS = 25;
const MIN_SEGMENT_KM = 0.015; // ~15m — merge consecutive points closer than this

/**
 * Reduces waypoints: merges consecutive near-duplicates and caps at Mapbox limit.
 * Returns simplified coords and the original indices for segment-to-realCoords mapping.
 */
const simplifyWaypointsForRoute = (
    coords: [number, number][]
): { coords: [number, number][]; indices: number[] } => {
    const indices: number[] = [0];
    for (let i = 1; i < coords.length; i++) {
        if (haversineKm(coords[indices[indices.length - 1]], coords[i]) >= MIN_SEGMENT_KM) {
            indices.push(i);
        }
    }
    if (indices[indices.length - 1] !== coords.length - 1) indices.push(coords.length - 1);
    let outCoords = indices.map((i) => coords[i]);
    if (outCoords.length > MAPBOX_MAX_WAYPOINTS) {
        const step = (outCoords.length - 1) / (MAPBOX_MAX_WAYPOINTS - 1);
        const sampled: number[] = [];
        for (let k = 0; k < MAPBOX_MAX_WAYPOINTS; k++) {
            sampled.push(k === MAPBOX_MAX_WAYPOINTS - 1 ? indices.length - 1 : Math.round(k * step));
        }
        outCoords = sampled.map((i) => coords[indices[i]]);
        return { coords: outCoords, indices: sampled.map((i) => indices[i]) };
    }
    return { coords: outCoords, indices };
};

const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
};

/**
 * Splits a route LineString into per-waypoint segments.
 * For each snapped waypoint location, finds the nearest index in the route
 * coordinates, then slices the geometry between consecutive waypoints so the
 * hover segments follow the same road geometry as the visual line.
 */
const splitRouteByWaypoints = (
    routeCoords: [number, number][],
    waypointLocs: [number, number][]
): GeoJSON.LineString[] => {
    if (waypointLocs.length < 2) return [];

    // Find the index in routeCoords closest to each waypoint
    const indices = waypointLocs.map(([wLng, wLat]) => {
        let minDist = Infinity;
        let minIdx = 0;
        routeCoords.forEach(([lng, lat], i) => {
            const d = (lng - wLng) ** 2 + (lat - wLat) ** 2;
            if (d < minDist) { minDist = d; minIdx = i; }
        });
        return minIdx;
    });

    // Ensure indices are strictly increasing (guards against duplicate snapping).
    // When we must advance, we ensure each segment has at least 2 coords for valid geometry.
    const monotonic = indices.reduce<number[]>((acc, idx) => {
        const prev = acc[acc.length - 1] ?? -1;
        acc.push(Math.max(idx, prev + 1));
        return acc;
    }, []);

    const segments: GeoJSON.LineString[] = [];
    for (let i = 0; i < monotonic.length - 1; i++) {
        const from = monotonic[i];
        const to = monotonic[i + 1];
        const coords = routeCoords.slice(from, to + 1);
        if (coords.length >= 2) {
            segments.push({ type: "LineString", coordinates: coords });
        } else if (coords.length === 1) {
            segments.push({ type: "LineString", coordinates: [coords[0], coords[0]] });
        }
    }
    return segments;
};

// ─── Map control button (overlay on map canvas) ───────────────────────────────

const MapControlButton = ({
    onClick,
    children,
}: {
    onClick?: () => void;
    children: React.ReactNode;
}) => (
    <button
        onClick={onClick}
        type="button"
        className={cn(
            "flex items-center justify-center w-8 h-8 rounded-md",
            "bg-background/90 hover:bg-accent border shadow-sm cursor-pointer transition-colors"
        )}
    >
        {children}
    </button>
);

// ─── Component ────────────────────────────────────────────────────────────────

interface VehicleTravelRouteMapProps {
    selectedDate: string; // YYYY-MM-DD
    selectedDayStats: { planned: number; actual: number; costPerKm: number; drivers?: Employee[] } | null;
    onDateSelect?: (date: string) => void;
}

const VehicleTravelRouteMap = ({ selectedDate, selectedDayStats, onDateSelect }: VehicleTravelRouteMapProps) => {
    const { t } = useTranslation();
    const { resolvedTheme } = useTheme();
    const { orgId } = useParams<{ orgId: string }>();
    const { vehicle } = useVehicle();

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const mapLoadedRef = useRef(false);
    const realGeomRef = useRef<GeoJSON.LineString | null>(null);
    const segmentFeaturesRef = useRef<GeoJSON.FeatureCollection | null>(null);
    const resetViewRef = useRef<(() => void) | null>(null);

    const [realCoords, setRealCoords] = useState<VehicleCoordinates[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [realGeom, setRealGeom] = useState<GeoJSON.LineString | null>(null);
    const [routeSegments, setRouteSegments] = useState<GeoJSON.LineString[]>([]);
    const [segmentIndices, setSegmentIndices] = useState<number[]>([]);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showFloatingSegments, setShowFloatingSegments] = useState(false);
    const [hoverPopup, setHoverPopup] = useState<{
        x: number;
        y: number;
        segments: Array<{
            segmentIndex: number;
            fromTime: string;
            toTime: string;
            durationMs: number;
            distanceKm: number;
        }>;
    } | null>(null);

    const mapStyle = resolvedTheme === "dark" ? "dark" : "light";

    // ── Actual route color — mirrors the chart bar logic ─────────────────────
    const realColor = useMemo(
        () => getRealColor(selectedDayStats?.actual ?? 0, selectedDayStats?.planned ?? 0),
        [selectedDayStats]
    );

    // Keep a ref so the map load handler can use the latest color even after remount
    const realColorRef = useRef(realColor);
    useEffect(() => { realColorRef.current = realColor; }, [realColor]);

    // Close floating panel when exiting fullscreen
    useEffect(() => {
        if (!isFullscreen) setShowFloatingSegments(false);
    }, [isFullscreen]);

    // Update the Mapbox layer paint whenever the color changes
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapLoadedRef.current) return;
        map.setPaintProperty(REAL_LAYER, "line-color", realColor);
        map.setPaintProperty(HIGHLIGHT_LAYER, "line-color", realColor);
    }, [realColor]);

    // ── Segment FeatureCollection for hover detection ─────────────────────────
    // Each feature uses the road-following geometry (from routeSegments) so the
    // hover hit area matches the visible line, not a straight-line shortcut.
    const segmentFeatures = useMemo<GeoJSON.FeatureCollection>(() => {
        if (
            routeSegments.length === 0 ||
            segmentIndices.length !== routeSegments.length + 1
        ) {
            return { type: "FeatureCollection", features: [] };
        }
        const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];
        for (let i = 0; i < routeSegments.length; i++) {
            const seg = routeSegments[i];
            const fromIdx = segmentIndices[i];
            const toIdx = segmentIndices[i + 1];
            if (fromIdx == null || toIdx == null || !realCoords[fromIdx] || !realCoords[toIdx]) continue;
            features.push({
                type: "Feature",
                properties: {
                    segment_index: i,
                    from_time: realCoords[fromIdx].created_at,
                    to_time: realCoords[toIdx].created_at,
                    duration_ms:
                        new Date(realCoords[toIdx].created_at).getTime() -
                        new Date(realCoords[fromIdx].created_at).getTime(),
                    distance_km: lineStringKm(seg.coordinates as [number, number][]),
                },
                geometry: seg,
            });
        }
        return { type: "FeatureCollection", features };
    }, [routeSegments, realCoords, segmentIndices]);

    useEffect(() => { segmentFeaturesRef.current = segmentFeatures; }, [segmentFeatures]);

    // ── Fetch real GPS coordinates ────────────────────────────────────────────
    useEffect(() => {
        if (!orgId || !vehicle?.id) return;
        let cancelled = false;

        const fetchCoords = async () => {
            setIsLoading(true);
            setRealCoords([]);
            try {
                const response = await getOrgVehicleCoordinates(orgId, vehicle.id, selectedDate);
                if (!cancelled && response.success?.coordinates) {
                    const sorted = [...response.success.coordinates].sort(
                        (a: VehicleCoordinates, b: VehicleCoordinates) =>
                            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    );
                    setRealCoords(sorted);
                }
            } catch {
                // No coordinates for this day — keep empty
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        fetchCoords();
        return () => { cancelled = true; };
    }, [orgId, vehicle?.id, selectedDate]);

    // ── Calculate actual route directions from GPS waypoints ─────────────────
    useEffect(() => {
        if (realCoords.length < 2) {
            realGeomRef.current = null;
            setRealGeom(null);
            setRouteSegments([]);
            setSegmentIndices([]);
            return;
        }
        const coords: [number, number][] = realCoords.map((c) => [c.longitude, c.latitude]);

        // Trip is first timestamp → last timestamp. Never connect last back to first.
        const isRoundTrip = coords.length >= 3 && haversineKm(coords[0], coords[coords.length - 1]) < 0.05;
        const coordsForRoute = isRoundTrip ? coords.slice(0, -1) : coords;

        const { coords: simplifiedCoords, indices } = simplifyWaypointsForRoute(coordsForRoute);

        const fallbackStraight = (): void => {
            const geom: GeoJSON.LineString = { type: "LineString", coordinates: coordsForRoute };
            realGeomRef.current = geom;
            setRealGeom(geom);
            setRouteSegments(
                coordsForRoute.slice(0, -1).map((c, i) => ({
                    type: "LineString" as const,
                    coordinates: [c, coordsForRoute[i + 1]],
                }))
            );
            setSegmentIndices(coordsForRoute.map((_, i) => i));
        };

        getDirectionsWithWaypoints(simplifiedCoords)
            .then((result) => {
                if (result?.routes?.[0]) {
                    const geom = result.routes[0].geometry;
                    realGeomRef.current = geom;
                    setRealGeom(geom);
                    const waypointLocs = result.waypoints.map((w) => w.location);
                    const roadSegments = splitRouteByWaypoints(
                        geom.coordinates as [number, number][],
                        waypointLocs
                    );
                    if (roadSegments.length === simplifiedCoords.length - 1) {
                        setRouteSegments(roadSegments);
                        setSegmentIndices(indices);
                    } else {
                        fallbackStraight();
                    }
                } else {
                    fallbackStraight();
                }
            })
            .catch(fallbackStraight);
    }, [realCoords]);

    // ── Initialise the Mapbox map ─────────────────────────────────────────────
    useEffect(() => {
        if (!mapContainerRef.current || !MAPBOX_TOKEN) return;
        mapLoadedRef.current = false;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: STYLE_MAP[mapStyle],
            center: [-3.7038, 40.4168],
            zoom: 10,
            interactive: true,
        });
        mapRef.current = map;

        map.on("load", () => {
            mapLoadedRef.current = true;

            // Visual route layer
            map.addSource(REAL_SOURCE, {
                type: "geojson",
                data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
            });
            map.addLayer({
                id: REAL_LAYER,
                type: "line",
                source: REAL_SOURCE,
                layout: { "line-join": "round", "line-cap": "round" },
                paint: {
                    "line-color": realColorRef.current,
                    "line-width": 6,
                    "line-opacity": 1,
                },
            });

            // Hovered-segment highlight — sits above the route, same color at ~25% opacity
            map.addSource(HIGHLIGHT_SOURCE, {
                type: "geojson",
                data: { type: "FeatureCollection", features: [] },
            });
            map.addLayer({
                id: HIGHLIGHT_LAYER,
                type: "line",
                source: HIGHLIGHT_SOURCE,
                layout: { "line-join": "round", "line-cap": "round" },
                paint: {
                    "line-color": realColorRef.current,
                    "line-width": 16,
                    "line-opacity": 0.35,
                },
            });

            // Wide invisible segments for hover detection (must be topmost so it receives events)
            map.addSource(HOVER_SOURCE, {
                type: "geojson",
                data: segmentFeaturesRef.current ?? { type: "FeatureCollection", features: [] },
            });
            map.addLayer({
                id: HOVER_LAYER,
                type: "line",
                source: HOVER_SOURCE,
                layout: { "line-join": "round", "line-cap": "round" },
                paint: { "line-color": "transparent", "line-width": 20, "line-opacity": 0 },
            });

            const emptyCollection: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

            // Hover events — collect ALL overlapping segments at the cursor point
            map.on("mousemove", HOVER_LAYER, (e) => {
                // queryRenderedFeatures returns every feature from this layer at the point,
                // including overlapping ones that e.features might deduplicate
                const allFeatures = map.queryRenderedFeatures(e.point, { layers: [HOVER_LAYER] });
                if (!allFeatures.length) return;
                map.getCanvas().style.cursor = "crosshair";

                // Deduplicate by segment_index (a segment can span multiple tiles)
                const seen = new Set<number>();
                const segments: Array<{
                    segmentIndex: number;
                    fromTime: string;
                    toTime: string;
                    durationMs: number;
                    distanceKm: number;
                }> = [];
                const highlightFeatures: GeoJSON.Feature[] = [];

                for (const f of allFeatures) {
                    const p = f.properties as {
                        segment_index: number;
                        from_time: string;
                        to_time: string;
                        duration_ms: number;
                        distance_km: number;
                    };
                    if (seen.has(p.segment_index)) continue;
                    seen.add(p.segment_index);
                    segments.push({
                        segmentIndex: p.segment_index,
                        fromTime: p.from_time,
                        toTime: p.to_time,
                        durationMs: p.duration_ms,
                        distanceKm: p.distance_km,
                    });
                    const feat = segmentFeaturesRef.current?.features[p.segment_index];
                    if (feat) highlightFeatures.push(feat);
                }

                (map.getSource(HIGHLIGHT_SOURCE) as mapboxgl.GeoJSONSource)
                    ?.setData({ type: "FeatureCollection", features: highlightFeatures });

                setHoverPopup({ x: e.point.x, y: e.point.y, segments });
            });
            map.on("mouseleave", HOVER_LAYER, () => {
                map.getCanvas().style.cursor = "";
                (map.getSource(HIGHLIGHT_SOURCE) as mapboxgl.GeoJSONSource)?.setData(emptyCollection);
                setHoverPopup(null);
            });

            // Re-apply already-fetched geometry (e.g. after theme change or fullscreen toggle)
            if (realGeomRef.current) {
                (map.getSource(REAL_SOURCE) as mapboxgl.GeoJSONSource)
                    ?.setData({ type: "Feature", properties: {}, geometry: realGeomRef.current });

                const bounds = new mapboxgl.LngLatBounds();
                (realGeomRef.current.coordinates as [number, number][]).forEach((c) => bounds.extend(c));
                map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 0 });
            }
            if (segmentFeaturesRef.current) {
                (map.getSource(HOVER_SOURCE) as mapboxgl.GeoJSONSource)
                    ?.setData(segmentFeaturesRef.current);
            }

            // Reset view callback — re-fit to the current route bounds
            resetViewRef.current = () => {
                if (!realGeomRef.current) return;
                const bounds = new mapboxgl.LngLatBounds();
                (realGeomRef.current.coordinates as [number, number][]).forEach((c) => bounds.extend(c));
                map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 800 });
            };

            map.addControl(
                createMapZoomResetControl({
                    onReset: () => resetViewRef.current?.(),
                    t: (key, fallback) => t(key, fallback as string),
                }),
                "bottom-right"
            );
        });

        // Resize map when container changes size
        const container = mapContainerRef.current;
        let rafId: number | null = null;
        const ro = new ResizeObserver(() => {
            if (rafId) return;
            rafId = requestAnimationFrame(() => {
                rafId = null;
                mapRef.current?.resize();
            });
        });
        ro.observe(container);

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
            ro.disconnect();
            mapLoadedRef.current = false;
            map.remove();
            mapRef.current = null;
        };
    }, [mapStyle, isFullscreen]);

    // ── Push segment features into the hover source ───────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        const apply = () => {
            (map.getSource(HOVER_SOURCE) as mapboxgl.GeoJSONSource | undefined)
                ?.setData(segmentFeatures);
        };
        if (mapLoadedRef.current) apply();
        else map.once("load", apply);
    }, [segmentFeatures]);

    // ── Push real-route geometry into the map source and fit bounds ───────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const geom: GeoJSON.LineString = realGeom ?? { type: "LineString", coordinates: [] };
        const apply = () => {
            const src = map.getSource(REAL_SOURCE) as mapboxgl.GeoJSONSource | undefined;
            if (!src) return;
            src.setData({ type: "Feature", properties: {}, geometry: geom });

            if (realGeom && realGeom.coordinates.length >= 2) {
                const bounds = new mapboxgl.LngLatBounds();
                (realGeom.coordinates as [number, number][]).forEach((c) => bounds.extend(c));
                map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 600 });
            }
        };

        if (mapLoadedRef.current) apply();
        else map.once("load", apply);
    }, [realGeom]);

    // ─── Render ───────────────────────────────────────────────────────────────

    if (!MAPBOX_TOKEN) {
        return (
            <div className="w-full h-16 flex items-center justify-center rounded-xl border bg-card">
                <p className="text-sm text-muted-foreground">
                    {t("common.mapNotAvailable", "Map not available")}
                </p>
            </div>
        );
    }

    const mapContent = (
        <div className="relative w-full h-full">

            {/* Loading indicator */}
            {isLoading && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-background/80 border rounded-full px-3 py-1.5 text-xs text-muted-foreground shadow">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {t("common.loading", "Loading")}…
                </div>
            )}

            {/* Map canvas */}
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Map controls */}
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                <MapControlButton onClick={() => setIsFullscreen(!isFullscreen)}>
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </MapControlButton>
                {isFullscreen && onDateSelect && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-md",
                                    "bg-background/90 hover:bg-accent border shadow-sm cursor-pointer transition-colors"
                                )}
                            >
                                <CalendarSearch className="h-4 w-4" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={selectedDate ? new Date(selectedDate) : undefined}
                                onSelect={(date) => {
                                    if (date) {
                                        onDateSelect(formatDateForAPI(date));
                                    }
                                }}
                                weekStartsOn={1}
                            />
                        </PopoverContent>
                    </Popover>
                )}
                {isFullscreen && (
                    <MapControlButton onClick={() => setShowFloatingSegments((v) => !v)}>
                        <TableProperties className="h-4 w-4" />
                    </MapControlButton>
                )}
            </div>

            {/* Segment hover popup — one card per overlapping segment */}
            {hoverPopup && hoverPopup.segments.some((s) => s.durationMs > 0) && (
                <div
                    className="absolute z-20 pointer-events-none rounded-lg border bg-background shadow-lg text-xs min-w-[180px]"
                    style={{ left: hoverPopup.x + 14, top: hoverPopup.y - 10 }}
                >
                    {hoverPopup.segments.map((seg, idx) => (
                        <div key={seg.segmentIndex}>
                            {idx > 0 && <div className="border-t border-border" />}
                            <div className="px-3 py-2 space-y-1">
                                <p className="font-semibold text-foreground">
                                    {t("vehicles.segment", "Segment")} {seg.segmentIndex + 1}
                                </p>
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-muted-foreground">{t("vehicles.duration", "Duration")}</span>
                                    <span className="font-medium tabular-nums">{formatDuration(seg.durationMs)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-muted-foreground">{t("vehicles.distance", "Distance")}</span>
                                    <span className="font-medium tabular-nums">{formatDecimal(seg.distanceKm, { minFractionDigits: 2, maxFractionDigits: 2 })} km</span>
                                </div>
                                <div className="border-t border-border my-0.5" />
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-muted-foreground">{t("vehicles.from", "From")}</span>
                                    <DateLabel
                                        data={seg.fromTime}
                                        options={{ hide: ["day", "month", "year", "seconds"] }}
                                        useUTC={false}
                                        className="font-medium tabular-nums"
                                    />
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-muted-foreground">{t("vehicles.to", "To")}</span>
                                    <DateLabel
                                        data={seg.toTime}
                                        options={{ hide: ["day", "month", "year", "seconds"] }}
                                        useUTC={false}
                                        className="font-medium tabular-nums"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Legend */}
            {(() => {
                    const planned = selectedDayStats?.planned ?? 0;
                    const actual = selectedDayStats?.actual ?? 0;
                    const costPerKm = selectedDayStats?.costPerKm ?? 0;
                    const totalCost = costPerKm > 0 ? costPerKm * actual : 0;

                    return (
                        <div className="absolute bottom-8 left-3 z-10 rounded-lg border bg-background px-3 py-2 shadow-md text-sm space-y-1 min-w-[160px]">
                            <p className="font-medium text-foreground">
                                {formatDate(selectedDate, { showTime: false, showDayName: true, showMonth: false, showYear: false })}
                            </p>

                            {actual > 0 && (
                                <div className="flex items-center justify-between gap-4">
                                    <span className="flex items-center gap-1.5 text-muted-foreground">
                                        <span className="inline-block w-3 h-3 rounded-sm border" style={{ borderColor: realColor, backgroundColor: realColor + "40" }} />
                                        {t("vehicles.realRoute", "Actual")}
                                    </span>
                                    <span className="font-medium">
                                        {formatDecimal(actual, { minFractionDigits: 0, maxFractionDigits: 2 })} km
                                    </span>
                                </div>
                            )}

                            {actual > 0 && planned > 0 && (() => {
                                const balance = actual - planned;
                                if (balance === 0) return null;
                                const isOver = balance >= 0;
                                const balanceColor = isOver ? "#ef4444" : "#22c55e";
                                const ArrowIcon = isOver ? ArrowUp : ArrowDown;
                                return (
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-muted-foreground">{t("vehicles.balance", "Balance")}</span>
                                        <span className="flex items-center gap-1 font-medium" style={{ color: balanceColor }}>
                                            <ArrowIcon className="h-3 w-3" />
                                            {formatDecimal(Math.abs(balance), { minFractionDigits: 0, maxFractionDigits: 2 })} km
                                        </span>
                                    </div>
                                );
                            })()}

                            {(totalCost > 0 || realCoords.length >= 2) && (() => {
                                const costPerKm = actual > 0 ? totalCost / actual : 0;
                                const earliest = realCoords[0]?.created_at;
                                const latest = realCoords[realCoords.length - 1]?.created_at;
                                const durationMs = earliest && latest ? new Date(latest).getTime() - new Date(earliest).getTime() : 0;
                                return (
                                    <>
                                        <div className="border-t border-border my-1" />
                                        {totalCost > 0 && (
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="text-muted-foreground">{t("vehicles.totalCost", "Total cost")}</span>
                                                    <span className="font-medium">
                                                        {formatDecimal(totalCost, { minFractionDigits: 2, maxFractionDigits: 2 })} €
                                                    </span>
                                                </div>
                                                {costPerKm > 0 && (
                                                    <div className="flex items-center justify-end">
                                                        <span className="text-muted-foreground text-xs">
                                                            ({formatDecimal(costPerKm, { minFractionDigits: 2, maxFractionDigits: 2 })} €/km)
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {realCoords.length >= 2 && earliest && latest && (
                                            <>
                                                <div className="flex items-center justify-between gap-4 border-border border-t">
                                                    <span className="text-muted-foreground">{t("vehicles.from", "From")}</span>
                                                    <DateLabel
                                                        data={earliest}
                                                        options={{ hide: ["day", "month", "year", "seconds"] }}
                                                        useUTC={false}
                                                        className="font-medium tabular-nums"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="text-muted-foreground">{t("vehicles.to", "To")}</span>
                                                    <DateLabel
                                                        data={latest}
                                                        options={{ hide: ["day", "month", "year", "seconds"] }}
                                                        useUTC={false}
                                                        className="font-medium tabular-nums"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="text-muted-foreground">{t("vehicles.duration", "Duration")}</span>
                                                    <span className="font-medium tabular-nums">{formatDuration(durationMs)}</span>
                                                </div>
                                            </>
                                        )}
                                    </>
                                );
                            })()}

                            {selectedDayStats?.drivers && selectedDayStats.drivers.length > 0 && (
                                <>
                                    <div className="border-t border-border my-1" />
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-muted-foreground">{t("vehicles.drivers", "Drivers")}</span>
                                        <EmployeeLabel data={selectedDayStats.drivers} variant="icon" />
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })()}

        </div>
    );

    const segmentsTable = (
        <table className="w-full text-xs">
            <thead className="sticky top-0 bg-background border-b z-10">
                <tr>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground w-10">#</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">{t("vehicles.from", "From")}</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">{t("vehicles.to", "To")}</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">{t("vehicles.duration", "Duration")}</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">{t("vehicles.distance", "Distance")}</th>
                </tr>
            </thead>
            <tbody>
                {routeSegments.map((seg, i) => {
                    const fromIdx = segmentIndices[i];
                    const toIdx = segmentIndices[i + 1];
                    const fromTime = fromIdx != null ? realCoords[fromIdx]?.created_at : undefined;
                    const toTime = toIdx != null ? realCoords[toIdx]?.created_at : undefined;
                    const durationMs = fromTime && toTime
                        ? new Date(toTime).getTime() - new Date(fromTime).getTime()
                        : 0;
                    const distKm = lineStringKm(seg.coordinates as [number, number][]);
                    return (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                            <td className="px-3 py-2 text-muted-foreground font-medium">{i + 1}</td>
                            <td className="px-3 py-2">
                                <DateLabel
                                    data={fromTime}
                                    options={{ hide: ["day", "month", "year", "seconds"] }}
                                    useUTC={false}
                                    className="text-xs tabular-nums"
                                />
                            </td>
                            <td className="px-3 py-2">
                                <DateLabel
                                    data={toTime}
                                    options={{ hide: ["day", "month", "year", "seconds"] }}
                                    useUTC={false}
                                    className="text-xs tabular-nums"
                                />
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">{formatDuration(durationMs)}</td>
                            <td className="px-3 py-2 text-right tabular-nums">
                                {formatDecimal(distKm, { minFractionDigits: 2, maxFractionDigits: 2 })} km
                            </td>
                        </tr>
                    );
                })}
                {routeSegments.length === 0 && (
                    <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                            {t("vehicles.noSegments", "No route data available")}
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );

    if (isFullscreen) {
        return createPortal(
            <div className="fixed inset-0 z-50 bg-background">
                {mapContent}
                {showFloatingSegments && (
                    <FloatingPanel
                        title={t("vehicles.segments", "Segments")}
                        defaultPosition={{ x: 64, y: 56 }}
                        defaultSize={{ width: 480, height: 360 }}
                        onClose={() => setShowFloatingSegments(false)}
                    >
                        {segmentsTable}
                    </FloatingPanel>
                )}
            </div>,
            document.body
        );
    }

    return (
        <div className="w-full overflow-hidden rounded-xl border bg-card shadow-none">
            <div className="relative" style={{ height: 550 }}>
                {mapContent}
            </div>
        </div>
    );
};

export default VehicleTravelRouteMap;
