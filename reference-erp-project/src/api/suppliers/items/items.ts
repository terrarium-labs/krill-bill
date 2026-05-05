import { laiaFetch } from "../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

/*GET /orgs/{org_id}/suppliers/{supplier_id}/items List items */
export const getSupplierItems = async (org_id: string, supplier_id: string, query?: string, page_token?: string | null) => {
    const url = new URL(`/orgs/${org_id}/suppliers/${supplier_id}/items`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};