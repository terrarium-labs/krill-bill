import { useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import mapboxgl from "mapbox-gl";
import { cn } from "@/lib/utils";
import { STYLE_MAP } from "@/utils/maps";
import { PinMarkerContent } from "./components/pin-marker-content";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_PUBLIC || "";
if (MAPBOX_TOKEN) {
    mapboxgl.accessToken = MAPBOX_TOKEN;
}

interface RouteMapProps {
    origin: { lat: number; lng: number } | null;
    destination: { lat: number; lng: number } | null;
    routeGeometry?: GeoJSON.LineString | null;
    className?: string;
    height?: number;
}

const ROUTE_SOURCE_ID = "route-source";
const ROUTE_LAYER_ID = "route-layer";

const RouteMap = ({
    origin,
    destination,
    routeGeometry,
    className,
    height = 300,
}: RouteMapProps) => {
    const { t } = useTranslation();
    const { resolvedTheme } = useTheme();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const originMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const destMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const originRootRef = useRef<ReturnType<typeof ReactDOM.createRoot> | null>(null);
    const destRootRef = useRef<ReturnType<typeof ReactDOM.createRoot> | null>(null);
    const mapLoadedRef = useRef(false);

    const mapStyle = resolvedTheme === "dark" ? "dark" : "light";

    const hasOrigin = origin && Number.isFinite(origin.lat) && Number.isFinite(origin.lng);
    const hasDest = destination && Number.isFinite(destination.lat) && Number.isFinite(destination.lng);

    useEffect(() => {
        if (!mapContainerRef.current || !MAPBOX_TOKEN) return;

        const center: [number, number] = hasDest
            ? [destination!.lng, destination!.lat]
            : hasOrigin
                ? [origin!.lng, origin!.lat]
                : [-3.7, 40.4];

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: STYLE_MAP[mapStyle],
            center,
            zoom: 10,
            interactive: true,
        });

        mapRef.current = map;

        map.on("load", () => {
            mapLoadedRef.current = true;

            map.addSource(ROUTE_SOURCE_ID, {
                type: "geojson",
                data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
            });

            map.addLayer({
                id: ROUTE_LAYER_ID,
                type: "line",
                source: ROUTE_SOURCE_ID,
                layout: { "line-join": "round", "line-cap": "round" },
                paint: { "line-color": "#3b82f6", "line-width": 4, "line-opacity": 0.8 },
            });

            updateRoute(map);
            updateMarkers(map);
            fitBounds(map);
        });

        return () => {
            mapLoadedRef.current = false;
            originRootRef.current?.unmount();
            originRootRef.current = null;
            destRootRef.current?.unmount();
            destRootRef.current = null;
            originMarkerRef.current?.remove();
            originMarkerRef.current = null;
            destMarkerRef.current?.remove();
            destMarkerRef.current = null;
            map.remove();
            mapRef.current = null;
        };
    }, [mapStyle]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapLoadedRef.current) return;
        updateRoute(map);
        updateMarkers(map);
        fitBounds(map);
    }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng, routeGeometry]);

    const updateRoute = (map: mapboxgl.Map) => {
        const source = map.getSource(ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
        if (!source) return;

        if (routeGeometry && routeGeometry.coordinates.length > 0) {
            source.setData({
                type: "Feature",
                properties: {},
                geometry: routeGeometry,
            });
        } else {
            source.setData({
                type: "Feature",
                properties: {},
                geometry: { type: "LineString", coordinates: [] },
            });
        }
    };

    const updateMarkers = (map: mapboxgl.Map) => {
        if (hasOrigin) {
            if (!originMarkerRef.current) {
                const el = document.createElement("div");
                el.style.width = "32px";
                el.style.height = "32px";
                const root = ReactDOM.createRoot(el);
                originRootRef.current = root;
                root.render(<PinMarkerContent iconUrl="building-2" pinColor="blue" />);
                originMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: "center" })
                    .setLngLat([origin!.lng, origin!.lat])
                    .addTo(map);
            } else {
                originMarkerRef.current.setLngLat([origin!.lng, origin!.lat]);
            }
        } else if (originMarkerRef.current) {
            originMarkerRef.current.remove();
            originRootRef.current?.unmount();
            originMarkerRef.current = null;
            originRootRef.current = null;
        }

        if (hasDest) {
            if (!destMarkerRef.current) {
                const el = document.createElement("div");
                el.style.width = "32px";
                el.style.height = "32px";
                const root = ReactDOM.createRoot(el);
                destRootRef.current = root;
                root.render(<PinMarkerContent iconUrl="map-pin" pinColor="red" />);
                destMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: "center" })
                    .setLngLat([destination!.lng, destination!.lat])
                    .addTo(map);
            } else {
                destMarkerRef.current.setLngLat([destination!.lng, destination!.lat]);
            }
        } else if (destMarkerRef.current) {
            destMarkerRef.current.remove();
            destRootRef.current?.unmount();
            destMarkerRef.current = null;
            destRootRef.current = null;
        }
    };

    const fitBounds = (map: mapboxgl.Map) => {
        if (hasOrigin && hasDest) {
            const bounds = new mapboxgl.LngLatBounds();
            bounds.extend([origin!.lng, origin!.lat]);
            bounds.extend([destination!.lng, destination!.lat]);
            map.fitBounds(bounds, { padding: 50, maxZoom: 14, duration: 600 });
        } else if (hasOrigin) {
            map.flyTo({ center: [origin!.lng, origin!.lat], zoom: 12, duration: 600 });
        } else if (hasDest) {
            map.flyTo({ center: [destination!.lng, destination!.lat], zoom: 12, duration: 600 });
        }
    };

    if (!MAPBOX_TOKEN) {
        return (
            <div
                className={cn("flex items-center justify-center bg-muted rounded-lg", className)}
                style={{ height }}
            >
                <p className="text-sm text-muted-foreground">
                    {t("common.mapNotAvailable", "Map not available")}
                </p>
            </div>
        );
    }

    return (
        <div className={cn("relative overflow-hidden rounded-lg", className)} style={{ height }}>
            <div ref={mapContainerRef} className="w-full h-full" />
        </div>
    );
};

export default RouteMap;
