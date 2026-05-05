import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/absence-managers -> List of absence managers
const getAbsenceManagers = async (org_id: string, page_token?: string) => {
  const url = new URL(`/orgs/${org_id}/absence-managers`, baseApiUrl);
  const queryParams = new URLSearchParams();
  if (page_token) queryParams.set("page_token", page_token);
  url.search = queryParams.toString();
  const response = await laiaFetch(url, { method: "GET" });
  return response;
};

// GET /orgs/{org_id}/time-record-managers -> List of time record managers
const getTimeRecordManagers = async (org_id: string, page_token?: string) => {
  const url = new URL(`/orgs/${org_id}/time-record-managers`, baseApiUrl);
  const queryParams = new URLSearchParams();
  if (page_token) queryParams.set("page_token", page_token);
  url.search = queryParams.toString();
  const response = await laiaFetch(url, { method: "GET" });
  return response;
};

export { getAbsenceManagers, getTimeRecordManagers };
