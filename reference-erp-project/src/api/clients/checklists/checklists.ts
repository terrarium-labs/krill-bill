import { laiaFetch } from "../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/clients/{client_id}/inventory/{inventory_id}/checklists
const getClientInventoryChecklists = async (org_id: string, client_id: string, inventory_id: string, query?: string, page_token?: string) => {
    const url = new URL(`/orgs/${org_id}/clients/${client_id}/inventory/${inventory_id}/checklists`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/clients/{client_id}/inventory/{inventory_id}/checklists
const postClientInventoryChecklist = async (org_id: string, client_id: string, inventory_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/clients/${client_id}/inventory/${inventory_id}/checklists`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return response;
};

// DELETE /orgs/{org_id}/clients/{client_id}/inventory/{inventory_id}/checklists/{checklist_id}
const deleteClientInventoryChecklist = async (org_id: string, client_id: string, inventory_id: string, data?: any) => {
    const url = new URL(`/orgs/${org_id}/clients/${client_id}/inventory/${inventory_id}/checklists`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    return response;
};

export { getClientInventoryChecklists, postClientInventoryChecklist, deleteClientInventoryChecklist };