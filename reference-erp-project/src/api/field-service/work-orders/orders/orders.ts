import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/work-orders/{work_order_id}/orders -> Get a work order's orders
const getWorkOrderOrders = async (org_id: string, work_order_id: string) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/orders`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
}

export { getWorkOrderOrders };