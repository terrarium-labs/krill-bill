import { laiaFetch } from "../../0.core/basics";
import { TableFilters } from "@/types/general/filters";
import { calculateParams } from "@/utils/miscelanea";
import { baseApiUrl } from "@/api/0.core/url";
import { PayrollMappingValidate } from "@/types/employees/payrolls";

// GET /orgs/{org_id}/payrolls
const getOrgPayrolls = async (
  org_id: string,
  employee_id?: string,
  from_date?: string,
  to_date?: string,
  query?: string,
  page_token?: string,
  params?: TableFilters
) => {
  const url = new URL(`/orgs/${org_id}/payrolls`, baseApiUrl);
  const queryParams = new URLSearchParams();
  if (query) queryParams.set("query", query);
  if (page_token) queryParams.set("page_token", page_token);
  if (employee_id) queryParams.set("employee_id", employee_id);
  if (from_date) queryParams.set("from_date", from_date);
  if (to_date) queryParams.set("to_date", to_date);
  if (params) {
    queryParams.set("params", calculateParams(params));
  }
  url.search = queryParams.toString();
  const response = await laiaFetch(url, { method: "GET" });
  return response;
};

// GET /orgs/{org_id}/payrolls/{payroll_id}
const getOrgPayroll = async (org_id: string, payroll_id: string) => {
  const url = new URL(`/orgs/${org_id}/payrolls/${payroll_id}`, baseApiUrl);
  const response = await laiaFetch(url, { method: "GET" });
  return response;
};

// POST /orgs/{org_id}/payrolls/import 
const postOrgPayrollImport = async (org_id: string, files: File[]) => {
  const url = new URL(`/orgs/${org_id}/payrolls/import`, baseApiUrl);
  const formData = new FormData();
  // Append all files to the form data
  files.forEach((file) => {
    formData.append("files", file);
  });
  // Don't set Content-Type header - browser will set it automatically with boundary
  const response = await laiaFetch(url, {
    method: "POST",
    body: formData,
  });
  return response;
};

// POST /orgs/{org_id}/payrolls/create
const postOrgPayrollsCreate = async (org_id: string, payrolls: PayrollMappingValidate[]) => {
  const url = new URL(`/orgs/${org_id}/payrolls/create`, baseApiUrl);
  const response = await laiaFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payrolls }),
  });
  return response;
};

export { getOrgPayrolls, getOrgPayroll, postOrgPayrollImport, postOrgPayrollsCreate };
