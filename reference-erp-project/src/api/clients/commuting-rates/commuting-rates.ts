import { laiaFetch } from "@/api/0.core/basics";
import { deleteOrgCommutingRateClient, postOrgCommutingRateClient } from "@/api/orgs/commuting-rates/clients/clients";
import { TableFilters } from "@/types/general/filters";
import { calculateParams } from "@/utils/miscelanea";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/clients/{client_id}/commuting-rates - List commuting rates for a client
const getClientCommutingRates = async (
    org_id: string,
    client_id: string,
    query: string | null,
    page_token: string | null
) => {
    const url = new URL(`/orgs/${org_id}/clients/${client_id}/commuting-rates`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST - Add client to commuting rate (via orgs API)
const postClientCommutingRate = async (
    org_id: string,
    client_ids: string[],
    commuting_rate_id: string,
    data?: { location_ids?: string[] | null, valid_from?: string | null , valid_to?: string | null }
) => {
    const locationIds = data?.location_ids ?? null;
    const payload: { client_ids?: string[] | null; location_ids?: string[] | null; valid_from?: string | null; valid_to?: string | null } = {
        location_ids: locationIds,
        valid_from: data?.valid_from ?? null,
        valid_to: data?.valid_to ?? null,
    };

    if (!locationIds) {
        payload.client_ids = client_ids;
    }

    return postOrgCommutingRateClient(org_id, commuting_rate_id, payload);
};

// DELETE - Remove client from commuting rate (via orgs API)
const deleteClientCommutingRate = async (
    org_id: string,
    client_id: string,
    commuting_rate_id: string,
    data?: { location_ids?: string[] | null }
) => {
    return deleteOrgCommutingRateClient(org_id, commuting_rate_id, {
        client_ids: [client_id],
        location_ids: data?.location_ids ?? null,
    });
};

// GET /orgs/{org_id}/clients/{client_id}/commuting-rates/{commuting_rate_id}/locations
const getClientCommutingRateLocations = async (
    org_id: string,
    client_id: string,
    commuting_rate_id: string,
    query: string | null,
    page_token: string | null,
    params?: TableFilters
) => {
    const url = new URL(`/orgs/${org_id}/clients/${client_id}/commuting-rates/${commuting_rate_id}/locations`, baseApiUrl);
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
export { getClientCommutingRates, getClientCommutingRateLocations, postClientCommutingRate, deleteClientCommutingRate };