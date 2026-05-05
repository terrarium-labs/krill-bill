import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/clients/{client_id}/rates - List rates for a client
const getClientRates = async (
    org_id: string,
    client_id: string,
    query: string | null,
    page_token: string | null
) => {
    const url = new URL(`/orgs/${org_id}/clients/${client_id}/rates`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/clients/{client_id}/rates - Add a client to a rate
const postClientRate = async (org_id: string, client_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/clients/${client_id}/rates`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/clients/{client_id}/rates/{rate_id} - Remove a client from a rate
const deleteClientRate = async (org_id: string, client_id: string, rate_id: string) => {
    const url = new URL(`/orgs/${org_id}/clients/${client_id}/rates/${rate_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

export { getClientRates, postClientRate, deleteClientRate };

