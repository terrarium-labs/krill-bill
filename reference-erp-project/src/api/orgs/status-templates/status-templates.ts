import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/status-templates
const getOrgStatusTemplates = async (org_id: string, page_token?: string) => {
    const url = new URL(`/orgs/${org_id}/status-templates`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/status-templates
const postOrgStatusTemplate = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/status-templates`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

// GET /orgs/{org_id}/status-templates/{status_template_id}
const getOrgStatusTemplate = async (org_id: string, status_template_id: string) => {
    const url = new URL(`/orgs/${org_id}/status-templates/${status_template_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// PATCH /orgs/{org_id}/status-templates/{status_template_id}
const patchOrgStatusTemplate = async (org_id: string, status_template_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/status-templates/${status_template_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/status-templates/{status_template_id}

const deleteOrgStatusTemplate = async (org_id: string, status_template_id: string) => {
    const url = new URL(`/orgs/${org_id}/status-templates/${status_template_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

// GET /orgs/{org_id}/status-templates/{status_template_id}/statuses
const getOrgStatusTemplateStatuses = async (org_id: string, status_template_id: string) => {
    const url = new URL(`/orgs/${org_id}/status-templates/${status_template_id}/statuses`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

export { getOrgStatusTemplates, postOrgStatusTemplate, getOrgStatusTemplate, patchOrgStatusTemplate, deleteOrgStatusTemplate, getOrgStatusTemplateStatuses };