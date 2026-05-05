import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/work-orders/{work_order_id}/items -> Items for a work order
const getWorkOrderItems = async (org_id: string, work_order_id: string, query?: string, page_token?: string) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/items`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/work-orders/{work_order_id}/items
const postWorkOrderItem = async (org_id: string, work_order_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/items`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

// PATCH /orgs/{org_id}/work-orders/{work_order_id}/items/{item_id}
const patchWorkOrderItem = async (org_id: string, work_order_id: string, item_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/items/${item_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/work-orders/{work_order_id}/items/{item_id}
const deleteWorkOrderItem = async (org_id: string, work_order_id: string, item_id: string) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/items/${item_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

export {
    getWorkOrderItems,
    postWorkOrderItem,
    patchWorkOrderItem,
    deleteWorkOrderItem
};