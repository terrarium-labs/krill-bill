import { laiaFetch } from "../../0.core/basics";
import { TableFilters } from "@/types/general/filters";
import { calculateParams } from "@/utils/miscelanea";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/sick-leaves
const getSickLeaves = async (
  org_id: string,
  employee_id?: string,
  from_date?: string,
  to_date?: string,
  query?: string,
  page_token?: string,
  params?: TableFilters
) => {
  const url = new URL(`/orgs/${org_id}/sick-leaves`, baseApiUrl);
  const queryParams = new URLSearchParams();
  if (employee_id) queryParams.set("employee_id", employee_id);
  if (from_date) queryParams.set("from_date", from_date);
  if (to_date) queryParams.set("to_date", to_date);
  if (query) queryParams.set("query", query);
  if (page_token) queryParams.set("page_token", page_token);
  if (params) {
    queryParams.set("params", calculateParams(params));
  }
  url.search = queryParams.toString();
  const response = await laiaFetch(url, { method: "GET" });
  return response;
};

// GET /orgs/{org_id}/sick-leaves/{sick_leave_id}
const getSickLeave = async (org_id: string, sick_leave_id: string) => {
  const url = new URL(
    `/orgs/${org_id}/sick-leaves/${sick_leave_id}`,
    baseApiUrl
  );
  const response = await laiaFetch(url, { method: "GET" });
  return response;
};

// POST /orgs/{org_id}/sick-leaves
const postSickLeave = async (org_id: string, data: any) => {
  const url = new URL(`/orgs/${org_id}/sick-leaves`, baseApiUrl);
  const response = await laiaFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response;
};

// PATCH /orgs/{org_id}/sick-leaves/{sick_leave_id}
const patchSickLeave = async (
  org_id: string,
  sick_leave_id: string,
  data: any
) => {
  const url = new URL(
    `/orgs/${org_id}/sick-leaves/${sick_leave_id}`,
    baseApiUrl
  );
  const response = await laiaFetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response;
};

// DELETE /orgs/{org_id}/sick-leaves/{sick_leave_id}
const deleteSickLeave = async (org_id: string, sick_leave_id: string) => {
  const url = new URL(
    `/orgs/${org_id}/sick-leaves/${sick_leave_id}`,
    baseApiUrl
  );
  const response = await laiaFetch(url, { method: "DELETE" });
  return response;
};

export {
  getSickLeaves,
  getSickLeave,
  postSickLeave,
  patchSickLeave,
  deleteSickLeave,
};
