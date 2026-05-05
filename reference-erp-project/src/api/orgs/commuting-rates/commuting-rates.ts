import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/commuting-rates -> List commuting rates for an org
const getOrgCommutingRates = async (org_id: string, query?: string, page_token?: string) => {
    const url = new URL(`/orgs/${org_id}/commuting-rates`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// GET /orgs/{org_id}/commuting-rates/{commuting_rate_id} -> Get a commuting rate for an org
const getOrgCommutingRate = async (org_id: string, commuting_rate_id: string) => {
    const url = new URL(`/orgs/${org_id}/commuting-rates/${commuting_rate_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/commuting-rates -> Create a commuting rate for an org
const postOrgCommutingRate = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/commuting-rates`, baseApiUrl);
    const response = await laiaFetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    return response;
};

// PATCH /orgs/{org_id}/commuting-rates/{commuting_rate_id} -> Update a commuting rate for an org
const patchOrgCommutingRate = async (org_id: string, commuting_rate_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/commuting-rates/${commuting_rate_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    return response;
};

// DELETE /orgs/{org_id}/commuting-rates/{commuting_rate_id} -> Delete a commuting rate for an org
const deleteOrgCommutingRate = async (org_id: string, commuting_rate_id: string) => {
    const url = new URL(`/orgs/${org_id}/commuting-rates/${commuting_rate_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

export { getOrgCommutingRates, getOrgCommutingRate, postOrgCommutingRate, patchOrgCommutingRate, deleteOrgCommutingRate };