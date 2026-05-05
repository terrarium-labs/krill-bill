import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

const getBonusTypes = async (org_id: string, query?: string, page_token?: string | null) => {
    const url = new URL(`/orgs/${org_id}/bonus-types`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

const postBonusType = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/bonus-types`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

const getBonusType = async (org_id: string, bonus_type_id: string) => {
    const url = new URL(`/orgs/${org_id}/bonus-types/${bonus_type_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

const patchBonusType = async (org_id: string, bonus_type_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/bonus-types/${bonus_type_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

const deleteBonusType = async (org_id: string, bonus_type_id: string) => {
    const url = new URL(`/orgs/${org_id}/bonus-types/${bonus_type_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

export { getBonusTypes, postBonusType, getBonusType, patchBonusType, deleteBonusType };
