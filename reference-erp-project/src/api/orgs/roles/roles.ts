import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// POST /orgs/{org_id}/roles -> Create a role in an organization
const postOrgRole = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/roles`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// GET /orgs/{org_id}/roles -> List roles for an organization
const getOrgRoles = async (
    org_id: string,
    query: string | null,
    page_token: string | null
) => {
    const url = new URL(`/orgs/${org_id}/roles`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// GET /orgs/{org_id}/roles/{role_id} -> Get a role for an organization
const getOrgRole = async (org_id: string, role_id: string) => {
    const url = new URL(`/orgs/${org_id}/roles/${role_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// PATCH /orgs/{org_id}/roles/{role_id} -> Update a role for an organization
const patchOrgRole = async (org_id: string, role_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/roles/${role_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/roles/{role_id} -> Delete a role for an organization
const deleteOrgRole = async (org_id: string, role_id: string) => {
    const url = new URL(`/orgs/${org_id}/roles/${role_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

export { postOrgRole, getOrgRoles, getOrgRole, patchOrgRole, deleteOrgRole };

