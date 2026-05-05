import { laiaFetch } from '@/api/0.core/basics';
import { TableFilters } from '@/types/general/filters';
import { calculateParams } from '@/utils/miscelanea';
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/tickets -> List tickets for an org
const getOrgTickets = async (org_id: string, client_id?: string, location_id?: string, query?: string, page_token?: string, params?: TableFilters) => {
    const url = new URL(`/orgs/${org_id}/tickets`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (client_id) queryParams.set("client_id", client_id);
    if (location_id) queryParams.set("location_id", location_id);
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    if (params) {
        queryParams.set("params", calculateParams(params));
    }
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// GET /orgs/{org_id}/tickets/{ticket_id} -> Get a ticket
const getOrgTicket = async (org_id: string, ticket_id: string) => {
    const url = new URL(`/orgs/${org_id}/tickets/${ticket_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/tickets -> Create a ticket
const postOrgTicket = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/tickets`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/tickets/{ticket_id} -> Delete a ticket
const deleteOrgTicket = async (org_id: string, ticket_id: string) => {
    const url = new URL(`/orgs/${org_id}/tickets/${ticket_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

// PATCH /orgs/{org_id}/tickets/{ticket_id} -> Update a ticket
const patchOrgTicket = async (org_id: string, ticket_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/tickets/${ticket_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// GET /orgs/{org_id}/admin/tickets
const getOrgAdminTickets = async (org_id: string, query?: string, page_token?: string, params?: TableFilters) => {
    const url = new URL(`/orgs/${org_id}/admin/tickets`, baseApiUrl);
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

// GET /orgs/{org_id}/admin/tickets/{ticket_id}
const getOrgAdminTicket = async (org_id: string, ticket_id: string) => {
    const url = new URL(`/orgs/${org_id}/admin/tickets/${ticket_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/admin/tickets
const postOrgAdminTicket = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/admin/tickets`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// PATCH /orgs/{org_id}/admin/tickets/{ticket_id}
const patchOrgAdminTicket = async (org_id: string, ticket_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/admin/tickets/${ticket_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/admin/tickets/{ticket_id}
const deleteOrgAdminTicket = async (org_id: string, ticket_id: string) => {
    const url = new URL(`/orgs/${org_id}/admin/tickets/${ticket_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

export {
    getOrgTickets,
    postOrgTicket,
    getOrgTicket,
    deleteOrgTicket,
    patchOrgTicket,
    getOrgAdminTickets,
    getOrgAdminTicket,
    postOrgAdminTicket,
    patchOrgAdminTicket,
    deleteOrgAdminTicket,
};