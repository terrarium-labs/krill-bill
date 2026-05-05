import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/work-orders/{work_order_id}/contacts
const getWorkOrderContacts = async (org_id: string, work_order_id: string) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/contacts`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/work-orders/{work_order_id}/contacts
const postWorkOrderContact = async (org_id: string, work_order_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/contacts`, baseApiUrl);
    const response = await laiaFetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    return response;
};

// GET /orgs/{org_id}/work-orders/{work_order_id}/contacts/{contact_id}
const getWorkOrderContact = async (org_id: string, work_order_id: string, contact_id: string) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/contacts/${contact_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// PATCH /orgs/{org_id}/work-orders/{work_order_id}/contacts/{contact_id}
const patchWorkOrderContact = async (org_id: string, work_order_id: string, contact_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/contacts/${contact_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    return response;
};

// DELETE /orgs/{org_id}/work-orders/{work_order_id}/contacts/{contact_id}
const deleteWorkOrderContact = async (org_id: string, work_order_id: string, contact_id: string) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/contacts/${contact_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

export { getWorkOrderContacts, postWorkOrderContact, getWorkOrderContact, patchWorkOrderContact, deleteWorkOrderContact };