import { laiaFetch } from "../../../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

/*GET /orgs/{org_id}/orders/{order_id}/deliveries/{delivery_id}/items List order delivery items*/
const getOrgOrderDeliveryItems = async (org_id: string, order_id: string, delivery_id: string, query?: string, page_token?: string) => {
    const url = new URL(`/orgs/${org_id}/orders/${order_id}/deliveries/${delivery_id}/items`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

export { getOrgOrderDeliveryItems };
