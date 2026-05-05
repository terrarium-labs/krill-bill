import { laiaFetch } from '../../0.core/basics';
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/lists
const getLists = async (org_id: string, query?: string, page_token?: string) => {
    const url = new URL(`/orgs/${org_id}/lists`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/lists
const postList = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/lists`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return response;
};

// GET /orgs/{org_id}/lists/{list_id}
const getList = async (org_id: string, list_id: string) => {
    const url = new URL(`/orgs/${org_id}/lists/${list_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// PATCH /orgs/{org_id}/lists/{list_id}
const patchList = async (org_id: string, list_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/lists/${list_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return response;
};

// DELETE /orgs/{org_id}/lists/{list_id}
const deleteList = async (org_id: string, list_id: string) => {
    const url = new URL(`/orgs/${org_id}/lists/${list_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

export { getLists, postList, getList, patchList, deleteList };