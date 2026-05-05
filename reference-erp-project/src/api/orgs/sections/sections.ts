import { laiaFetch } from "../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

//POST /orgs/{org_id}/sections
//GET /orgs/{org_id}/sections
//PATCH /orgs/{org_id}/sections/{section_id}
//GET /orgs/{org_id}/sections/{section_id}
//DELETE /orgs/{org_id}/sections/{section_id}
const postOrgSections = async (org_id: string, data: any) => {
  const url = new URL(`/orgs/${org_id}/sections`, baseApiUrl);
  const response = await laiaFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return response;
};
const getOrgSections = async (org_id: string, table_name?: string) => {
  const url = new URL(`/orgs/${org_id}/sections`, baseApiUrl);
  if (table_name) {
    url.searchParams.set("table_name", table_name);
  }
  const response = await laiaFetch(url, { method: "GET" });
  return response;
};
const patchOrgSections = async (org_id: string, section_id: string, data: any) => {
  const url = new URL(`/orgs/${org_id}/sections/${section_id}`, baseApiUrl);
  const response = await laiaFetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return response;
};
const getOrgSectionsSection = async (org_id: string, section_id: string) => {
  const url = new URL(`/orgs/${org_id}/sections/${section_id}`, baseApiUrl);
  const response = await laiaFetch(url, { method: "GET" });
  return response;
};
const deleteOrgSections = async (org_id: string, section_id: string) => {
  const url = new URL(`/orgs/${org_id}/sections/${section_id}`, baseApiUrl);
  const response = await laiaFetch(url, { method: "DELETE" });
  return response;
};

export { postOrgSections, getOrgSections, patchOrgSections, getOrgSectionsSection, deleteOrgSections };