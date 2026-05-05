import { laiaFetch } from "../../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// POST /orgs/{org_id}/admin/news - Create a news article
export const postNews = async (
    org_id: string,
    data: any
) => {
    const url = new URL(`/orgs/${org_id}/admin/news`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// GET /orgs/{org_id}/admin/news - List admin news articles
export const getNewsList = async (
    org_id: string,
    query?: string,
    page_token?: string | null,
    status?: string[],
    not_news_id?: string
) => {
    const url = new URL(`/orgs/${org_id}/admin/news`, baseApiUrl);
    const queryParams = new URLSearchParams();

    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    if (status) status.forEach(status => queryParams.append("status", status));
    if (not_news_id) queryParams.set("not_news_id", not_news_id);

    url.search = queryParams.toString();

    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// GET /orgs/{org_id}/admin/news/{news_id} - Get a news article
export const getNews = async (org_id: string, news_id: string) => {
    const url = new URL(`/orgs/${org_id}/admin/news/${news_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// PATCH /orgs/{org_id}/admin/news/{news_id} - Update a news article
export const patchNews = async (
    org_id: string,
    news_id: string,
    data: any
) => {
    const url = new URL(`/orgs/${org_id}/admin/news/${news_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/admin/news/{news_id} - Delete a news article
export const deleteNews = async (org_id: string, news_id: string) => {
    const url = new URL(`/orgs/${org_id}/admin/news/${news_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

// GET /orgs/{org_id}/admin/news/{news_id}/related-news - Get related news articles
export const getRelatedNews = async (
    org_id: string,
    news_id: string,
    page_token?: string | null
) => {
    const url = new URL(`/orgs/${org_id}/admin/news/${news_id}/related-news`, baseApiUrl);

    if (page_token) {
        url.searchParams.set("page_token", page_token);
    }

    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

