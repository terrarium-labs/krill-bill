import { laiaFetch } from '../../0.core/basics';
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/clients/{client_id}/locations
export const getClientLocations = async (
    org_id: string,
    client_id: string,
    query: string | null,
    page_token: string | null
) => {
    const url = new URL(
        `/orgs/${org_id}/clients/${client_id}/locations`,
        baseApiUrl
    );
    const queryParams = new URLSearchParams();

    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);

    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/clients/{client_id}/locations
export const postClientLocation = async (
    org_id: string,
    client_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/clients/${client_id}/locations`,
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

// GET /orgs/{org_id}/clients/{client_id}/locations/{location_id}
export const getClientLocation = async (
    org_id: string,
    client_id: string,
    location_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/clients/${client_id}/locations/${location_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// PATCH /orgs/{org_id}/clients/{client_id}/locations/{location_id}
export const patchClientLocation = async (
    org_id: string,
    client_id: string,
    location_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/clients/${client_id}/locations/${location_id}`,
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

// DELETE /orgs/{org_id}/clients/{client_id}/locations/{location_id}
export const deleteClientLocation = async (
    org_id: string,
    client_id: string,
    location_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/clients/${client_id}/locations/${location_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};
