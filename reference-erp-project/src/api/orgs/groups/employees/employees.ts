import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// POST /orgs/{org_id}/groups/{group_id}/employees -> {"employees_ids": ["string"]}

const postOrgGroupEmployee = async (org_id: string, group_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/groups/${group_id}/employees`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/groups/{group_id}/employees -> 204 No Content
const deleteOrgGroupEmployee = async (org_id: string, group_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/groups/${group_id}/employees`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

//GET /orgs/{org_id}/groups/{group_id}/employees -> 
const getOrgGroupEmployees = async (org_id: string, group_id: string, query: string | null, page_token: string | null) => {
    const url = new URL(`/orgs/${org_id}/groups/${group_id}/employees`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

export { postOrgGroupEmployee, deleteOrgGroupEmployee, getOrgGroupEmployees };