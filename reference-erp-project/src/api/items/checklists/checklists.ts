import { laiaFetch } from "../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/items/{item_id}/checklists
const getOrgItemChecklists = async (org_id: string, item_id: string) => {
    const url = new URL(`/orgs/${org_id}/items/${item_id}/checklists`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/items/{item_id}/checklists
const postOrgItemChecklists = async (org_id: string, item_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/items/${item_id}/checklists`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/items/{item_id}/checklists
const deleteOrgItemChecklists = async (org_id: string, item_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/items/${item_id}/checklists`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

export { getOrgItemChecklists, postOrgItemChecklists, deleteOrgItemChecklists };