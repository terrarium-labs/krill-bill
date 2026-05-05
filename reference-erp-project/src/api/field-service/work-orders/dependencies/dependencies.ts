import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/work-orders/{work_order_id}/dependencies -> Dependencies for a work order
const getWorkOrderDependencies = async (org_id: string, work_order_id: string) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/dependencies`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/work-orders/{work_order_id}/dependencies
const postWorkOrderDependency = async (org_id: string, work_order_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/dependencies`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/work-orders/{work_order_id}/dependencies/{dependency_id}
const deleteWorkOrderDependency = async (org_id: string, work_order_id: string, dependency_id: string) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/dependencies/${dependency_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

export { getWorkOrderDependencies, postWorkOrderDependency, deleteWorkOrderDependency };