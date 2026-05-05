import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

const getOrgCommutingRateClients = async (
    org_id: string,
    commuting_rate_id: string,
    query?: string,
    page_token?: string
) => {
    const url = new URL(`/orgs/${org_id}/commuting-rates/${commuting_rate_id}/clients`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

const postOrgCommutingRateClient = async (
    org_id: string,
    commuting_rate_id: string,
    data: { client_ids?: string[] | null; location_ids?: string[] | null; valid_from?: string | null; valid_to?: string | null }
) => {
    const url = new URL(`/orgs/${org_id}/commuting-rates/${commuting_rate_id}/clients`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

const deleteOrgCommutingRateClient = async (
    org_id: string,
    commuting_rate_id: string,
    data: { client_ids: string[] | null; location_ids?: string[] | null }
) => {
    const url = new URL(`/orgs/${org_id}/commuting-rates/${commuting_rate_id}/clients`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

export { getOrgCommutingRateClients, postOrgCommutingRateClient, deleteOrgCommutingRateClient };
