import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";


// GET /orgs/{org_id}/work-orders/{work_order_id}/time-trackings -> Time trackings for a work order
const getWorkOrderTimeTrackings = async (org_id: string, work_order_id: string, query?: string, page_token?: string) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/time-trackings`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/work-orders/{work_order_id}/time-trackings
const postWorkOrderTimeTracking = async (org_id: string, work_order_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/time-trackings`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

// PATCH /orgs/{org_id}/work-orders/{work_order_id}/time-trackings/{time_tracking_id}
const patchWorkOrderTimeTracking = async (org_id: string, work_order_id: string, time_tracking_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/time-trackings/${time_tracking_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/work-orders/{work_order_id}/time-trackings/{time_tracking_id}
const deleteWorkOrderTimeTracking = async (org_id: string, work_order_id: string, time_tracking_id: string) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/time-trackings/${time_tracking_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

// POST /orgs/{org_id}/work-orders/{work_order_id}/me/start-time-tracking
const postWorkOrderMeStartTimeTracking = async (org_id: string, work_order_id: string) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/me/start-time-tracking`, baseApiUrl);
    const response = await laiaFetch(url, { method: "POST" });
    return response;
};

// POST /orgs/{org_id}/work-orders/{work_order_id}/me/stop-time-tracking
const postWorkOrderMeStopTimeTracking = async (org_id: string, work_order_id: string) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/me/stop-time-tracking`, baseApiUrl);
    const response = await laiaFetch(url, { method: "POST" });
    return response;
};

// GET /orgs/{org_id}/work-orders/{work_order_id}/me/active-time-tracking
const getWorkOrderMeActiveTimeTracking = async (org_id: string, work_order_id: string) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/me/active-time-tracking`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

export {
    getWorkOrderTimeTrackings,
    postWorkOrderTimeTracking,
    patchWorkOrderTimeTracking,
    deleteWorkOrderTimeTracking,
    postWorkOrderMeStartTimeTracking,
    postWorkOrderMeStopTimeTracking,
    getWorkOrderMeActiveTimeTracking,
};