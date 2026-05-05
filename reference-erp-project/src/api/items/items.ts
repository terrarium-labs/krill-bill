import { TableFilters } from "@/types/general/filters";
import { laiaFetch } from "@/api/0.core/basics";
import { calculateParams } from "@/utils/miscelanea";
import { baseApiUrl } from "@/api/0.core/url";

/*POST /orgs/{org_id}/items Create an item*/
const postOrgItems = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/items`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};


/*GET /orgs/{org_id}/items List items */
const getOrgItems = async (org_id: string, bundle_id?: string, not_items_ids?: string[], query?: string, page_token?: string, params?: TableFilters) => {
    const url = new URL(`/orgs/${org_id}/items`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (bundle_id) queryParams.set("bundle_id", bundle_id);
    if (not_items_ids) {
        not_items_ids.forEach(id => queryParams.append("not_items_ids", id));
    }
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    if (params) {
        queryParams.set("params", calculateParams(params));
    }
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

/*GET /orgs/{org_id}/items/{item_id} Get an item */
const getOrgItem = async (org_id: string, item_id: string) => {
    const url = new URL(`/orgs/${org_id}/items/${item_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};


/*PATCH /orgs/{org_id}/items/{item_id} Update an item*/
const patchOrgItem = async (org_id: string, item_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/items/${item_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return response;
};


/*DELETE /orgs/{org_id}/items/{item_id} -> 204 No Content Delete an item */
const deleteOrgItem = async (org_id: string, item_id: string) => {
    const url = new URL(`/orgs/${org_id}/items/${item_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "DELETE"
    });
    return response;
};

export { postOrgItems, getOrgItems, getOrgItem, patchOrgItem, deleteOrgItem };