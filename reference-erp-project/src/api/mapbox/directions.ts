const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX || process.env.REACT_APP_MAPBOX_PUBLIC || "";

export interface DirectionsRoute {
    geometry: GeoJSON.LineString;
    distance: number;
    duration: number;
}

export interface DirectionsResponse {
    routes: DirectionsRoute[];
    waypoints: Array<{ location: [number, number]; name: string }>;
}

export const getDirections = async (
    origin: [number, number],
    destination: [number, number]
): Promise<DirectionsResponse | null> => {
    if (!MAPBOX_TOKEN) return null;

    const [originLng, originLat] = origin;
    const [destLng, destLat] = destination;

    const url = new URL(
        `/directions/v5/mapbox/driving/${originLng},${originLat};${destLng},${destLat}`,
        "https://api.mapbox.com"
    );
    url.searchParams.set("geometries", "geojson");
    url.searchParams.set("overview", "full");
    url.searchParams.set("access_token", MAPBOX_TOKEN);

    const response = await fetch(url.toString());
    if (!response.ok) return null;

    const data = await response.json();
    return data as DirectionsResponse;
};

/**
 * Get driving directions through multiple waypoints. Returns the full route geometry.
 * Supports 2–25 coordinates. Coordinates as [lng, lat].
 */
export const getDirectionsWithWaypoints = async (
    coordinates: [number, number][]
): Promise<DirectionsResponse | null> => {
    if (!MAPBOX_TOKEN || coordinates.length < 2) return null;

    const coordsStr = coordinates.map(([lng, lat]) => `${lng},${lat}`).join(";");
    const url = new URL(
        `/directions/v5/mapbox/driving/${coordsStr}`,
        "https://api.mapbox.com"
    );
    url.searchParams.set("geometries", "geojson");
    url.searchParams.set("overview", "full");
    url.searchParams.set("access_token", MAPBOX_TOKEN);

    const response = await fetch(url.toString());
    if (!response.ok) return null;

    const data = await response.json();
    return data as DirectionsResponse;
};
