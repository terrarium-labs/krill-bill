import { laiaFetch } from "../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

export type { PageTemplate, PageTemplatesResponse } from "@/types/general/page-templates";

export const postPageTemplate = async (
    org_id: string,
    data: { type: string; data?: Record<string, unknown> }
) => {
    const url = new URL(`/orgs/${org_id}/page-templates`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

export const getPageTemplates = async (
    org_id: string,
    query?: string,
    page_token?: string
) => {
    const url = new URL(`/orgs/${org_id}/page-templates`, baseApiUrl);
    if (query) url.searchParams.set("query", query);
    if (page_token) url.searchParams.set("page_token", page_token);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

export const patchPageTemplate = async (
    org_id: string,
    page_template_id: string,
    data: { data: Record<string, unknown> }
) => {
    const url = new URL(
        `/orgs/${org_id}/page-templates/${page_template_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

export const deletePageTemplate = async (
    org_id: string,
    page_template_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/page-templates/${page_template_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};
