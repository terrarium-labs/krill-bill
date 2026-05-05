import type { BasicLocation, Location } from "@/types/general/location";

/** Mapbox style key for map components */
export type MapboxStyleKey =
    | "streets"
    | "outdoors"
    | "light"
    | "dark"
    | "satellite"
    | "satellite-streets";

/** Single location: Location, coords object, or "lat,lng" string. Never an array. */
export type SingleItemMapData =
    | Location
    | BasicLocation
    | { latitude: number; longitude: number; icon_url?: string | null }
    | { lat: number; lng: number; icon_url?: string | null }
    | string;

export interface ParsedSingleLocation {
    lat: number;
    lng: number;
    icon_url?: string | null;
}

/** Normalized point for map pins (multiple-items-map) */
export interface MapPoint {
    lat: number;
    lng: number;
    pinColor?: string;
    priority?: string;
    icon_url?: string | null;
}

/** Location with optional priority and pin color for map display */
export interface LocationWithPriority extends Location {
    priority?: string;
    pinColor?: string;
}

/** Data item that can be normalized to MapPoint */
export type MapDataItem =
    | { latitude: number; longitude: number; pinColor?: string; priority?: string; icon_url?: string | null }
    | { lat: number; lng: number; pinColor?: string; priority?: string; icon_url?: string | null }
    | Location
    | LocationWithPriority
    | string;

export interface ParsedMapDataItem {
    lat: number;
    lng: number;
    pinColor?: string;
    priority?: string;
    icon_url?: string | null;
}
