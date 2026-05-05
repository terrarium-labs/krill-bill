import { laiaFetch } from "../../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

/*GET /orgs/{org_id}/items-hierarchies/{item_hierarchy_id}/items - List items in hierarchy*/
const getOrgsItemsHierarchyItems = async (
    org_id: string,
    item_hierarchy_id: string,
    query?: string,
    page_token?: string | null
) => {
    const url = new URL(`/orgs/${org_id}/items-hierarchies/${item_hierarchy_id}/items`, baseApiUrl);
    if (query) {
        url.searchParams.set("query", query);
    }
    if (page_token) {
        url.searchParams.set("page_token", page_token);
    }
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

/*POST /orgs/{org_id}/items-hierarchies/{item_hierarchy_id}/items - Add item to hierarchy*/
const postOrgsItemsHierarchyItems = async (
    org_id: string,
    item_hierarchy_id: string,
    data: { items_ids: string[] }
) => {
    const url = new URL(`/orgs/${org_id}/items-hierarchies/${item_hierarchy_id}/items`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return response;
};

/*DELETE /orgs/{org_id}/items-hierarchies/{item_hierarchy_id}/items - Remove item from hierarchy*/
const deleteOrgsItemsHierarchyItems = async (
    org_id: string,
    item_hierarchy_id: string,
    data: { items_ids: string[] }
) => {
    const url = new URL(`/orgs/${org_id}/items-hierarchies/${item_hierarchy_id}/items`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return response;
};

export {
    getOrgsItemsHierarchyItems,
    postOrgsItemsHierarchyItems,
    deleteOrgsItemsHierarchyItems
};

