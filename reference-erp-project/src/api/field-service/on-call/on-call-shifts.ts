import { calculateParams } from "@/utils/miscelanea";
import { laiaFetch } from "@/api/0.core/basics";
import { TableFilters } from "@/types/general/filters";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/on-call-shifts - fetch shifts for a date range
const getOrgOnCallShifts = async (
  org_id: string,
  from_date: string,
  to_date: string,
  query?: string,
  params?: TableFilters
) => {
  const url = new URL(`/orgs/${org_id}/on-call-shifts`, baseApiUrl);
  const queryParams = new URLSearchParams();
  queryParams.set("from_date", from_date);
  queryParams.set("to_date", to_date);
  if (query) {
    queryParams.set("query", query);
  }
  if (params) {
    queryParams.set("params", calculateParams(params));
  }
  url.search = queryParams.toString();
  const response = await laiaFetch(url, { method: "GET" });
  return response;
};

// POST /orgs/{org_id}/on-call-shifts - create shift
const postOrgOnCallShift = async (org_id: string, data: any) => {
  const url = new URL(`/orgs/${org_id}/on-call-shifts`, baseApiUrl);
  const response = await laiaFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response;
};

// PATCH /orgs/{org_id}/on-call-shifts/{shift_id} - update shift
const patchOrgOnCallShift = async (
  org_id: string,
  shift_id: string,
  data: any
) => {
  const url = new URL(`/orgs/${org_id}/on-call-shifts/${shift_id}`, baseApiUrl);
  const response = await laiaFetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response;
};

// DELETE /orgs/{org_id}/on-call-shifts/{shift_id} - delete shift
const deleteOrgOnCallShift = async (org_id: string, shift_id: string) => {
  const url = new URL(`/orgs/${org_id}/on-call-shifts/${shift_id}`, baseApiUrl);
  const response = await laiaFetch(url, { method: "DELETE" });
  return response;
};

// POST /orgs/{org_id}/on-call-shifts/{on_call_shift_id}/employees
const postOrgOnCallShiftEmployees = async (org_id: string, on_call_shift_id: string, data: any) => {
  const url = new URL(`/orgs/${org_id}/on-call-shifts/${on_call_shift_id}/employees`, baseApiUrl);
  const response = await laiaFetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return response;
};

// DELETE /orgs/{org_id}/on-call-shifts/{on_call_shift_id}/employees

const deleteOrgOnCallShiftEmployees = async (org_id: string, on_call_shift_id: string, data: any) => {
  const url = new URL(`/orgs/${org_id}/on-call-shifts/${on_call_shift_id}/employees`, baseApiUrl);
  const response = await laiaFetch(url, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return response;
};

export {
  getOrgOnCallShifts,
  postOrgOnCallShift,
  patchOrgOnCallShift,
  deleteOrgOnCallShift,
  postOrgOnCallShiftEmployees,
  deleteOrgOnCallShiftEmployees,
};
