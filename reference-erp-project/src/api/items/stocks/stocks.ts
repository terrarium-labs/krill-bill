import { laiaFetch } from "../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

/*GET /orgs/{org_id}/items/{item_id}/stocks Get the stock of an item */
const getOrgItemStocks = async (
    org_id: string,
    item_id: string,
    query?: string,
    page_token?: string
) => {
    const url = new URL(`/orgs/${org_id}/items/${item_id}/stocks`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (page_token) queryParams.set("page_token", page_token);
    if (query) queryParams.set("query", query);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

/*GET /orgs/{org_id}/items/{item_id}/stock-history Get the transactions of an item */
const getOrgItemStockHistory = async (
    org_id: string,
    item_id: string,
    location_id?: string,
    init_date?: string,
    end_date?: string,
    query?: string,
    page_token?: string
) => {
    const url = new URL(`/orgs/${org_id}/items/${item_id}/stock-history`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (page_token) queryParams.set("page_token", page_token);
    if (query) queryParams.set("query", query);
    if (init_date) queryParams.set("init_date", init_date);
    if (end_date) queryParams.set("end_date", end_date);
    if (location_id) queryParams.set("location_id", location_id);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

export {
    getOrgItemStocks,
    getOrgItemStockHistory
};

