import { useEffect, useRef, useMemo } from "react";
import ReactDOM from "react-dom/client";
import { useTranslation } from "react-i18next";
import mapboxgl from "mapbox-gl";
import { cn } from "@/lib/utils";
import {
    STYLE_MAP,
    VARIANT_SIZES,
    parseSingleLocationData,
    type SingleItemMapData,
    type MapboxStyleKey,
} from "@/utils/maps";
import { PinMarkerContent } from "./components/pin-marker-content";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_PUBLIC || "";
if (MAPBOX_TOKEN) {
    mapboxgl.accessToken = MAPBOX_TOKEN;
}

/** Re-export for consumers */
export type { SingleItemMapData };

/** Default center when no data (Madrid) */
const DEFAULT_CENTER: [number, number] = [-3.7038, 40.4168];
/** Default zoom when using default center (Spain peninsula view) */
const DEFAULT_ZOOM = 4;

/**
 * Props for the SingleItemMap component
 */
interface SingleItemMapProps {
    /**
     * Single location: Location, { latitude, longitude, icon_url? }, { lat, lng, icon_url? }, or "lat,lng" string.
     * Pin shows location.icon_url via DynamicIcon when present (fallback map-pin); otherwise default pin.
     */
    data: SingleItemMapData | null | undefined;
    style?: MapboxStyleKey;
    zoom?: number;
    pinColor?: string;
    variant?: "compact" | "default" | "large" | "hero";
    width?: number;
    height?: number;
    className?: string;
    /** Click opens Google Maps in new tab with coordinates. Custom onClick overrides. */
    onClick?: () => void;
    /** When provided, map becomes clickable; clicking calls this with lat/lng. Map shows even without data. */
    onMapClick?: (lat: number, lng: number) => void;
    /** Center when data is null and onMapClick is used. Default: Madrid. */
    defaultCenter?: [number, number];
    /** Zoom when using default center. Default: 5 (Spain peninsula). */
    defaultZoom?: number;
    /** When false, do not flyTo/recenter when data changes (e.g. when change came from map click). Default: true. */
    flyToOnDataChange?: boolean;
    alt?: string;
    showErrorMessage?: boolean;
    errorMessage?: string;
}

const SingleItemMap = ({
    data,
    style = "light",
    zoom = 14,
    pinColor = "blue",
    variant = "default",
    width,
    height,
    className,
    onClick,
    onMapClick,
    defaultCenter = DEFAULT_CENTER,
    defaultZoom = DEFAULT_ZOOM,
    flyToOnDataChange = true,
    alt,
    showErrorMessage = false,
    errorMessage,
}: SingleItemMapProps) => {
    const { t } = useTranslation();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markerRef = useRef<mapboxgl.Marker | null>(null);
    const markerRootRef = useRef<ReturnType<typeof ReactDOM.createRoot> | null>(null);

    const variantSize = VARIANT_SIZES[variant];
    /** When width is not provided, use 100% so the map resizes with its container (e.g. resizable panels). */
    const finalWidth = width !== undefined ? width : "100%";
    const finalHeight = height ?? variantSize.height;

    const parsed = useMemo(() => parseSingleLocationData(data), [data]);
    const hasValidCoordinates = !!parsed && Number.isFinite(parsed.lat) && Number.isFinite(parsed.lng);
    const isClickable = !!onMapClick;
    const shouldShowMap = hasValidCoordinates || isClickable;

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current || !shouldShowMap) return;
        if (!MAPBOX_TOKEN) return;

        const [centerLng, centerLat] = hasValidCoordinates && parsed
            ? [parsed.lng, parsed.lat]
            : defaultCenter;
        const initialZoom = hasValidCoordinates && parsed ? zoom : defaultZoom;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: STYLE_MAP[style],
            center: [centerLng, centerLat],
            zoom: initialZoom,
            interactive: true,
            dragPan: isClickable,
            scrollZoom: isClickable,
            dragRotate: false,
            keyboard: false,
            doubleClickZoom: isClickable,
            touchZoomRotate: isClickable,
        });

        mapRef.current = map;

        let marker: mapboxgl.Marker | null = null;

        if (hasValidCoordinates && parsed) {
            const el = document.createElement("div");
            el.style.width = "32px";
            el.style.height = "32px";
            el.style.cursor = "pointer";

            const root = ReactDOM.createRoot(el);
            markerRootRef.current = root;
            root.render(
                <PinMarkerContent iconUrl={parsed.icon_url} pinColor={pinColor} />
            );

            el.addEventListener("click", (e) => {
                e.stopPropagation();
                if (onClick) {
                    onClick();
                } else if (!onMapClick) {
                    window.open(
                        `https://www.google.com/maps?q=${parsed.lat},${parsed.lng}`,
                        "_blank",
                        "noopener,noreferrer"
                    );
                }
            });

            marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
                .setLngLat([parsed.lng, parsed.lat])
                .addTo(map);
            markerRef.current = marker;
        } else {
            markerRef.current = null;
        }

        const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
            if (onMapClick) {
                onMapClick(e.lngLat.lat, e.lngLat.lng);
            } else if (hasValidCoordinates && parsed) {
                if (onClick) {
                    onClick();
                } else {
                    window.open(
                        `https://www.google.com/maps?q=${parsed.lat},${parsed.lng}`,
                        "_blank",
                        "noopener,noreferrer"
                    );
                }
            }
        };

        map.on("click", handleMapClick);

        map.on("load", () => {
            setTimeout(() => map.resize(), 100);
        });

        const container = mapContainerRef.current;
        const resizeObserver = new ResizeObserver(() => {
            map.resize();
        });
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
            markerRootRef.current?.unmount();
            markerRootRef.current = null;
            marker?.remove();
            markerRef.current = null;
            map.remove();
            mapRef.current = null;
        };
    }, [shouldShowMap, defaultCenter, defaultZoom, isClickable]);

    useEffect(() => {
        if (!mapRef.current || !parsed) return;
        const map = mapRef.current;
        if (hasValidCoordinates) {
            if (flyToOnDataChange) {
                map.flyTo({ center: [parsed.lng, parsed.lat], duration: 300 });
            }
            if (markerRef.current) {
                markerRef.current.setLngLat([parsed.lng, parsed.lat]);
            } else {
                const el = document.createElement("div");
                el.style.width = "32px";
                el.style.height = "32px";
                el.style.cursor = "pointer";
                const root = ReactDOM.createRoot(el);
                markerRootRef.current = root;
                root.render(<PinMarkerContent iconUrl={parsed.icon_url} pinColor={pinColor} />);
                const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
                    .setLngLat([parsed.lng, parsed.lat])
                    .addTo(map);
                markerRef.current = marker;
            }
        } else if (markerRef.current) {
            markerRef.current.remove();
            markerRootRef.current?.unmount();
            markerRootRef.current = null;
            markerRef.current = null;
        }
    }, [hasValidCoordinates, parsed?.lat, parsed?.lng, parsed?.icon_url, pinColor, flyToOnDataChange]);

    useEffect(() => {
        if (!mapRef.current) return;
        mapRef.current.setStyle(STYLE_MAP[style]);
    }, [style]);

    useEffect(() => {
        if (!markerRef.current || !markerRootRef.current || !parsed) return;
        markerRootRef.current.render(
            <PinMarkerContent iconUrl={parsed.icon_url} pinColor={pinColor} />
        );
    }, [pinColor, parsed?.icon_url, hasValidCoordinates]);

    if (!shouldShowMap) {
        if (showErrorMessage) {
            return (
                <div
                    className={cn("flex items-center justify-center bg-muted rounded-lg", className)}
                    style={{ height: `${finalHeight}px` }}
                >
                    <p className="text-sm text-muted-foreground">
                        {errorMessage || t("common.mapNotAvailable", "Map not available")}
                    </p>
                </div>
            );
        }
        return null;
    }

    if (!MAPBOX_TOKEN) {
        if (showErrorMessage) {
            return (
                <div
                    className={cn("flex items-center justify-center bg-muted rounded-lg", className)}
                    style={{ height: `${finalHeight}px` }}
                >
                    <p className="text-sm text-muted-foreground">
                        {errorMessage || t("common.mapNotAvailable", "Map not available")}
                    </p>
                </div>
            );
        }
        return null;
    }

    return (
        <div
            className={cn("relative overflow-hidden rounded-lg cursor-pointer", className)}
            aria-label={alt || t("common.map", "Map")}
        >
            <div
                ref={mapContainerRef}
                className="w-full h-full"
                style={{
                    width: typeof finalWidth === "number" ? `${finalWidth}px` : finalWidth,
                    height: `${finalHeight}px`,
                }}
            />
        </div>
    );
};

export default SingleItemMap;
