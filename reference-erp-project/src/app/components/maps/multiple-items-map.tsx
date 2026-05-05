import { useMemo, useRef, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { useTranslation } from "react-i18next";
import mapboxgl from "mapbox-gl";
import { cn } from "@/lib/utils";
import { STYLE_MAP, normalizeMapData, type MapPoint, type MapDataItem, type LocationWithPriority } from "@/utils/maps";
import { PinMarkerContent } from "./components/pin-marker-content";
import { createMapZoomResetControl } from "./components/map-zoom-reset-control";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_PUBLIC || "";
if (MAPBOX_TOKEN) {
    mapboxgl.accessToken = MAPBOX_TOKEN;
}

export type { MapPoint, MapDataItem, LocationWithPriority };

export interface MultipleItemsMapProps {
    /**
     * Data: object with lat/lng, "lat,lng" string, Location, or array of these.
     * When using Location or extended type, pinColor can be set (color name, e.g. "blue", "green") for pin color.
     */
    data: MapDataItem | MapDataItem[];
    /** Map style */
    style?: keyof typeof STYLE_MAP;
    /** Initial zoom (0-22). Use zoom state from parent for controlled zoom. */
    zoom?: number;
    /** Default zoom when uncontrolled */
    defaultZoom?: number;
    /** Called when zoom changes (for controlled zoom) */
    onZoomChange?: (zoom: number) => void;
    /** Center (lat, lng). When provided with onCenterChange, enables controlled center + dragging. */
    center?: { lat: number; lng: number } | null;
    /** Called when center changes (e.g. after drag). */
    onCenterChange?: (center: { lat: number; lng: number }) => void;
    /** Enable drag-to-pan */
    draggable?: boolean;
    /** Pin size */
    pinSize?: "s" | "m" | "l";
    /** Width in pixels */
    width?: number;
    /** Height in pixels */
    height?: number;
    className?: string;
    /** Show zoom in/out buttons */
    showZoomControls?: boolean;
    /** Called when a pin is clicked. When provided, the map does not show its own popup; use this to show custom UI (e.g. list of items at that location). */
    onPinClick?: (point: MapPoint, index: number) => void;
    /** Custom render for each pin overlay (popup content). Ignored when onPinClick is provided. Receives (point, index) and pixel { x, y }. */
    renderPinOverlay?: (
        point: MapPoint,
        index: number,
        pixel: { x: number; y: number }
    ) => React.ReactNode;
    showErrorMessage?: boolean;
    errorMessage?: string;
}

export default function MultipleItemsMap({
    data,
    style = "light",
    zoom: controlledZoom,
    defaultZoom = 10,
    onZoomChange,
    center: controlledCenter,
    onCenterChange,
    draggable = true,
    className,
    showZoomControls = true,
    onPinClick,
    renderPinOverlay,
    showErrorMessage = false,
    errorMessage,
}: MultipleItemsMapProps) {
    const { t } = useTranslation();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const markerRootsRef = useRef<ReturnType<typeof ReactDOM.createRoot>[]>([]);
    const popupsRef = useRef<Map<number, HTMLDivElement>>(new Map());
    const resetViewRef = useRef<(() => void) | null>(null);

    const points = useMemo(() => normalizeMapData(data), [data]);

    // Increments every time the map style finishes loading (initial load + setStyle reloads).
    // Used as a dependency so marker/bounds effects re-run after each style load.
    const [styleVersion, setStyleVersion] = useState(0);

    const computedCenter = useMemo(() => {
        if (points.length === 0) return { lat: 40, lng: 0 };
        const sumLat = points.reduce((a, p) => a + p.lat, 0);
        const sumLng = points.reduce((a, p) => a + p.lng, 0);
        return { lat: sumLat / points.length, lng: sumLng / points.length };
    }, [points]);

    const initialCenter = controlledCenter ?? computedCenter;
    const initialZoom = controlledZoom ?? defaultZoom;

    // Initialize map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        if (!MAPBOX_TOKEN) return;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: STYLE_MAP[style],
            center: [initialCenter.lng, initialCenter.lat],
            zoom: initialZoom,
            interactive: draggable,
        });

        mapRef.current = map;

        // Add zoom + reset view controls (reset = same centering/zoom as on load)
        if (showZoomControls) {
            resetViewRef.current = () => {
                map.flyTo({
                    center: [initialCenter.lng, initialCenter.lat],
                    zoom: initialZoom,
                    duration: 1000,
                });
            };
            map.addControl(
                createMapZoomResetControl({
                    onReset: () => resetViewRef.current?.(),
                    t: (key, fallback) => t(key, fallback as string),
                }),
                "bottom-right"
            );
        }

        // Listen to zoom changes
        map.on('zoom', () => {
            const newZoom = map.getZoom();
            onZoomChange?.(newZoom);
        });

        // Listen to center changes
        map.on('moveend', () => {
            const center = map.getCenter();
            onCenterChange?.({ lat: center.lat, lng: center.lng });
        });

        // Increment styleVersion whenever the style finishes loading so that
        // marker/bounds effects re-run even when data arrived before the style was ready.
        map.on('style.load', () => {
            setStyleVersion(v => v + 1);
            setTimeout(() => map.resize(), 100);
        });

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Update map style
    useEffect(() => {
        if (!mapRef.current) return;
        mapRef.current.setStyle(STYLE_MAP[style]);
    }, [style]);

    // Update markers when points or style version change
    useEffect(() => {
        const map = mapRef.current;
        if (!map || styleVersion === 0) return;

        // Clear existing markers and unmount React roots
        markerRootsRef.current.forEach(root => root.unmount());
        markerRootsRef.current = [];
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
        popupsRef.current.clear();

        // Add new markers
        points.forEach((point, index) => {
            // Create marker element (custom pin: DynamicIcon when icon_url, else default SVG)
            const el = document.createElement('div');
            el.className = 'custom-marker';
            el.style.width = '32px';
            el.style.height = '32px';
            el.style.cursor = 'pointer';

            const pinColorName = point.pinColor || 'gray';
            const root = ReactDOM.createRoot(el);
            root.render(<PinMarkerContent iconUrl={point.icon_url} pinColor={pinColorName} />);
            markerRootsRef.current.push(root);

            // Create marker
            const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
                .setLngLat([point.lng, point.lat])
                .addTo(map);

            // Pin click: custom handler or popup overlay
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                if (onPinClick) {
                    onPinClick(point, index);
                    return;
                }
                if (renderPinOverlay) {
                    const popupContent = document.createElement('div');
                    popupsRef.current.set(index, popupContent);

                    const popup = new mapboxgl.Popup({
                        offset: 25,
                        closeButton: true,
                        closeOnClick: false,
                        maxWidth: '400px',
                    })
                        .setDOMContent(popupContent);

                    const markerPos = map.project([point.lng, point.lat]);
                    const overlayElement = renderPinOverlay(point, index, { x: markerPos.x, y: markerPos.y });

                    popupContent.innerHTML = '';
                    if (overlayElement) {
                        const div = document.createElement('div');
                        const root = ReactDOM.createRoot(div);
                        root.render(overlayElement);
                        popupContent.appendChild(div);
                    }

                    marker.setPopup(popup);
                    popup.addTo(map);
                }
            });

            markersRef.current.push(marker);
        });
    }, [points, styleVersion, onPinClick, renderPinOverlay]);

    // Fit bounds to show all markers when points or style version change; store same logic for reset button
    useEffect(() => {
        const map = mapRef.current;
        if (!map || styleVersion === 0) return;

        if (points.length === 0) {
            resetViewRef.current = () => {
                map.flyTo({
                    center: [initialCenter.lng, initialCenter.lat],
                    zoom: initialZoom,
                    duration: 1000,
                });
            };
            return;
        }

        if (points.length === 1) {
            map.flyTo({
                center: [points[0].lng, points[0].lat],
                zoom: 12,
                duration: 1000,
            });
            resetViewRef.current = () => {
                map.flyTo({
                    center: [points[0].lng, points[0].lat],
                    zoom: 12,
                    duration: 1000,
                });
            };
        } else {
            const bounds = new mapboxgl.LngLatBounds();
            points.forEach(point => bounds.extend([point.lng, point.lat]));
            map.fitBounds(bounds, {
                padding: 50,
                duration: 1000,
                maxZoom: 15,
            });
            resetViewRef.current = () => {
                const b = new mapboxgl.LngLatBounds();
                points.forEach(point => b.extend([point.lng, point.lat]));
                map.fitBounds(b, { padding: 50, duration: 1000, maxZoom: 15 });
            };
        }
    }, [points, styleVersion, initialCenter, initialZoom]);

    // Handle controlled zoom changes
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !map.isStyleLoaded() || controlledZoom === undefined) return;
        if (Math.abs(map.getZoom() - controlledZoom) > 0.01) {
            map.setZoom(controlledZoom);
        }
    }, [controlledZoom]);

    // Handle controlled center changes
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !map.isStyleLoaded() || !controlledCenter) return;
        const currentCenter = map.getCenter();
        if (Math.abs(currentCenter.lat - controlledCenter.lat) > 0.0001 ||
            Math.abs(currentCenter.lng - controlledCenter.lng) > 0.0001) {
            map.setCenter([controlledCenter.lng, controlledCenter.lat]);
        }
    }, [controlledCenter]);

    if (!MAPBOX_TOKEN) {
        if (showErrorMessage) {
            return (
                <div
                    className={cn(
                        "flex items-center justify-center bg-muted rounded-lg w-full h-full",
                        className
                    )}
                >
                    <p className="text-sm text-muted-foreground">
                        {errorMessage ||
                            t("common.mapNotAvailable", "Map not available")}
                    </p>
                </div>
            );
        }
        return null;
    }

    return (
        <div
            className={cn("relative overflow-hidden rounded-lg w-full h-full", className)}
        >
            <div
                ref={mapContainerRef}
                className="w-full h-full absolute inset-0"
            />
        </div>
    );
}
