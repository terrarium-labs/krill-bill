import { laiaFetch } from "../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/clients/{client_id}/inventory
export const getClientInventory = async (
    org_id: string,
    client_id: string,
    location_id?: string,
    is_service?: boolean,
    query?: string
) => {
    const url = new URL(`/orgs/${org_id}/clients/${client_id}/inventory`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (location_id) queryParams.set("location_id", location_id);
    if (is_service !== undefined && is_service !== null) queryParams.set("is_service", is_service.toString());
    if (query) queryParams.set("query", query);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/clients/{client_id}/inventory
export const postClientInventory = async (org_id: string, client_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/clients/${client_id}/inventory`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data)
    });
    return response;
};

// PATCH /orgs/{org_id}/clients/{client_id}/inventory/{inventory_id}
export const patchClientInventory = async (org_id: string, client_id: string, inventory_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/clients/${client_id}/inventory/${inventory_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data)
    });
    return response;
};

// DELETE /orgs/{org_id}/clients/{client_id}/inventory/{inventory_id}
export const deleteClientInventory = async (org_id: string, client_id: string, inventory_id: string) => {
    const url = new URL(`/orgs/${org_id}/clients/${client_id}/inventory/${inventory_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};