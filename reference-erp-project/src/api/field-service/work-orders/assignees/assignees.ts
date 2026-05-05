import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/work-orders/{work_order_id}/assignees -> Assignees for a work order
const getWorkOrderAssignees = async (org_id: string, work_order_id: string, include_cancelled?: boolean, query?: string, page_token?: string) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/assignees`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    if (include_cancelled) queryParams.set("include_cancelled", include_cancelled.toString());
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/work-orders/{work_order_id}/assignees
const postWorkOrderAssignee = async (org_id: string, work_order_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/assignees`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

// PATCH /orgs/{org_id}/work-orders/{work_order_id}/assignees/{assignee_id}
const patchWorkOrderAssignee = async (org_id: string, work_order_id: string, assignee_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/assignees/${assignee_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/work-orders/{work_order_id}/assignees/{assignee_id}
const deleteWorkOrderAssignee = async (org_id: string, work_order_id: string, assignee_id: string, data?: any) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/assignees/${assignee_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

export { getWorkOrderAssignees, postWorkOrderAssignee, patchWorkOrderAssignee, deleteWorkOrderAssignee };