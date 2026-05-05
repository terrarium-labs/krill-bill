import { laiaFetch } from "../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/threads
const getOrgThreads = async (org_id: string, entity_id?: string, page_token?: string) => {
    const url = new URL(`/orgs/${org_id}/threads`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (entity_id) queryParams.set("entity_id", entity_id);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/threads
const postOrgThread = async (org_id: string, entity_id: string, content: string, files: File[]) => {
    const url = new URL(`/orgs/${org_id}/threads`, baseApiUrl);
    const formData = new FormData();
    formData.append("entity_id", entity_id);
    formData.append("content", content);
    files.forEach(file => {
        formData.append("files", file);
    });
    const response = await laiaFetch(url, {
        method: "POST",
        body: formData,
    });
    return response;
};

// PATCH /orgs/{org_id}/threads/{thread_id}
const patchOrgThread = async (org_id: string, thread_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/threads/${thread_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/threads/{thread_id}
const deleteOrgThread = async (org_id: string, thread_id: string) => {
    const url = new URL(`/orgs/${org_id}/threads/${thread_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

export { getOrgThreads, postOrgThread, patchOrgThread, deleteOrgThread };