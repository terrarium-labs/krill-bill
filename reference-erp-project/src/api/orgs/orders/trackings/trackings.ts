import { laiaFetch } from "../../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

/*POST /orgs/{org_id}/orders/{order_id}/trackings Create an order tracking*/
const postOrgOrderTracking = async (org_id: string, order_id: string, data: any = {}) => {
    const url = new URL(`/orgs/${org_id}/orders/${order_id}/trackings`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

/*GET /orgs/{org_id}/orders/{order_id}/trackings Get an order tracking*/
const getOrgOrderTrackings = async (org_id: string, order_id: string, query?: string, page_token?: string) => {
    const url = new URL(`/orgs/${org_id}/orders/${order_id}/trackings`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

/*PATCH /orgs/{org_id}/orders/{order_id}/trackings/{tracking_id} Update an order tracking*/
const patchOrgOrderTracking = async (org_id: string, order_id: string, tracking_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/orders/${order_id}/trackings/${tracking_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return response;
};

/*DELETE /orgs/{org_id}/orders/{order_id}/trackings/{tracking_id} Delete an order tracking*/
const deleteOrgOrderTracking = async (org_id: string, order_id: string, tracking_id: string) => {
    const url = new URL(`/orgs/${org_id}/orders/${order_id}/trackings/${tracking_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "DELETE"
    });
    return response;
};

export { postOrgOrderTracking, getOrgOrderTrackings, patchOrgOrderTracking, deleteOrgOrderTracking };
