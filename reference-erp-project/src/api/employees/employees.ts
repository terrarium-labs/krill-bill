import { laiaFetch } from "@/api/0.core/basics";
import { TableFilters } from "@/types/general/filters";
import { calculateParams } from "@/utils/miscelanea";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/employees
const getOrgEmployees = async (
    org_id: string,
    not_org_workplace_id?: string,
    not_org_group_id?: string,
    not_job_title_id?: string,
    not_org_time_policy_id?: string,
    not_assigned_to_wo_id?: string,
    not_supervised_by_wo_id?: string,
    query?: string,
    page_token?: string,
    params?: TableFilters
) => {
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    if (not_org_workplace_id) queryParams.set("not_org_workplace_id", not_org_workplace_id);
    if (not_org_group_id) queryParams.set("not_org_group_id", not_org_group_id);
    if (not_job_title_id) queryParams.set("not_job_title_id", not_job_title_id);
    if (not_org_time_policy_id) queryParams.set("not_org_time_policy_id", not_org_time_policy_id);
    if (not_assigned_to_wo_id) queryParams.set("not_assigned_to_wo_id", not_assigned_to_wo_id);
    if (not_supervised_by_wo_id) queryParams.set("not_supervised_by_wo_id", not_supervised_by_wo_id);
    if (params) {
        queryParams.set("params", calculateParams(params));
    }
    const url = new URL(`/orgs/${org_id}/employees`, baseApiUrl);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/employees
const postEmployee = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/employees`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// GET /orgs/{org_id}/employees/{employee_id}
const getEmployee = async (org_id: string, employee_id: string) => {
    const url = new URL(`/orgs/${org_id}/employees/${employee_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// PATCH /orgs/{org_id}/employees/{employee_id}
const patchEmployee = async (
    org_id: string,
    employee_id: string,
    data: any
) => {
    const url = new URL(`/orgs/${org_id}/employees/${employee_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/employees/{employee_id}
const deleteEmployee = async (org_id: string, employee_id: string) => {
    const url = new URL(`/orgs/${org_id}/employees/${employee_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

export { getOrgEmployees, postEmployee, getEmployee, patchEmployee, deleteEmployee };