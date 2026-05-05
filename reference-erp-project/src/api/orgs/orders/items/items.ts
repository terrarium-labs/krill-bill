import { laiaFetch } from "../../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

/*POST /orgs/{org_id}/orders/{order_id}/items Create an order item*/
const postOrgOrderItem = async (org_id: string, order_id: string, data: any = {}) => {
    const url = new URL(`/orgs/${org_id}/orders/${order_id}/items`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

/*GET /orgs/{org_id}/orders/{order_id}/items List order items*/
const getOrgOrderItems = async (org_id: string, order_id: string, query?: string, page_token?: string) => {
    const url = new URL(`/orgs/${org_id}/orders/${order_id}/items`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

/*PATCH /orgs/{org_id}/orders/{order_id}/items/{order_item_id} Update an order item*/
const patchOrgOrderItem = async (org_id: string, order_id: string, order_item_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/orders/${order_id}/items/${order_item_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return response;
};

/*DELETE /orgs/{org_id}/orders/{order_id}/items/{order_item_id} Delete an order item*/
const deleteOrgOrderItem = async (org_id: string, order_id: string, order_item_id: string) => {
    const url = new URL(`/orgs/${org_id}/orders/${order_id}/items/${order_item_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "DELETE"
    });
    return response;
};

export { postOrgOrderItem, getOrgOrderItems, patchOrgOrderItem, deleteOrgOrderItem };
