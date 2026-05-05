import { laiaFetch } from "@/api/0.core/basics";
import { TableFilters } from "@/types/general/filters";
import { calculateParams } from "@/utils/miscelanea";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/work-orders
const getWorkOrders = async (
    org_id: string,
    query?: string,
    page_token?: string | null,
    params?: TableFilters
) => {
    const url = new URL(`/orgs/${org_id}/work-orders`, baseApiUrl);
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

// POST /orgs/{org_id}/work-orders
const postWorkOrder = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/work-orders`, baseApiUrl);

    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// GET /orgs/{org_id}/work-orders/{work_order_id}
const getWorkOrder = async (org_id: string, work_order_id: string) => {
    const url = new URL(
        `/orgs/${org_id}/work-orders/${work_order_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// PATCH /orgs/{org_id}/work-orders/{work_order_id}
const patchWorkOrder = async (
    org_id: string,
    work_order_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/work-orders/${work_order_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/work-orders/{work_order_id}
const deleteWorkOrder = async (org_id: string, work_order_id: string) => {
    const url = new URL(
        `/orgs/${org_id}/work-orders/${work_order_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

export { getWorkOrders, postWorkOrder, getWorkOrder, patchWorkOrder, deleteWorkOrder };