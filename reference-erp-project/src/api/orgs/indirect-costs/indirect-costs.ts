import { laiaFetch } from "../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

const getOrgIndirectCosts = async (org_id: string, entity?: string, query?: string, page_token?: string | null) => {
    const url = new URL(`/orgs/${org_id}/indirect-costs`, baseApiUrl);
    if (entity) {
        url.searchParams.append("entity", entity);
    }
    if (query) {
        url.searchParams.append("query", query);
    }
    if (page_token) {
        url.searchParams.append("page_token", page_token);
    }
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

const getOrgIndirectCost = async (org_id: string, indirect_cost_id: string) => {
    const url = new URL(`/orgs/${org_id}/indirect-costs/${indirect_cost_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

const postOrgIndirectCost = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/indirect-costs`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return response;
};

const patchOrgIndirectCost = async (org_id: string, indirect_cost_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/indirect-costs/${indirect_cost_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return response;
};

const deleteOrgIndirectCost = async (org_id: string, indirect_cost_id: string) => {
    const url = new URL(`/orgs/${org_id}/indirect-costs/${indirect_cost_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

export { getOrgIndirectCosts, getOrgIndirectCost, postOrgIndirectCost, patchOrgIndirectCost, deleteOrgIndirectCost };
