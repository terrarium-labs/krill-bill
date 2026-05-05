import { laiaFetch } from "../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/employees/{employee_id}/payrolls
const getEmployeePayrolls = async (
  org_id: string,
  employee_id: string,
  from_date?: string,
  to_date?: string,
  query?: string,
  page_token?: string
) => {
  const url = new URL(
    `/orgs/${org_id}/employees/${employee_id}/payrolls`,
    baseApiUrl
  );
  const queryParams = new URLSearchParams();
  if (query) queryParams.set("query", query);
  if (page_token) queryParams.set("page_token", page_token);
  if (from_date) queryParams.set("from_date", from_date);
  if (to_date) queryParams.set("to_date", to_date);
  url.search = queryParams.toString();
  const response = await laiaFetch(url, { method: "GET" });
  return response;
};

// POST /orgs/{org_id}/employees/{employee_id}/payrolls
const postEmployeePayroll = async (
  org_id: string,
  employee_id: string,
  data: any
) => {
  const url = new URL(
    `/orgs/${org_id}/employees/${employee_id}/payrolls`,
    baseApiUrl
  );
  const response = await laiaFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return response;
};

// GET /orgs/{org_id}/employees/{employee_id}/payrolls/{payroll_id}
const getEmployeePayroll = async (
  org_id: string,
  employee_id: string,
  payroll_id: string
) => {
  const url = new URL(
    `/orgs/${org_id}/employees/${employee_id}/payrolls/${payroll_id}`,
    baseApiUrl
  );
  const response = await laiaFetch(url, { method: "GET" });
  return response;
};

// PATCH /orgs/{org_id}/employees/{employee_id}/payrolls/{payroll_id}
const patchEmployeePayroll = async (
  org_id: string,
  employee_id: string,
  payroll_id: string,
  data: any
) => {
  const url = new URL(
    `/orgs/${org_id}/employees/${employee_id}/payrolls/${payroll_id}`,
    baseApiUrl
  );
  const response = await laiaFetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return response;
};

// DELETE /orgs/{org_id}/employees/{employee_id}/payrolls/{payroll_id}
const deleteEmployeePayroll = async (
  org_id: string,
  employee_id: string,
  payroll_id: string
) => {
  const url = new URL(
    `/orgs/${org_id}/employees/${employee_id}/payrolls/${payroll_id}`,
    baseApiUrl
  );
  const response = await laiaFetch(url, { method: "DELETE" });
  return response;
};

export {
  getEmployeePayrolls,
  postEmployeePayroll,
  getEmployeePayroll,
  patchEmployeePayroll,
  deleteEmployeePayroll,
};
