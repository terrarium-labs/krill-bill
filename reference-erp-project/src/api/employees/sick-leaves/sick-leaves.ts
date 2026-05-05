import { laiaFetch } from "../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/employees/{employee_id}/sick-leaves
const getEmployeeSickLeaves = async (org_id: string, employee_id: string, from_date?: string, to_date?: string, query?: string, page_token?: string) => {
    const url = new URL(`/orgs/${org_id}/employees/${employee_id}/sick-leaves`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (from_date) queryParams.set("from_date", from_date);
    if (to_date) queryParams.set("to_date", to_date);
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

export { getEmployeeSickLeaves };