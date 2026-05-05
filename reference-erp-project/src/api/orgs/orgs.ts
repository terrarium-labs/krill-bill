import { laiaFetch } from '../0.core/basics';
import { TableFilters } from '@/types/general/filters';
import { calculateParams } from '@/utils/miscelanea';
import { baseApiUrl } from "@/api/0.core/url";
import { OrgSettings } from '@/types/general/org';

// POST /orgs -> { id: string, name: string, description: string, etc. }
export const postOrg = async (data: any) => {
    const url = new URL("/orgs", baseApiUrl);

    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// GET /orgs/{org_id} -> { id: string, name: string, description: string }
export const getOrg = async (org_id: string) => {
    const url = new URL(`/orgs/${org_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// PATCH /orgs/{org_id} -> { id: string, name: string, description: string }
export const patchOrg = async (
    org_id: string,
    data: OrgSettings
) => {
    const url = new URL(`/orgs/${org_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

// GET /orgs/{org_id}/audit-logs -> { audit_logs: Array<{ id: string, created_at: string, updated_at: string, user_id: string, action: string, description: string }> }
export const getOrgAuditLogs = async (
    org_id: string,
    query?: string,
    page_token?: string,
    params?: TableFilters
) => {
    const url = new URL(`/orgs/${org_id}/audit-logs`, baseApiUrl);
    if (query) {
        url.searchParams.set("query", query);
    }
    if (page_token) {
        url.searchParams.set("page_token", page_token);
    }
    if (params) {
        url.searchParams.set("params", calculateParams(params));
    }
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};
