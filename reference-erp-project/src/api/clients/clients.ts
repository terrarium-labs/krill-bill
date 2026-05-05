import { laiaFetch } from '../0.core/basics';
import { TableFilters } from "@/types/general/filters";
import { calculateParams } from "@/utils/miscelanea";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/clients
export const getClients = async (
    org_id: string,
    query?: string,
    page_token?: string | null,
    params?: TableFilters
) => {
    const url = new URL(`/orgs/${org_id}/clients`, baseApiUrl);
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

// POST /orgs/{org_id}/clients
export const postClient = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/clients`, baseApiUrl);

    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// GET /orgs/{org_id}/clients/{client_id}
export const getClient = async (org_id: string, client_id: string) => {
    const url = new URL(`/orgs/${org_id}/clients/${client_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// PATCH /orgs/{org_id}/clients/{client_id}
export const patchClient = async (
    org_id: string,
    client_id: string,
    data: any
) => {
    const url = new URL(`/orgs/${org_id}/clients/${client_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/clients/{client_id}
export const deleteClient = async (org_id: string, client_id: string) => {
    const url = new URL(`/orgs/${org_id}/clients/${client_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

// POST /orgs/{org_id}/clients/{client_id}/tags
export const postClientTag = async (
    org_id: string,
    client_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/clients/${client_id}/tags`,
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

// DELETE /orgs/{org_id}/clients/{client_id}/tags/{tag_id}
export const deleteClientTag = async (
    org_id: string,
    client_id: string,
    tag_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/clients/${client_id}/tags/${tag_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};
