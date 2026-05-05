import { laiaFetch } from '../0.core/basics';

export const getCoordinates = async (address: string) => {
    const url = new URL("/search/geocode/v6/forward", "https://api.mapbox.com");
    url.searchParams.set("q", address);
    url.searchParams.set("access_token", process.env.REACT_APP_MAPBOX || "");
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};