import { laiaFetch } from "@/api/0.core/basics";
import { TableFilters } from "@/types/general/filters";
import { calculateParams } from "@/utils/miscelanea";
import { baseApiUrl } from "@/api/0.core/url";

// POST /orgs/{org_id}/job-titles -> { job_title: { id: string, name: string, description: string, created_at: string, updated_at: string } }
const postOrgJobTitle = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/job-titles`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// GET /orgs/{org_id}/job-titles -> { job_title: { id: string, name: string, description: string, created_at: string, updated_at: string } }
const getOrgJobTitles = async (
    org_id: string,
    query?: string,
    page_token?: string,
    params?: TableFilters
) => {
    const url = new URL(`/orgs/${org_id}/job-titles`, baseApiUrl);
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

// GET /orgs/{org_id}/job-titles/{job_title_id} -> { job_title: { id: string, name: string, description: string, created_at: string, updated_at: string } }
const getOrgJobTitle = async (org_id: string, job_title_id: string) => {
    const url = new URL(`/orgs/${org_id}/job-titles/${job_title_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// DELETE /orgs/{org_id}/job-titles/{job_title_id} -> 204 No Content
const deleteOrgJobTitle = async (org_id: string, job_title_id: string) => {
    const url = new URL(`/orgs/${org_id}/job-titles/${job_title_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

// PATCH /orgs/{org_id}/job-titles/{job_title_id} -> { job_title: { id: string, name: string, description: string, created_at: string, updated_at: string } }
const patchOrgJobTitle = async (org_id: string, job_title_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/job-titles/${job_title_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// Orgs Job Titles Employees #########################################################

// POST /orgs/{org_id}/job-titles/{job_title_id}/employees -> { employee: { id: string, name: string, email: string, phone: string, photo_url: string, role: string, department: string, status: string, hire_date: string, location: string, manager: string, skills: Array<string>, employment_type: string, permissions: Array<string>, last_login: string, created_at: string, updated_at: string } }
const postOrgJobTitleEmployee = async (
    org_id: string,
    job_title_id: string,
    data: any
) => {
    const url = new URL(`/orgs/${org_id}/job-titles/${job_title_id}/employees`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/job-titles/{job_title_id}/employees -> 204 No Content
const deleteOrgJobTitleEmployee = async (
    org_id: string,
    job_title_id: string,
    data: any
) => {
    const url = new URL(`/orgs/${org_id}/job-titles/${job_title_id}/employees`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// GET /orgs/{org_id}/job-titles/{job_title_id}/employees -> { employees: Array<{ id: string, name: string, email: string, phone: string, photo_url: string, role: string, department: string, status: string, hire_date: string, location: string, manager: string, skills: Array<string>, employment_type: string, permissions: Array<string>, last_login: string, created_at: string, updated_at: string }> }
const getOrgJobTitleEmployees = async (org_id: string, job_title_id: string, page_token: string | null, query: string | null) => {
    const url = new URL(`/orgs/${org_id}/job-titles/${job_title_id}/employees`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (page_token) queryParams.set("page_token", page_token);
    if (query) queryParams.set("query", query);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

export { postOrgJobTitle, getOrgJobTitles, getOrgJobTitle, deleteOrgJobTitle, patchOrgJobTitle, postOrgJobTitleEmployee, deleteOrgJobTitleEmployee, getOrgJobTitleEmployees };

