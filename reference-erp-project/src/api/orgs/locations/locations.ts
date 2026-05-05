import { TableFilters } from '@/types/general/filters';
import { laiaFetch } from '../../0.core/basics';
import { calculateParams } from '@/utils/miscelanea';
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/locations
export const getLocations = async (
    org_id: string,
    query?: string,
    page_token?: string,
    params?: TableFilters
) => {
    const url = new URL(
        `/orgs/${org_id}/locations`,
        baseApiUrl
    );
    const queryParams = new URLSearchParams();

    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    if (params) {
        queryParams.set("params", calculateParams(params));
    }

    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/locations
export const postLocation = async (
    org_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/locations`,
        baseApiUrl
    );
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// GET /orgs/{org_id}/locations/{location_id}
export const getLocation = async (
    org_id: string,
    location_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/locations/${location_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// PATCH /orgs/{org_id}/locations/{location_id}
export const patchLocation = async (
    org_id: string,
    location_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/locations/${location_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/locations/{location_id}
export const deleteLocation = async (
    org_id: string,
    location_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/locations/${location_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

// GET /orgs/{org_id}/locations/{location_id}/history
export const getLocationHistory = async (
    org_id: string,
    location_id: string,
    date_from?: string,
    date_to?: string,
    query?: string,
    page_token?: string
) => {
    const url = new URL(
        `/orgs/${org_id}/locations/${location_id}/stock-history`,
        baseApiUrl
    );
    const queryParams = new URLSearchParams();

    if (date_from) queryParams.set("date_from", date_from);
    if (date_to) queryParams.set("date_to", date_to);
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);

    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// GET /orgs/{org_id}/locations/{location_id}/stock-history
export const getLocationStocks = async (
    org_id: string,
    location_id: string,
    query?: string,
    page_token?: string
) => {
    const url = new URL(
        `/orgs/${org_id}/locations/${location_id}/stocks`,
        baseApiUrl
    );
    const queryParams = new URLSearchParams();

    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);

    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

