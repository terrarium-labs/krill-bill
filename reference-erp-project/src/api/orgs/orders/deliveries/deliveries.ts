import { laiaFetch } from "../../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

/*POST /orgs/{org_id}/orders/{order_id}/deliveries Create an order delivery*/
const postOrgOrderDelivery = async (org_id: string, order_id: string, data: any = {}) => {
    const url = new URL(`/orgs/${org_id}/orders/${order_id}/deliveries`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

/*GET /orgs/{org_id}/orders/{order_id}/deliveries List order deliveries*/
const getOrgOrderDeliveries = async (org_id: string, order_id: string, query?: string, page_token?: string) => {
    const url = new URL(`/orgs/${org_id}/orders/${order_id}/deliveries`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

/*PATCH /orgs/{org_id}/orders/{order_id}/deliveries/{delivery_id} Update an order delivery*/
const patchOrgOrderDelivery = async (org_id: string, order_id: string, delivery_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/orders/${order_id}/deliveries/${delivery_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return response;
};

/*DELETE /orgs/{org_id}/orders/{order_id}/deliveries/{delivery_id} Delete an order delivery*/
const deleteOrgOrderDelivery = async (org_id: string, order_id: string, delivery_id: string) => {
    const url = new URL(`/orgs/${org_id}/orders/${order_id}/deliveries/${delivery_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "DELETE"
    });
    return response;
};

export { postOrgOrderDelivery, getOrgOrderDeliveries, patchOrgOrderDelivery, deleteOrgOrderDelivery };
