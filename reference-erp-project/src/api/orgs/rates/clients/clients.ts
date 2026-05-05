import { laiaFetch } from "../../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

const getOrgRateClients = async (
    org_id: string,
    rate_id: string,
    query?: string,
    page_token?: string
) => {
    const url = new URL(`/orgs/${org_id}/rates/${rate_id}/clients`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

const postOrgRateClient = async (org_id: string, rate_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/rates/${rate_id}/clients`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

const deleteOrgRateClient = async (org_id: string, rate_id: string, client_id: string) => {
    const url = new URL(`/orgs/${org_id}/rates/${rate_id}/clients/${client_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

export { getOrgRateClients, postOrgRateClient, deleteOrgRateClient };
