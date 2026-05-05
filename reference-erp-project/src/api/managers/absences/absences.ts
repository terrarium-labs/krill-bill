import { TableFilters } from "@/types/general/filters";
import { laiaFetch } from "../../0.core/basics";
import { calculateParams } from "@/utils/miscelanea";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/managers/{manager_id}/employees/absences -> Absences assigned to a manager
const getManagerAbsences = async (
  org_id: string,
  manager_id: string,
  query?: string,
  page_token?: string,
  params?: TableFilters
) => {
  const url = new URL(
    `/orgs/${org_id}/managers/${manager_id}/employees/absences`,
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

// PATCH /orgs/{org_id}/managers/{manager_id}/employees/absences/{absence_id}
const patchManagerAbsence = async (
  org_id: string,
  manager_id: string,
  absence_id: string,
  data: any
) => {
  const url = new URL(
    `/orgs/${org_id}/managers/${manager_id}/employees/absences/${absence_id}`,
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

// POST /orgs/{org_id}/managers/{manager_id}/employees/absences/status
const postManagerAbsenceStatus = async (
  org_id: string,
  manager_id: string,
  data: any
) => {
  const url = new URL(
    `/orgs/${org_id}/managers/${manager_id}/employees/absences/status`,
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

// POST /orgs/{org_id}/managers/{manager_id}/employees/absences/status/all
const postManagerAbsenceStatusAll = async (
  org_id: string,
  manager_id: string,
  data: any
) => {
  const url = new URL(
    `/orgs/${org_id}/managers/${manager_id}/employees/absences/status/all`,
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

export {
  getManagerAbsences,
  patchManagerAbsence,
  postManagerAbsenceStatus,
  postManagerAbsenceStatusAll,
};
