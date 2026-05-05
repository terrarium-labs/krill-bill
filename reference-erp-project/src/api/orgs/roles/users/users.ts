import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/roles/{role_id}/users -> List users for a role
const getOrgRoleUsers = async (org_id: string, role_id: string, query?: string, page_token?: string | null) => {
    const url = new URL(`/orgs/${org_id}/roles/${role_id}/users`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/roles/{role_id}/users -> Assign users to a role
const postOrgRoleUsers = async (org_id: string, role_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/roles/${role_id}/users`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/roles/{role_id}/users -> Unassign users from a role
const deleteOrgRoleUsers = async (org_id: string, role_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/roles/${role_id}/users`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

export { getOrgRoleUsers, postOrgRoleUsers, deleteOrgRoleUsers };