import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/work-orders/{work_order_id}/billable-commutings
const getWorkOrderBillableCommutings = async (org_id: string, work_order_id: string) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/billable-commutings`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// PATCH /orgs/{org_id}/work-orders/{work_order_id}/billable-commutings
const patchWorkOrderBillableCommutings = async (org_id: string, work_order_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/billable-commutings`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

export { getWorkOrderBillableCommutings, patchWorkOrderBillableCommutings };
