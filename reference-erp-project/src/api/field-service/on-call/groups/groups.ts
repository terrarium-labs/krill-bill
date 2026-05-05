import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/on-call-groups
const getOrgOnCallGroups = async (org_id: string, query?: string, page_token?: string) => {
    const url = new URL(`/orgs/${org_id}/on-call-groups`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// GET /orgs/{org_id}/on-call-groups/{on_call_group_id}
const getOrgOnCallGroup = async (org_id: string, on_call_group_id: string) => {
    const url = new URL(`/orgs/${org_id}/on-call-groups/${on_call_group_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/on-call-groups
const postOrgOnCallGroup = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/on-call-groups`, baseApiUrl);
    const response = await laiaFetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    return response;
};

// PATCH /orgs/{org_id}/on-call-groups/{on_call_group_id}
const patchOrgOnCallGroup = async (org_id: string, on_call_group_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/on-call-groups/${on_call_group_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    return response;
};

// DELETE /orgs/{org_id}/on-call-groups/{on_call_group_id}
const deleteOrgOnCallGroup = async (org_id: string, on_call_group_id: string) => {
    const url = new URL(`/orgs/${org_id}/on-call-groups/${on_call_group_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

// GET /orgs/{org_id}/on-call-groups/{on_call_group_id}/employees
const getOrgOnCallGroupEmployees = async (org_id: string, on_call_group_id: string, query?: string, page_token?: string) => {
    const url = new URL(`/orgs/${org_id}/on-call-groups/${on_call_group_id}/employees`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (page_token) queryParams.set("page_token", page_token);
    if (query) queryParams.set("query", query);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/on-call-groups/{on_call_group_id}/employees -> {"employees_ids": ["string"]}
const postOrgOnCallGroupEmployee = async (org_id: string, on_call_group_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/on-call-groups/${on_call_group_id}/employees`, baseApiUrl);
    const response = await laiaFetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    return response;
};

// DELETE /orgs/{org_id}/on-call-groups/{on_call_group_id}/employees -> {"employees_ids": ["string"]}
const deleteOrgOnCallGroupEmployee = async (org_id: string, on_call_group_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/on-call-groups/${on_call_group_id}/employees`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    return response;
};

export { getOrgOnCallGroups, getOrgOnCallGroup, postOrgOnCallGroup, patchOrgOnCallGroup, deleteOrgOnCallGroup, getOrgOnCallGroupEmployees, postOrgOnCallGroupEmployee, deleteOrgOnCallGroupEmployee };