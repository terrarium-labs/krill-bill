import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// POST /orgs/{org_id}/groups -> {"name": "string", "description": "string", "icon_url": "string", "parent_id": "string", "type": "area", "responsible_id": "string"}
const postOrgGroup = async (org_id: string, data: any) => {
  const url = new URL(`/orgs/${org_id}/groups`, baseApiUrl);
  const response = await laiaFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return response;
};

// GET /orgs/{org_id}/groups -> { group: { id: string, name: string, description: string, created_at: string, updated_at: string } }
const getOrgGroups = async (
  org_id: string,
  query?: string,
  page_token?: string
) => {
  const url = new URL(`/orgs/${org_id}/groups`, baseApiUrl);
  const queryParams = new URLSearchParams();
  if (query) queryParams.set("query", query);
  if (page_token) queryParams.set("page_token", page_token);
  url.search = queryParams.toString();
  const response = await laiaFetch(url, { method: "GET" });
  return response;
};

// GET /orgs/{org_id}/groups/{group_id} -> { group: { id: string, name: string, description: string, created_at: string, updated_at: string } }
const getOrgGroup = async (org_id: string, group_id: string) => {
  const url = new URL(`/orgs/${org_id}/groups/${group_id}`, baseApiUrl);
  const response = await laiaFetch(url, { method: "GET" });
  return response;
};

// DELETE /orgs/{org_id}/groups/{group_id} -> 204 No Content
const deleteOrgGroup = async (org_id: string, group_id: string) => {
  const url = new URL(`/orgs/${org_id}/groups/${group_id}`, baseApiUrl);
  const response = await laiaFetch(url, { method: "DELETE" });
  return response;
};

// PATCH /orgs/{org_id}/groups/{group_id} -> { group: { id: string, name: string, description: string, created_at: string, updated_at: string } }
const patchOrgGroup = async (org_id: string, group_id: string, data: any) => {
  const url = new URL(`/orgs/${org_id}/groups/${group_id}`, baseApiUrl);
  const response = await laiaFetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return response;
};

// Orgs Groups Users #########################################################

// POST /orgs/{org_id}/groups/{group_id}/users -> { user: { id: string, name: string, email: string, phone: string, photo_url: string, role: string, department: string, status: string, hire_date: string, location: string, manager: string, skills: Array<string>, employment_type: string, permissions: Array<string>, last_login: string, created_at: string, updated_at: string } }
const postOrgGroupEmployee = async (
  org_id: string,
  group_id: string,
  data: any
) => {
  const url = new URL(`/orgs/${org_id}/groups/${group_id}/employees`, baseApiUrl);
  const response = await laiaFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return response;
};

// DELETE /orgs/{org_id}/groups/{group_id}/users -> 204 No Content
const deleteOrgGroupEmployee = async (
  org_id: string,
  group_id: string,
  data: any
) => {
  const url = new URL(`/orgs/${org_id}/groups/${group_id}/employees`, baseApiUrl);
  const response = await laiaFetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return response;
};

// GET /orgs/{org_id}/groups/{group_id}/users -> { users: Array<{ id: string, name: string, email: string, phone: string, photo_url: string, role: string, department: string, status: string, hire_date: string, location: string, manager: string, skills: Array<string>, employment_type: string, permissions: Array<string>, last_login: string, created_at: string, updated_at: string }> }
const getOrgGroupEmployees = async (org_id: string, group_id: string, page_token: string | null, query: string | null) => {
  const url = new URL(`/orgs/${org_id}/groups/${group_id}/employees`, baseApiUrl);
  const queryParams = new URLSearchParams();
  if (page_token) queryParams.set("page_token", page_token);
  if (query) queryParams.set("query", query);
  url.search = queryParams.toString();
  const response = await laiaFetch(url, { method: "GET" });
  return response;
};

export { postOrgGroup, getOrgGroups, getOrgGroup, deleteOrgGroup, patchOrgGroup, postOrgGroupEmployee, deleteOrgGroupEmployee, getOrgGroupEmployees };
