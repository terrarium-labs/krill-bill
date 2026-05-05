import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/work-orders/{work_order_id}/clients-inventories
const getWorkOrderClientsInventories = async (org_id: string, work_order_id: string, page_token?: string) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/clients-inventories`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/work-orders/{work_order_id}/clients-inventories
const postWorkOrderClientsInventories = async (org_id: string, work_order_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/clients-inventories`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/work-orders/{work_order_id}/clients-inventories/{client_inventory_id}
const deleteWorkOrderClientsInventories = async (org_id: string, work_order_id: string, client_inventory_id: string) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/clients-inventories/${client_inventory_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

export {
    getWorkOrderClientsInventories,
    postWorkOrderClientsInventories,
    deleteWorkOrderClientsInventories
};