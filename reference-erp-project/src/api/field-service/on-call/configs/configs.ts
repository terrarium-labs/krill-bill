import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/on-call-configs - fetch configs
const getOrgOnCallConfigs = async (org_id: string, query?: string, page_token?: string) => {
  const url = new URL(`/orgs/${org_id}/on-call-configs`, baseApiUrl);
  if (query) {
    url.searchParams.set("query", query);
  }
  if (page_token) {
    url.searchParams.set("page_token", page_token);
  }
  const response = await laiaFetch(url, { method: "GET" });
  return response;
};

// POST /orgs/{org_id}/on-call-configs - create config
const postOrgOnCallConfigs = async (org_id: string, data: any) => {
  const url = new URL(`/orgs/${org_id}/on-call-configs`, baseApiUrl);
  const response = await laiaFetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return response;
};

// PATCH /orgs/{org_id}/on-call-configs/{config_id} - update config
const patchOrgOnCallConfig = async (org_id: string, config_id: string, data: any) => {
  const url = new URL(`/orgs/${org_id}/on-call-configs/${config_id}`, baseApiUrl);
  const response = await laiaFetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return response;
};

export { getOrgOnCallConfigs, postOrgOnCallConfigs, patchOrgOnCallConfig };