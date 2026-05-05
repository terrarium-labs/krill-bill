import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/clients/{client_id}/items-prices - List items prices for a client
const getClientItemsPrices = async (
    org_id: string,
    client_id: string,
    query?: string | null,
    page_token?: string | null
) => {
    const url = new URL(`/orgs/${org_id}/clients/${client_id}/items-prices`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

export { getClientItemsPrices };
