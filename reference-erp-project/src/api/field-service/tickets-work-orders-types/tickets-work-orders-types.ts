import { laiaFetch } from "@/api/0.core/basics";
import { TableFilters } from "@/types/general/filters";
import { calculateParams } from "@/utils/miscelanea";
import { baseApiUrl } from "@/api/0.core/url";

// POST /orgs/{org_id}/tickets-work-orders-types -> Create a ticket work order type
const postOrgTicketWorkOrderType = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/tickets-work-orders-types`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// GET /orgs/{org_id}/tickets-work-orders-types -> List ticket work order types
const getOrgTicketWorkOrderTypes = async (
    org_id: string,
    query?: string,
    page_token?: string,
    params?: TableFilters
) => {
    const url = new URL(`/orgs/${org_id}/tickets-work-orders-types`, baseApiUrl);
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

// GET /orgs/{org_id}/tickets-work-orders-types/{tickets_wo_type_id} -> Get a ticket work order type
const getOrgTicketWorkOrderType = async (org_id: string, tickets_wo_type_id: string) => {
    const url = new URL(`/orgs/${org_id}/tickets-work-orders-types/${tickets_wo_type_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// PATCH /orgs/{org_id}/tickets-work-orders-types/{tickets_wo_type_id} -> Update a ticket work order type
const patchOrgTicketWorkOrderType = async (org_id: string, tickets_wo_type_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/tickets-work-orders-types/${tickets_wo_type_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/tickets-work-orders-types/{tickets_wo_type_id} -> Delete a ticket work order type
const deleteOrgTicketWorkOrderType = async (org_id: string, tickets_wo_type_id: string) => {
    const url = new URL(`/orgs/${org_id}/tickets-work-orders-types/${tickets_wo_type_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

export {
    postOrgTicketWorkOrderType,
    getOrgTicketWorkOrderTypes,
    getOrgTicketWorkOrderType,
    patchOrgTicketWorkOrderType,
    deleteOrgTicketWorkOrderType,
};
