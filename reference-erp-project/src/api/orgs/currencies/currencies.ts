import { laiaFetch } from "../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

const getOrgCurrencies = async (org_id: string, query?: string, page_token?: string | null) => {
    const url = new URL(`/orgs/${org_id}/currencies`, baseApiUrl);
    if (query) {
        url.searchParams.append("query", query);
    }
    if (page_token) {
        url.searchParams.append("page_token", page_token);
    }
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

const postOrgCurrency = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/currencies`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return response;
};

const deleteOrgCurrency = async (org_id: string, currency_id: string) => {
    const url = new URL(`/orgs/${org_id}/currencies/${currency_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

const patchOrgCurrency = async (org_id: string, currency_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/currencies/${currency_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return response;
};

export { getOrgCurrencies, postOrgCurrency, patchOrgCurrency, deleteOrgCurrency };