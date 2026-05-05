import { laiaFetch } from "@/api/0.core/basics";
import { TableFilters } from "@/types/general/filters";
import { calculateParams } from "@/utils/miscelanea";
import { baseApiUrl } from "@/api/0.core/url";

// POST /orgs/{org_id}/order-types -> Create an order type
const postOrgOrderType = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/order-types`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// GET /orgs/{org_id}/order-types -> List order types
const getOrgOrderTypes = async (
    org_id: string,
    query?: string,
    page_token?: string,
    params?: TableFilters
) => {
    const url = new URL(`/orgs/${org_id}/order-types`, baseApiUrl);
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

// GET /orgs/{org_id}/order-types/{order_type_id} -> Get an order type
const getOrgOrderType = async (org_id: string, order_type_id: string) => {
    const url = new URL(`/orgs/${org_id}/order-types/${order_type_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// PATCH /orgs/{org_id}/order-types/{order_type_id} -> Update an order type
const patchOrgOrderType = async (org_id: string, order_type_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/order-types/${order_type_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/order-types/{order_type_id} -> Delete an order type
const deleteOrgOrderType = async (org_id: string, order_type_id: string) => {
    const url = new URL(`/orgs/${org_id}/order-types/${order_type_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

export {
    postOrgOrderType,
    getOrgOrderTypes,
    getOrgOrderType,
    patchOrgOrderType,
    deleteOrgOrderType,
};
