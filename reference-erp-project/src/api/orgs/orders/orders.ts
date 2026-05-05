import { TableFilters } from "@/types/general/filters";
import { laiaFetch } from "../../0.core/basics";
import { calculateParams } from "@/utils/miscelanea";
import { baseApiUrl } from "@/api/0.core/url";

/*POST /orgs/{org_id}/orders Create an order*/
const postOrgOrder = async (org_id: string, data: any = {}) => {
    const url = new URL(`/orgs/${org_id}/orders`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

/*GET /orgs/{org_id}/orders List orders */
const getOrgOrders = async (org_id: string, query?: string, page_token?: string, params?: TableFilters) => {
    const url = new URL(`/orgs/${org_id}/orders`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    if (params) {
        queryParams.set("params", calculateParams(params));
    }
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

/*GET /orgs/{org_id}/orders/{order_id} Get an order */
const getOrgOrder = async (org_id: string, order_id: string) => {
    const url = new URL(`/orgs/${org_id}/orders/${order_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

/*PATCH /orgs/{org_id}/orders/{order_id} Update an order*/
const patchOrgOrder = async (org_id: string, order_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/orders/${order_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return response;
};

/*DELETE /orgs/{org_id}/orders/{order_id} -> 204 No Content Delete an order */
const deleteOrgOrder = async (org_id: string, order_id: string) => {
    const url = new URL(`/orgs/${org_id}/orders/${order_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "DELETE"
    });
    return response;
};

//POST /orgs/{org_id}/orders/{order_id}/approve
const postOrgOrderApprove = async (org_id: string, order_id: string) => {
    const url = new URL(`/orgs/${org_id}/orders/${order_id}/approve`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST"
    });
    return response;
};

//POST /orgs/{org_id}/orders/{order_id}/cancel
const postOrgOrderCancel = async (org_id: string, order_id: string) => {
    const url = new URL(`/orgs/${org_id}/orders/${order_id}/cancel`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST"
    });
    return response;
};

export { postOrgOrder, getOrgOrders, getOrgOrder, patchOrgOrder, deleteOrgOrder, postOrgOrderApprove, postOrgOrderCancel };

