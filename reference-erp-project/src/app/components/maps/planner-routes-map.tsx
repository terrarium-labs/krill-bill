import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import ReactDOM from "react-dom/client";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import mapboxgl from "mapbox-gl";
import { cn } from "@/lib/utils";
import { STYLE_MAP } from "@/utils/maps";
import { getDirectionsWithWaypoints } from "@/api/mapbox/directions";
import { PinMarkerContent } from "@/app/components/maps/components/pin-marker-content";
import { createMapZoomResetControl } from "@/app/components/maps/components/map-zoom-reset-control";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_PUBLIC || process.env.REACT_APP_MAPBOX || "";
if (MAPBOX_TOKEN) {
    mapboxgl.accessToken = MAPBOX_TOKEN;
}

export interface PlannerRouteInput {
    id: string;
    color: string;
    stops: { lat: number; lng: number }[];
    /** When set, this stop's marker uses primary color instead of route color. */
    primaryStopIndex?: number;
    /** Per-stop colors (hex). When set, each pin and segment uses these colors instead of route color. */
    stopColors?: string[];
}

interface PlannerRoutesMapProps {
    routes: PlannerRouteInput[];
    /** When set, only these route ids are shown. When null, all routes are shown. */
    visibleRouteIds?: string[] | null;
    className?: string;
    /** Fixed pixel height. When omitted the map fills its parent via CSS. */
    height?: number;
    onRouteClick?: (routeId: string) => void;
    onStopClick?: (routeId: string, stopIndex: number) => void;
    /** Show 1-based index numbers on stop markers instead of pin icons. */
    showStopNumbers?: boolean;
}

const getRouteSourceId = (id: string) => `planner-route-${id}`;
const getRouteLayerId = (id: string) => `planner-route-layer-${id}`;

/** Split a LineString at each stop; return segments with color for each. */
function splitGeometryAtStops(
    geometry: GeoJSON.LineString,
    stops: { lat: number; lng: number }[],
    stopColors: string[]
): GeoJSON.FeatureCollection<GeoJSON.LineString, { color: string }> {
    const coords = geometry.coordinates;
    if (coords.length < 2 || stops.length < 2 || stopColors.length < stops.length) {
        return {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    properties: { color: stopColors[0] ?? "#6b7280" },
                    geometry,
                },
            ],
        };
    }
    const splitIndices: number[] = [];
    let lastIdx = 0;
    for (let s = 0; s < stops.length; s++) {
        const stop = stops[s];
        let bestIdx = lastIdx;
        let bestDist = Infinity;
        for (let i = lastIdx; i < coords.length; i++) {
            const d = (coords[i][0] - stop.lng) ** 2 + (coords[i][1] - stop.lat) ** 2;
            if (d < bestDist) {
                bestDist = d;
                bestIdx = i;
            }
        }
        splitIndices.push(bestIdx);
        lastIdx = bestIdx;
    }
    const features: GeoJSON.Feature<GeoJSON.LineString, { color: string }>[] = [];
    for (let i = 0; i < splitIndices.length - 1; i++) {
        const start = splitIndices[i];
        const end = splitIndices[i + 1];
        const segmentCoords = coords.slice(start, end + 1);
        if (segmentCoords.length >= 2) {
            features.push({
                type: "Feature",
                properties: { color: stopColors[i + 1] ?? "#6b7280" },
                geometry: { type: "LineString", coordinates: segmentCoords },
            });
        }
    }
    if (features.length === 0) {
        return {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    properties: { color: stopColors[0] ?? "#6b7280" },
                    geometry,
                },
            ],
        };
    }
    return { type: "FeatureCollection", features };
}

const hexToPinColor: Record<string, string> = {
    "#ef4444": "red",
    "#a855f7": "purple",
    "#06b6d4": "cyan",
    "#22c55e": "green",
    "#f59e0b": "amber",
    "#eab308": "yellow",
    "#6b7280": "gray",
};

const PlannerRoutesMap = ({
    routes,
    visibleRouteIds = null,
    className,
    height,
    onRouteClick,
    onStopClick,
    showStopNumbers = false,
}: PlannerRoutesMapProps) => {
    const { t } = useTranslation();
    const { resolvedTheme } = useTheme();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const markerRootsRef = useRef<ReturnType<typeof ReactDOM.createRoot>[]>([]);
    const [routeGeometries, setRouteGeometries] = useState<Record<string, GeoJSON.LineString>>({});
    const mapLoadedRef = useRef(false);

    const mapStyle = resolvedTheme === "dark" ? "dark" : "light";
    const resetViewRef = useRef<(() => void) | null>(null);

    const defaultCenter = useMemo((): [number, number] => {
        const allStops = routes.flatMap((r) => r.stops);
        if (allStops.length === 0) return [-3.7, 40.4];
        const avgLng = allStops.reduce((s, p) => s + p.lng, 0) / allStops.length;
        const avgLat = allStops.reduce((s, p) => s + p.lat, 0) / allStops.length;
        return [avgLng, avgLat];
    }, [routes]);

    useEffect(() => {
        let cancelled = false;

        const fetchAll = async () => {
            const geomMap: Record<string, GeoJSON.LineString> = {};

            for (const route of routes) {
                if (route.stops.length < 2) continue;

                const coords: [number, number][] = route.stops.map((s) => [s.lng, s.lat]);
                try {
                    const result = await getDirectionsWithWaypoints(coords);
                    if (cancelled) continue;
                    if (result?.routes?.[0]) {
                        geomMap[route.id] = result.routes[0].geometry;
                    } else {
                        geomMap[route.id] = { type: "LineString", coordinates: coords };
                    }
                } catch {
                    geomMap[route.id] = { type: "LineString", coordinates: coords };
                }
            }

            if (!cancelled) setRouteGeometries(geomMap);
        };

        fetchAll();
        return () => { cancelled = true; };
    }, [routes]);

    const routesToDisplay = useMemo(() => {
        if (!visibleRouteIds) return routes;
        const idSet = new Set(visibleRouteIds);
        return routes.filter((r) => idSet.has(r.id));
    }, [routes, visibleRouteIds]);

    const addMarkers = useCallback(
        (map: mapboxgl.Map, routesForMarkers: PlannerRouteInput[]) => {
            markerRootsRef.current.forEach((root) => root.unmount());
            markerRootsRef.current = [];
            markersRef.current.forEach((m) => m.remove());
            markersRef.current = [];

            routesForMarkers.forEach((route) => {
                const routePinColor = hexToPinColor[route.color] ?? "blue";
                route.stops.forEach((stop, stopIndex) => {
                    const pinColor =
                        route.primaryStopIndex === stopIndex
                            ? "primary"
                            : route.stopColors?.[stopIndex]
                                ? hexToPinColor[route.stopColors[stopIndex]] ?? routePinColor
                                : routePinColor;
                    const el = document.createElement("div");
                    el.style.width = "32px";
                    el.style.height = "32px";
                    el.style.cursor = (onRouteClick || onStopClick) ? "pointer" : "default";
                    const root = ReactDOM.createRoot(el);
                    root.render(
                        <PinMarkerContent
                            iconUrl={showStopNumbers ? undefined : "map-pin"}
                            pinColor={pinColor}
                            label={showStopNumbers ? String(stopIndex + 1) : undefined}
                        />
                    );
                    markerRootsRef.current.push(root);

                    if (onStopClick) {
                        el.addEventListener("click", (e) => {
                            e.stopPropagation();
                            onStopClick(route.id, stopIndex);
                        });
                    }

                    const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
                        .setLngLat([stop.lng, stop.lat])
                        .addTo(map);
                    markersRef.current.push(marker);
                });
            });
        },
        [onRouteClick, onStopClick, showStopNumbers]
    );

    useEffect(() => {
        if (!mapContainerRef.current || !MAPBOX_TOKEN) return;
        mapLoadedRef.current = false;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: STYLE_MAP[mapStyle],
            center: defaultCenter,
            zoom: 10,
            interactive: true,
        });

        mapRef.current = map;

        map.on("load", () => {
            mapLoadedRef.current = true;

            routes.forEach((route) => {
                const sourceId = getRouteSourceId(route.id);
                const layerId = getRouteLayerId(route.id);
                map.addSource(sourceId, {
                    type: "geojson",
                    data: {
                        type: "Feature",
                        properties: {},
                        geometry: { type: "LineString", coordinates: [] },
                    },
                });
                const useStopColors = route.stopColors && route.stopColors.length >= route.stops.length;
                map.addLayer({
                    id: layerId,
                    type: "line",
                    source: sourceId,
                    layout: { "line-join": "round", "line-cap": "round" },
                    paint: {
                        "line-color": useStopColors
                            ? ["coalesce", ["get", "color"], route.color]
                            : route.color,
                        "line-width": 4,
                        "line-opacity": 0.9,
                    },
                });

                if (onRouteClick) {
                    map.on("click", layerId, (e) => {
                        e.originalEvent.stopPropagation();
                        onRouteClick(route.id);
                    });
                    map.getCanvas().style.cursor = "";
                    map.on("mouseenter", layerId, () => {
                        map.getCanvas().style.cursor = "pointer";
                    });
                    map.on("mouseleave", layerId, () => {
                        map.getCanvas().style.cursor = "";
                    });
                }
            });

            addMarkers(map, routesToDisplay);

            map.addControl(
                createMapZoomResetControl({
                    onReset: () => resetViewRef.current?.(),
                    t: (key, fallback) => t(key, fallback as string),
                }),
                "bottom-right"
            );
        });

        const container = mapContainerRef.current;
        let rafId: number | null = null;
        const ro = new ResizeObserver(() => {
            if (rafId) return;
            rafId = requestAnimationFrame(() => {
                rafId = null;
                if (mapRef.current) mapRef.current.resize();
            });
        });
        ro.observe(container);

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
            ro.disconnect();
            mapLoadedRef.current = false;
            markerRootsRef.current.forEach((root) => root.unmount());
            markerRootsRef.current = [];
            markersRef.current.forEach((m) => m.remove());
            markersRef.current = [];
            map.remove();
            mapRef.current = null;
        };
    }, [mapStyle]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        resetViewRef.current = () => {
            const coords = routesToDisplay.flatMap((r) => {
                const geom = routeGeometries[r.id];
                return geom?.coordinates ?? [];
            });
            if (coords.length >= 2) {
                const bounds = new mapboxgl.LngLatBounds();
                coords.forEach((c) => bounds.extend([c[0], c[1]]));
                map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 600 });
            } else {
                map.flyTo({ center: defaultCenter, zoom: 10, duration: 600 });
            }
        };
    }, [routesToDisplay, routeGeometries, defaultCenter]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const apply = () => {
            routes.forEach((route) => {
                const layerId = getRouteLayerId(route.id);
                const isVisible = !visibleRouteIds || visibleRouteIds.includes(route.id);
                try {
                    map.setLayoutProperty(layerId, "visibility", isVisible ? "visible" : "none");
                } catch {
                    /* layer may not exist yet */
                }
            });

            addMarkers(map, routesToDisplay);

            const coordsForBounds = routesToDisplay.flatMap((r) => {
                const geom = routeGeometries[r.id];
                return geom?.coordinates ?? [];
            });
            if (coordsForBounds.length >= 2) {
                const bounds = new mapboxgl.LngLatBounds();
                coordsForBounds.forEach(([lng, lat]) => bounds.extend([lng, lat]));
                map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 600 });
            }
        };

        if (mapLoadedRef.current) {
            apply();
        } else {
            map.once("load", apply);
        }
    }, [visibleRouteIds, routesToDisplay, routes, routeGeometries, addMarkers]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const apply = () => {
            routes.forEach((route) => {
                const sourceId = getRouteSourceId(route.id);
                const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource | undefined;
                const geometry = routeGeometries[route.id];
                if (source && geometry && geometry.coordinates.length > 0) {
                    const useStopColors =
                        route.stopColors && route.stopColors.length >= route.stops.length;
                    if (useStopColors) {
                        const fc = splitGeometryAtStops(
                            geometry,
                            route.stops,
                            route.stopColors!
                        );
                        source.setData(fc as GeoJSON.FeatureCollection);
                    } else {
                        source.setData({
                            type: "Feature",
                            properties: {},
                            geometry,
                        });
                    }
                }
            });
        };

        if (mapLoadedRef.current) {
            apply();
        } else {
            map.once("load", apply);
        }
    }, [routes, routeGeometries]);

    if (!MAPBOX_TOKEN) {
        return (
            <div
                className={cn("flex items-center justify-center bg-muted", className)}
                style={height != null ? { height } : undefined}
            >
                <p className="text-sm text-muted-foreground">
                    {t("common.mapNotAvailable", "Map not available")}
                </p>
            </div>
        );
    }

    return (
        <div className={cn("relative overflow-hidden", className)} style={height != null ? { height } : undefined}>
            <div ref={mapContainerRef} className="w-full h-full" />
        </div>
    );
};

export default PlannerRoutesMap;
