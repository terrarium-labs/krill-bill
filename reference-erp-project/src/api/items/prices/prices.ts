import { laiaFetch } from "../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

/*GET /orgs/{org_id}/items/{item_id}/prices List prices */
const getOrgItemPrices = async (
    org_id: string,
    item_id: string,
    type?: "buy" | "sell",
    query?: string,
    page_token?: string
) => {
    const url = new URL(`/orgs/${org_id}/items/${item_id}/prices`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (type) queryParams.set("type", type);
    if (page_token) queryParams.set("page_token", page_token);
    if (query) queryParams.set("query", query);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

/*POST /orgs/{org_id}/items/{item_id}/prices Create price */
const postOrgItemPrice = async (org_id: string, item_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/items/${item_id}/prices`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

/*GET /orgs/{org_id}/items/{item_id}/prices/{price_id} Get price */
const getOrgItemPrice = async (org_id: string, item_id: string, price_id: string) => {
    const url = new URL(`/orgs/${org_id}/items/${item_id}/prices/${price_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

/*PATCH /orgs/{org_id}/items/{item_id}/prices/{price_id} Update price */
const patchOrgItemPrice = async (org_id: string, item_id: string, price_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/items/${item_id}/prices/${price_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

/*DELETE /orgs/{org_id}/items/{item_id}/prices/{price_id} Delete price */
const deleteOrgItemPrice = async (org_id: string, item_id: string, price_id: string) => {
    const url = new URL(`/orgs/${org_id}/items/${item_id}/prices/${price_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "DELETE"
    });
    return response;
};

/*POST /orgs/{org_id}/items/{item_id}/prices/{price_id}/default Set default price */
const postOrgItemPriceDefault = async (org_id: string, item_id: string, price_id: string) => {
    const url = new URL(`/orgs/${org_id}/items/${item_id}/prices/${price_id}/default`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
    });
    return response;
};

/*POST /orgs/{org_id}/items/{item_id}/prices/{price_id}/priority Set priority */
const postOrgItemPricePriority = async (org_id: string, item_id: string, price_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/items/${item_id}/prices/${price_id}/priority`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

export {
    getOrgItemPrices,
    postOrgItemPrice,
    getOrgItemPrice,
    patchOrgItemPrice,
    deleteOrgItemPrice,
    postOrgItemPriceDefault,
    postOrgItemPricePriority
};

