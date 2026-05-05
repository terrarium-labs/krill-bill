import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";


// GET /orgs/{org_id}/tickets/{ticket_id}/supervisors
const getOrgTicketSupervisors = async (org_id: string, ticket_id: string, query?: string, page_token?: string) => {
    const url = new URL(`/orgs/${org_id}/tickets/${ticket_id}/supervisors`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/tickets/{ticket_id}/supervisors
const postOrgTicketSupervisor = async (org_id: string, ticket_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/tickets/${ticket_id}/supervisors`, baseApiUrl);
    const response = await laiaFetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    return response;
};

// DELETE /orgs/{org_id}/tickets/{ticket_id}/supervisors/{supervisor_id}
const deleteOrgTicketSupervisor = async (org_id: string, ticket_id: string, supervisor_id: string) => {
    const url = new URL(`/orgs/${org_id}/tickets/${ticket_id}/supervisors/${supervisor_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

export { getOrgTicketSupervisors, postOrgTicketSupervisor, deleteOrgTicketSupervisor };