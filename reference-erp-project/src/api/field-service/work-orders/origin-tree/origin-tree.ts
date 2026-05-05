import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/work-orders/{work_order_id}/origin-tree -> Origin tree for a work order
const getWorkOrderOriginTree = async (org_id: string, work_order_id: string) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/origin-tree`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

export { getWorkOrderOriginTree };