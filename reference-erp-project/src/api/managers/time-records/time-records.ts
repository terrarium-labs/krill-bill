import { calculateParams } from "@/utils/miscelanea";
import { laiaFetch } from "../../0.core/basics";
import { TableFilters } from "@/types/general/filters";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/managers/{manager_id}/employees -> Employees assigned to a manager
const getManagerEmployees = async (
  org_id: string,
  manager_id: string,
  query?: string,
  page_token?: string
) => {
  const url = new URL(
    `/orgs/${org_id}/managers/${manager_id}/employees`,
    baseApiUrl
  );
  const queryParams = new URLSearchParams();

  if (query) queryParams.set("query", query);
  if (page_token) queryParams.set("page_token", page_token);

  const search = queryParams.toString();
  if (search) url.search = search;

  const response = await laiaFetch(url, { method: "GET" });
  return response;
};

// GET /orgs/{org_id}/managers/{manager_id}/employees/time-records
const getManagerTimeRecords = async (
  org_id: string,
  manager_id: string,
  query?: string,
  page_token?: string,
  params?: TableFilters
) => {
  const url = new URL(
    `/orgs/${org_id}/managers/${manager_id}/employees/time-records`,
    baseApiUrl
  );
  const queryParams = new URLSearchParams();

  if (query) queryParams.set("query", query);
  if (page_token) queryParams.set("page_token", page_token);
  if (params) {
    queryParams.set("params", calculateParams(params));
  }
  url.search = queryParams.toString();

  const response = await laiaFetch(url, { method: "GET" });
  return response;
};

// POST /orgs/{org_id}/managers/{manager_id}/employees/time-records/verify
const postManagerTimeRecordVerify = async (
  org_id: string,
  manager_id: string,
  data: any
) => {
  const url = new URL(
    `/orgs/${org_id}/managers/${manager_id}/employees/time-records/verify`,
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

// POST /orgs/{org_id}/managers/{manager_id}/employees/time-records/verify/all
const postManagerTimeRecordVerifyAll = async (
  org_id: string,
  manager_id: string,
  data: any
) => {
  const url = new URL(
    `/orgs/${org_id}/managers/${manager_id}/employees/time-records/verify/all`,
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

//PATCH /orgs/{org_id}/managers/{manager_id}/employees/time-records/{time_record_id}
const patchManagerTimeRecord = async (
  org_id: string,
  manager_id: string,
  time_record_id: string,
  data: any
) => {
  const url = new URL(
    `/orgs/${org_id}/managers/${manager_id}/employees/time-records/${time_record_id}`,
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

export {
  getManagerEmployees,
  getManagerTimeRecords,
  postManagerTimeRecordVerify,
  postManagerTimeRecordVerifyAll,
  patchManagerTimeRecord,
};
