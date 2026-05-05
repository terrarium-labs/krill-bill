import type {
    SingleItemMapData,
    ParsedSingleLocation,
    MapPoint,
    MapDataItem,
    ParsedMapDataItem,
} from "@/types/general/maps";

export type {
    MapboxStyleKey,
    SingleItemMapData,
    ParsedSingleLocation,
    MapPoint,
    MapDataItem,
    LocationWithPriority,
    ParsedMapDataItem,
} from "@/types/general/maps";

/** Mapbox style identifiers for map components */
export const STYLE_MAP = {
    streets: "mapbox://styles/mapbox/streets-v12",
    outdoors: "mapbox://styles/mapbox/outdoors-v12",
    light: "mapbox://styles/mapbox/light-v11",
    dark: "mapbox://styles/mapbox/dark-v11",
    satellite: "mapbox://styles/mapbox/satellite-v9",
    "satellite-streets": "mapbox://styles/mapbox/satellite-streets-v12",
} as const;

/** Preset dimensions for single-item map variants */
export const VARIANT_SIZES = {
    compact: { width: 400, height: 150 },
    default: { width: 600, height: 200 },
    large: { width: 800, height: 300 },
    hero: { width: 1200, height: 400 },
} as const;

/** Parse single location data for SingleItemMap. Returns null if invalid. */
export function parseSingleLocationData(
    data: SingleItemMapData | null | undefined
): ParsedSingleLocation | null {
    if (data == null) return null;

    if (typeof data === "string") {
        const parts = data.split(/[,.]/).map((s) => parseFloat(s.trim()));
        if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
            const lat = parts[0];
            const lng = parts[1];
            if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
            if (Math.abs(lng) <= 90 && Math.abs(lat) <= 180) return { lat: lng, lng: lat };
        }
        return null;
    }

    const obj = data as Record<string, unknown>;
    let lat: number | undefined;
    let lng: number | undefined;

    if (typeof obj.latitude === "number" && typeof obj.longitude === "number") {
        lat = obj.latitude;
        lng = obj.longitude;
    } else if (typeof obj.lat === "number" && typeof obj.lng === "number") {
        lat = obj.lat;
        lng = obj.lng;
    } else {
        return null;
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const icon_url =
        typeof obj.icon_url === "string" ? obj.icon_url : obj.icon_url === null ? null : undefined;
    return { lat, lng, icon_url };
}

/** Parse one map data item (coords string or object) to MapPoint-like shape. */
export function parseMapDataItem(item: MapDataItem): ParsedMapDataItem | null {
    if (item == null) return null;

    if (typeof item === "string") {
        const parts = item.split(/[,.]/).map((s) => parseFloat(s.trim()));
        if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
            const lat = parts[0];
            const lng = parts[1];
            if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
            if (Math.abs(lng) <= 90 && Math.abs(lat) <= 180) return { lat: lng, lng: lat };
        }
        return null;
    }

    if (typeof item !== "object") return null;

    const obj = item as Record<string, unknown>;
    let lat: number | undefined;
    let lng: number | undefined;

    if (typeof obj.latitude === "number" && typeof obj.longitude === "number") {
        lat = obj.latitude;
        lng = obj.longitude;
    } else if (typeof obj.lat === "number" && typeof obj.lng === "number") {
        lat = obj.lat;
        lng = obj.lng;
    } else {
        return null;
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    const pinColor =
        typeof obj.pinColor === "string" && obj.pinColor ? obj.pinColor.replace(/^#/, "") : undefined;
    const priority =
        typeof obj.priority === "string" && obj.priority ? obj.priority : undefined;
    const icon_url =
        typeof obj.icon_url === "string" ? obj.icon_url : obj.icon_url === null ? null : undefined;

    return { lat, lng, pinColor, priority, icon_url };
}

/** Normalize single or array of map data items to MapPoint[]. */
export function normalizeMapData(data: MapDataItem | MapDataItem[]): MapPoint[] {
    const items = Array.isArray(data) ? data : [data];
    const out: MapPoint[] = [];
    for (const item of items) {
        const parsed = parseMapDataItem(item);
        if (parsed) {
            out.push({
                lat: parsed.lat,
                lng: parsed.lng,
                pinColor: parsed.pinColor,
                priority: parsed.priority,
                icon_url: parsed.icon_url,
            });
        }
    }
    return out;
}
