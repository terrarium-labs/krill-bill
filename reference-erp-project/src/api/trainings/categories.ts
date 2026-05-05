import { laiaFetch } from "../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

export const getTrainingCategories = async (
    org_id: string,
    query: string | null = null
) => {
    const url = new URL(`/orgs/${org_id}/training-categories`, baseApiUrl);
    if (query) {
        url.searchParams.set("query", query);
    }
    return await laiaFetch(url, { method: "GET" });
};

/** For `MultiSelectApi`: accepts extra args (query, page token, filters) from the component. */
export const getTrainingCategoriesForMultiSelect = async (
    org_id: string,
    query?: string | null,
    ..._rest: unknown[]
) => {
    return getTrainingCategories(org_id, query ?? null);
};

export const postTrainingCategory = async (
    org_id: string,
    data: Record<string, unknown>
) => {
    const url = new URL(`/orgs/${org_id}/training-categories`, baseApiUrl);
    return await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
};

export const patchTrainingCategory = async (
    org_id: string,
    category_id: string,
    data: Record<string, unknown>
) => {
    const url = new URL(
        `/orgs/${org_id}/training-categories/${category_id}`,
        baseApiUrl
    );
    return await laiaFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
};

export const deleteTrainingCategory = async (
    org_id: string,
    category_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/training-categories/${category_id}`,
        baseApiUrl
    );
    return await laiaFetch(url, { method: "DELETE" });
};
