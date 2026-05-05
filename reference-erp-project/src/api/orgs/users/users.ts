import { TableFilters } from "@/types/general/filters";
import { laiaFetch } from "../../0.core/basics";
import { calculateParams } from "@/utils/miscelanea";
import { baseApiUrl } from "@/api/0.core/url";

const getOrgUsers = async (orgId: string, not_users_ids?: string, query?: string, pageToken?: string, params?: TableFilters) => {
    const url = new URL(`/orgs/${orgId}/users`, baseApiUrl);
    if (not_users_ids) {
        url.searchParams.set("not_users_ids", not_users_ids);
    }
    if (query) {
        url.searchParams.set("query", query);
    }
    if (pageToken) {
        url.searchParams.set("page_token", pageToken);
    }
    if (params) {
        url.searchParams.set("params", calculateParams(params));
    }
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

const postOrgUser = async (orgId: string, data: any) => {
    const url = new URL(`/orgs/${orgId}/users`, baseApiUrl);
    const response = await laiaFetch(url,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data)
        });
    return response;
};

const postOrgUserAssign = async (orgId: string, userId: string, data: any) => {
    const url = new URL(`/orgs/${orgId}/users/${userId}/assign`, baseApiUrl);
    const response = await laiaFetch(url,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data)
        });
    return response;
};

const deleteOrgUser = async (orgId: string, userId: string) => {
    const url = new URL(`/orgs/${orgId}/users/${userId}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

export { getOrgUsers, postOrgUser, postOrgUserAssign, deleteOrgUser };
