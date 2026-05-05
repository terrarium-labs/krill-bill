import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/work-orders/{work_order_id}/indirect-costs -> List indirect costs for a work order
const getWorkOrderIndirectCosts = async (org_id: string, work_order_id: string) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/indirect-costs`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/work-orders/{work_order_id}/indirect-costs/{indirect_cost_id}/activate -> Toggle activate/deactivate
const postWorkOrderIndirectCostActivate = async (org_id: string, work_order_id: string, indirect_cost_id: string) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/indirect-costs/${indirect_cost_id}/activate`, baseApiUrl);
    const response = await laiaFetch(url, { method: "POST" });
    return response;
};

export { getWorkOrderIndirectCosts, postWorkOrderIndirectCostActivate };
