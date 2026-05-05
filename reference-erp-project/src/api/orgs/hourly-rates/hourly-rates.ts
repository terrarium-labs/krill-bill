import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// POST /orgs/{org_id}/hourly-rates -> { hourly_rate: { id: string, name: string, description: string, created_at: string, updated_at: string } }
const postOrgHourlyRate = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/hourly-rates`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// GET /orgs/{org_id}/hourly-rates -> { hourly_rate: { id: string, name: string, description: string, created_at: string, updated_at: string } }
const getOrgHourlyRates = async (
    org_id: string,
    query: string | null,
    page_token: string | null
) => {
    const url = new URL(`/orgs/${org_id}/hourly-rates`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// GET /orgs/{org_id}/hourly-rates/{hourly_rate_id} -> { hourly_rate: { id: string, name: string, description: string, created_at: string, updated_at: string } }
const getOrgHourlyRate = async (org_id: string, hourly_rate_id: string) => {
    const url = new URL(`/orgs/${org_id}/hourly-rates/${hourly_rate_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// DELETE /orgs/{org_id}/hourly-rates/{hourly_rate_id} -> 204 No Content
const deleteOrgHourlyRate = async (org_id: string, hourly_rate_id: string) => {
    const url = new URL(`/orgs/${org_id}/hourly-rates/${hourly_rate_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

// PATCH /orgs/{org_id}/hourly-rates/{hourly_rate_id} -> { hourly_rate: { id: string, name: string, description: string, created_at: string, updated_at: string } }
const patchOrgHourlyRate = async (org_id: string, hourly_rate_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/hourly-rates/${hourly_rate_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// Orgs Hourly Rates Job Titles #########################################################

// POST /orgs/{org_id}/hourly-rates/{hourly_rate_id}/job-titles -> { job_title: { id: string, name: string, rate: number, created_at: string, updated_at: string } }
const postOrgHourlyRateJobTitle = async (
    org_id: string,
    hourly_rate_id: string,
    data: any
) => {
    const url = new URL(`/orgs/${org_id}/hourly-rates/${hourly_rate_id}/job-titles`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// PATCH /orgs/{org_id}/hourly-rates/{hourly_rate_id}/job-titles/{hour_job_title_id} -> { job_title: { id: string, name: string, rate: number, created_at: string, updated_at: string } }
const patchOrgHourlyRateJobTitle = async (
    org_id: string,
    hourly_rate_id: string,
    hour_job_title_id: string,
    data: any
) => {
    const url = new URL(`/orgs/${org_id}/hourly-rates/${hourly_rate_id}/job-titles/${hour_job_title_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/hourly-rates/{hourly_rate_id}/job-titles/{hour_job_title_id} -> 204 No Content
const deleteOrgHourlyRateJobTitle = async (
    org_id: string,
    hourly_rate_id: string,
    hour_job_title_id: string
) => {
    const url = new URL(`/orgs/${org_id}/hourly-rates/${hourly_rate_id}/job-titles/${hour_job_title_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "DELETE",
    });
    return response;
};

export {
    postOrgHourlyRate,
    getOrgHourlyRates,
    getOrgHourlyRate,
    deleteOrgHourlyRate,
    patchOrgHourlyRate,
    postOrgHourlyRateJobTitle,
    patchOrgHourlyRateJobTitle,
    deleteOrgHourlyRateJobTitle
};
