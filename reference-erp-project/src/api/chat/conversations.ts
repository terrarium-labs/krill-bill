import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";
import type { TableFilters } from "@/types/general/filters";
import { calculateParams } from "@/utils/miscelanea";

const getCharlesConversations = async (
    org_id: string,
    query?: string,
    page_token?: string | null,
    params?: TableFilters,
) => {
    const url = new URL(`/orgs/${org_id}/charles-conversations`, baseApiUrl);
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

const getCharlesConversationRuns = async (
    org_id: string,
    group_id: string,
    page_token?: string | null,
) => {
    const url = new URL(
        `/orgs/${org_id}/charles-conversations/${group_id}/runs`,
        baseApiUrl,
    );
    if (page_token) url.searchParams.set("page_token", page_token);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

export { getCharlesConversations, getCharlesConversationRuns };
