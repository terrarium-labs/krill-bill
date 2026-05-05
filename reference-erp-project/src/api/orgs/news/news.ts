import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/news -> { news: Array<{ id: string, title: string, content: string, created_at: string, updated_at: string }> }
const getOrgNews = async (org_id: string, query: string | null, page_token: string | null) => {
    const url = new URL(`/orgs/${org_id}/news`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// GET /orgs/{org_id}/news/{news_id} -> { news: { id: string, title: string, content: string, created_at: string, updated_at: string } }
const getOrgNewsBySlugOrId = async (org_id: string, news_id_or_slug: string) => {
    const url = new URL(`/orgs/${org_id}/news/${news_id_or_slug}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
}

// GET /orgs/{org_id}/news/{news_id}/related-news -> { related_news: Array<{ id: string, title: string, content: string, created_at: string, updated_at: string }> }
const getOrgNewsRelatedNews = async (org_id: string, news_id: string, page_token: string | null) => {
    const url = new URL(`/orgs/${org_id}/news/${news_id}/related-news`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
}

// GET /orgs/{org_id}/news/{news_id}/reactions
const getOrgNewsReactions = async (org_id: string, news_id: string) => {
    const url = new URL(`/orgs/${org_id}/news/${news_id}/reactions`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
}

// POST /orgs/{org_id}/news/{news_id}/reactions
const postOrgNewsReaction = async (org_id: string, news_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/news/${news_id}/reactions`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
}

export { getOrgNews, getOrgNewsBySlugOrId, getOrgNewsRelatedNews, getOrgNewsReactions, postOrgNewsReaction };