import { laiaFetch } from "../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

const getOrgsItemsHierarchies = async (org_id: string, query?: string, page_token?: string) => {
    const url = new URL(`/orgs/${org_id}/items-hierarchies`, baseApiUrl);
    if (query) {
        url.searchParams.set("query", query);
    }
    if (page_token) {
        url.searchParams.set("page_token", page_token);
    }
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

const postOrgsItemsHierarchies = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/items-hierarchies`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return response;
};

const getOrgsItemsHierarchy = async (org_id: string, item_hierarchy_id: string) => {
    const url = new URL(`/orgs/${org_id}/items-hierarchies/${item_hierarchy_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

const patchOrgsItemsHierarchy = async (org_id: string, item_hierarchy_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/items-hierarchies/${item_hierarchy_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return response;
};

const deleteOrgsItemsHierarchy = async (org_id: string, item_hierarchy_id: string) => {
    const url = new URL(`/orgs/${org_id}/items-hierarchies/${item_hierarchy_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

export {
    getOrgsItemsHierarchies,
    postOrgsItemsHierarchies,
    getOrgsItemsHierarchy,
    patchOrgsItemsHierarchy,
    deleteOrgsItemsHierarchy
};