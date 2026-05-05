import { useCallback, useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom/client";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import mapboxgl from "mapbox-gl";
import { cn } from "@/lib/utils";
import { STYLE_MAP } from "@/utils/maps";
import { getDirectionsWithWaypoints } from "@/api/mapbox/directions";
import { createMapZoomResetControl } from "@/app/components/maps/components/map-zoom-reset-control";
import type { TimelineTechnician } from "./timeline-data";
import { MOCK_TECHNICIANS, MAP_STATUS_STYLES } from "./timeline-data";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_PUBLIC || process.env.REACT_APP_MAPBOX || "";
if (MAPBOX_TOKEN) {
    mapboxgl.accessToken = MAPBOX_TOKEN;
}

const ROUTE_COLOR = "#3b82f6";
const MAP_3D_PITCH = 52;
const MAP_3D_BEARING = -22;
const TERRAIN_DEM_SOURCE_ID = "mapbox-dem";
const SKY_LAYER_ID = "mc-sky";
const BUILDINGS_LAYER_ID = "mc-3d-buildings";
const ROUTE_SOURCE = "tech-route";
const ROUTE_LAYER = "tech-route-layer";

const fitBounds3DOptions = {
    padding: 50,
    maxZoom: 17,
    pitch: MAP_3D_PITCH,
    bearing: MAP_3D_BEARING,
} as const;

function getFirstSymbolLayerId(map: mapboxgl.Map): string | undefined {
    const layers = map.getStyle().layers;
    if (!layers) return undefined;
    for (const layer of layers) {
        if (layer.type === "symbol") return layer.id;
    }
    return undefined;
}

function add3DBuildingsLayer(map: mapboxgl.Map, isDark: boolean) {
    if (map.getLayer(BUILDINGS_LAYER_ID)) return;
    if (!map.getSource("composite")) return;
    const beforeId = getFirstSymbolLayerId(map);
    const wallColor = isDark ? "#64748b" : "#cbd5e1";
    try {
        map.addLayer(
            {
                id: BUILDINGS_LAYER_ID,
                source: "composite",
                "source-layer": "building",
                filter: ["==", "extrude", "true"],
                type: "fill-extrusion",
                minzoom: 14,
                paint: {
                    "fill-extrusion-color": wallColor,
                    "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 14, 0, 14.05, ["coalesce", ["get", "height"], ["get", "render_height"], 12]],
                    "fill-extrusion-base": ["interpolate", ["linear"], ["zoom"], 14, 0, 14.05, ["coalesce", ["get", "min_height"], 0]],
                    "fill-extrusion-opacity": isDark ? 0.92 : 0.88,
                    "fill-extrusion-ambient-occlusion-intensity": 0.3,
                    "fill-extrusion-ambient-occlusion-radius": 3,
                },
            },
            beforeId,
        );
    } catch { /* */ }
}

function setupTerrainAndSky(map: mapboxgl.Map) {
    if (!map.getSource(TERRAIN_DEM_SOURCE_ID)) {
        map.addSource(TERRAIN_DEM_SOURCE_ID, {
            type: "raster-dem",
            url: "mapbox://mapbox.mapbox-terrain-dem-v1",
            tileSize: 512,
            maxzoom: 14,
        });
    }
    map.setTerrain({ source: TERRAIN_DEM_SOURCE_ID, exaggeration: 1.35 });
    if (!map.getLayer(SKY_LAYER_ID)) {
        map.addLayer({
            id: SKY_LAYER_ID,
            type: "sky",
            paint: { "sky-type": "atmosphere", "sky-atmosphere-sun": [0.0, 75.0], "sky-atmosphere-sun-intensity": 12 },
        });
    }
}

// ─── Marker elements ──────────────────────────────────────────────────────────

function TechnicianMarkerEl({ tech, isHighlighted }: { tech: TimelineTechnician; isHighlighted: boolean }) {
    const style = MAP_STATUS_STYLES[tech.status];
    return (
        <div className="relative flex flex-col items-center group cursor-pointer">
            <div
                className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg ring-2 transition-transform",
                    style.bg, style.ring,
                    isHighlighted && "scale-125 ring-4",
                )}
            >
                {tech.avatar}
            </div>
            <div className="absolute -bottom-1 w-2 h-2 rotate-45 shadow-sm" style={{ backgroundColor: "inherit" }}>
                <div className={cn("w-full h-full rotate-0", style.bg)} />
            </div>
        </div>
    );
}

function StopMarkerEl({ index, total }: { index: number; total: number }) {
    const isFirst = index === 0;
    const isLast = index === total - 1;
    return (
        <div
            className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow border-2 border-white",
                isFirst ? "bg-blue-500 text-white" : isLast ? "bg-red-500 text-white" : "bg-white text-blue-600",
            )}
        >
            {index + 1}
        </div>
    );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface MapPanelProps {
    hoveredTechId: string | null;
    selectedTechId: string | null;
    onHoverTech: (id: string | null) => void;
    onSelectTech: (id: string | null) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MapPanel({
    hoveredTechId,
    selectedTechId,
    onHoverTech,
    onSelectTech,
}: MapPanelProps) {
    const { t } = useTranslation();
    const { resolvedTheme } = useTheme();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const mapLoadedRef = useRef(false);
    const resetViewRef = useRef<(() => void) | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const markerRootsRef = useRef<ReturnType<typeof ReactDOM.createRoot>[]>([]);
    const markerElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
    const routeStopMarkersRef = useRef<mapboxgl.Marker[]>([]);
    const routeStopRootsRef = useRef<ReturnType<typeof ReactDOM.createRoot>[]>([]);

    const mapStyle = resolvedTheme === "dark" ? "dark" : "light";

    const defaultCenter = useMemo((): [number, number] => {
        const avgLng = MOCK_TECHNICIANS.reduce((s, t) => s + t.lng, 0) / MOCK_TECHNICIANS.length;
        const avgLat = MOCK_TECHNICIANS.reduce((s, t) => s + t.lat, 0) / MOCK_TECHNICIANS.length;
        return [avgLng, avgLat];
    }, []);

    const clearRouteStopMarkers = useCallback(() => {
        routeStopRootsRef.current.forEach((r) => r.unmount());
        routeStopRootsRef.current = [];
        routeStopMarkersRef.current.forEach((m) => m.remove());
        routeStopMarkersRef.current = [];
    }, []);

    const showRoute = useCallback(async (tech: TimelineTechnician) => {
        const map = mapRef.current;
        if (!map || !mapLoadedRef.current || tech.routeStops.length < 2) return;

        const coords: [number, number][] = tech.routeStops.map((s) => [s.lng, s.lat]);
        let geometry: GeoJSON.LineString;
        try {
            const result = await getDirectionsWithWaypoints(coords);
            geometry = result?.routes?.[0]?.geometry ?? { type: "LineString", coordinates: coords };
        } catch {
            geometry = { type: "LineString", coordinates: coords };
        }

        const source = map.getSource(ROUTE_SOURCE) as mapboxgl.GeoJSONSource | undefined;
        if (source) source.setData({ type: "Feature", properties: {}, geometry });
        try { map.setLayoutProperty(ROUTE_LAYER, "visibility", "visible"); } catch { /* */ }

        clearRouteStopMarkers();
        tech.routeStops.forEach((stop, idx) => {
            if (idx === 0) return;
            const el = document.createElement("div");
            el.style.width = "20px";
            el.style.height = "20px";
            const root = ReactDOM.createRoot(el);
            root.render(<StopMarkerEl index={idx} total={tech.routeStops.length} />);
            routeStopRootsRef.current.push(root);
            const marker = new mapboxgl.Marker({ element: el, anchor: "center" }).setLngLat([stop.lng, stop.lat]).addTo(map);
            routeStopMarkersRef.current.push(marker);
        });
    }, [clearRouteStopMarkers]);

    const hideRoute = useCallback(() => {
        const map = mapRef.current;
        if (!map || !mapLoadedRef.current) return;
        try { map.setLayoutProperty(ROUTE_LAYER, "visibility", "none"); } catch { /* */ }
        const source = map.getSource(ROUTE_SOURCE) as mapboxgl.GeoJSONSource | undefined;
        if (source) source.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } });
        clearRouteStopMarkers();
    }, [clearRouteStopMarkers]);

    const addTechnicianMarkers = useCallback(
        (map: mapboxgl.Map) => {
            markerRootsRef.current.forEach((r) => r.unmount());
            markerRootsRef.current = [];
            markersRef.current.forEach((m) => m.remove());
            markersRef.current = [];
            markerElementsRef.current.clear();

            MOCK_TECHNICIANS.forEach((tech) => {
                const el = document.createElement("div");
                el.style.cursor = "pointer";
                el.dataset.techId = tech.id;
                const root = ReactDOM.createRoot(el);
                root.render(<TechnicianMarkerEl tech={tech} isHighlighted={false} />);
                markerRootsRef.current.push(root);
                markerElementsRef.current.set(tech.id, el);

                el.addEventListener("mouseenter", () => onHoverTech(tech.id));
                el.addEventListener("mouseleave", () => onHoverTech(null));
                el.addEventListener("click", () => onSelectTech(selectedTechId === tech.id ? null : tech.id));

                const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" }).setLngLat([tech.lng, tech.lat]).addTo(map);
                markersRef.current.push(marker);
            });
        },
        [onHoverTech, onSelectTech, selectedTechId],
    );

    // Re-render marker highlights when hover/selection changes
    useEffect(() => {
        const activeId = selectedTechId ?? hoveredTechId;
        markerElementsRef.current.forEach((el, techId) => {
            const tech = MOCK_TECHNICIANS.find((t) => t.id === techId);
            if (!tech) return;
            const rootIdx = MOCK_TECHNICIANS.findIndex((t) => t.id === techId);
            const root = markerRootsRef.current[rootIdx];
            if (root) root.render(<TechnicianMarkerEl tech={tech} isHighlighted={activeId === techId} />);
        });

        const activeTech = activeId ? MOCK_TECHNICIANS.find((t) => t.id === activeId) : null;
        if (activeTech) {
            showRoute(activeTech);
            const map = mapRef.current;
            if (map && mapLoadedRef.current && selectedTechId) {
                map.flyTo({ center: [activeTech.lng, activeTech.lat], zoom: 15, pitch: MAP_3D_PITCH, bearing: MAP_3D_BEARING, duration: 800 });
            }
        } else {
            hideRoute();
        }
    }, [hoveredTechId, selectedTechId, showRoute, hideRoute]);

    // ── Init map ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!mapContainerRef.current || !MAPBOX_TOKEN) return;
        mapLoadedRef.current = false;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: STYLE_MAP[mapStyle],
            center: defaultCenter,
            zoom: 12,
            pitch: MAP_3D_PITCH,
            bearing: MAP_3D_BEARING,
            interactive: true,
        });
        mapRef.current = map;

        map.on("load", () => {
            mapLoadedRef.current = true;

            map.addSource(ROUTE_SOURCE, {
                type: "geojson",
                data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
            });
            map.addLayer({
                id: ROUTE_LAYER,
                type: "line",
                source: ROUTE_SOURCE,
                layout: { "line-join": "round", "line-cap": "round", visibility: "none" },
                paint: { "line-color": ROUTE_COLOR, "line-width": 4, "line-opacity": 0.8, "line-dasharray": [2, 2] },
            });

            setupTerrainAndSky(map);
            add3DBuildingsLayer(map, mapStyle === "dark");

            map.addControl(
                new mapboxgl.NavigationControl({ showZoom: false, showCompass: true, visualizePitch: true }),
                "top-right",
            );

            addTechnicianMarkers(map);

            const bounds = new mapboxgl.LngLatBounds();
            MOCK_TECHNICIANS.forEach((tech) => bounds.extend([tech.lng, tech.lat]));
            map.fitBounds(bounds, { ...fitBounds3DOptions, duration: 0 });

            resetViewRef.current = () => {
                const b = new mapboxgl.LngLatBounds();
                MOCK_TECHNICIANS.forEach((tech) => b.extend([tech.lng, tech.lat]));
                map.fitBounds(b, { ...fitBounds3DOptions, duration: 600 });
            };

            map.addControl(
                createMapZoomResetControl({
                    onReset: () => resetViewRef.current?.(),
                    t: (key, fallback) => t(key, fallback as string),
                }),
                "bottom-right",
            );
        });

        const container = mapContainerRef.current;
        let rafId: number | null = null;
        const ro = new ResizeObserver(() => {
            if (rafId) return;
            rafId = requestAnimationFrame(() => { rafId = null; mapRef.current?.resize(); });
        });
        ro.observe(container);

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
            ro.disconnect();
            mapLoadedRef.current = false;
            markerRootsRef.current.forEach((r) => r.unmount());
            markerRootsRef.current = [];
            markersRef.current.forEach((m) => m.remove());
            markersRef.current = [];
            markerElementsRef.current.clear();
            clearRouteStopMarkers();
            map.remove();
            mapRef.current = null;
        };
    }, [mapStyle]);

    if (!MAPBOX_TOKEN) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">{t("common.mapNotAvailable", "Map not available")}</p>
            </div>
        );
    }

    const activeTech = (selectedTechId ?? hoveredTechId)
        ? MOCK_TECHNICIANS.find((t) => t.id === (selectedTechId ?? hoveredTechId)) ?? null
        : null;

    return (
        <div className="relative h-full w-full overflow-hidden">
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Legend */}
            <div className="absolute bottom-2 left-2 z-10 flex flex-col gap-1 rounded-md border bg-background/90 px-2.5 py-2 shadow-md text-xs backdrop-blur-sm">
                <span className="font-medium text-foreground mb-0.5">
                    {t("missionControl.main.technicians.legend", "Technicians")}
                    <span className="ml-1.5 text-muted-foreground font-normal tabular-nums">{MOCK_TECHNICIANS.length}</span>
                </span>
                {(Object.entries(MAP_STATUS_STYLES) as [TimelineTechnician["status"], typeof MAP_STATUS_STYLES["en-route"]][]).map(
                    ([key, style]) => (
                        <div key={key} className="flex items-center gap-1.5">
                            <span className={cn("h-2 w-2 rounded-full", style.dot)} />
                            <span className="text-muted-foreground">{style.label}</span>
                            <span className="ml-auto tabular-nums font-medium">
                                {MOCK_TECHNICIANS.filter((tt) => tt.status === key).length}
                            </span>
                        </div>
                    ),
                )}
            </div>

            {/* Info popup for active technician */}
            {activeTech && (
                <div className="absolute top-2 left-2 z-20 w-64 rounded-lg border bg-background shadow-xl text-xs">
                    <div className="flex items-center gap-2 px-3 py-2 border-b">
                        <div
                            className={cn(
                                "w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold",
                                MAP_STATUS_STYLES[activeTech.status].bg,
                            )}
                        >
                            {activeTech.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">{activeTech.name}</p>
                            <div className="flex items-center gap-1">
                                <span className={cn("h-1.5 w-1.5 rounded-full", MAP_STATUS_STYLES[activeTech.status].dot)} />
                                <span className="text-muted-foreground">{MAP_STATUS_STYLES[activeTech.status].label}</span>
                            </div>
                        </div>
                    </div>
                    {activeTech.currentOrder && (
                        <div className="px-3 py-2 border-b">
                            <p className="text-muted-foreground mb-0.5">{t("missionControl.main.technicians.currentOrder", "Current Order")}</p>
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-foreground">{activeTech.currentOrder.ref}</span>
                                <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-medium">{activeTech.currentOrder.type}</span>
                            </div>
                            <p className="text-muted-foreground mt-0.5 truncate">{activeTech.currentOrder.address}</p>
                        </div>
                    )}
                    {activeTech.nextOrder && (
                        <div className="px-3 py-2">
                            <p className="text-muted-foreground mb-0.5">{t("missionControl.main.technicians.nextOrder", "Next Order")}</p>
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-foreground">{activeTech.nextOrder.ref}</span>
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-medium">{activeTech.nextOrder.type}</span>
                            </div>
                            <p className="text-muted-foreground mt-0.5 truncate">{activeTech.nextOrder.address}</p>
                        </div>
                    )}
                    {!activeTech.currentOrder && !activeTech.nextOrder && (
                        <div className="px-3 py-3 text-center text-muted-foreground">{t("missionControl.main.technicians.noOrders", "No assigned orders")}</div>
                    )}
                </div>
            )}
        </div>
    );
}
