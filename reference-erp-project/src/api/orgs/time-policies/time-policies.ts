import { laiaFetch } from "../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/time-policies -> { time_policies: Array<TimePolicy>, next_page_token?: string }
const getTimePolicies = async (
    org_id: string,
    query: string | null,
    page_token: string | null
) => {
    const url = new URL(`/orgs/${org_id}/time-policies`, baseApiUrl);
    const queryParams = new URLSearchParams();

    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);

    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/time-policies -> { time_policy: TimePolicy }
const postTimePolicy = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/time-policies`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// GET /orgs/{org_id}/time-policies/{time_policy_id} -> { time_policy: TimePolicy }
const getTimePolicy = async (org_id: string, time_policy_id: string) => {
    const url = new URL(
        `/orgs/${org_id}/time-policies/${time_policy_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// PATCH /orgs/{org_id}/time-policies/{time_policy_id} -> { time_policy: TimePolicy }
const patchTimePolicy = async (
    org_id: string,
    time_policy_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/time-policies/${time_policy_id}`,
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

// DELETE /orgs/{org_id}/time-policies/{time_policy_id} -> 204 No Content
const deleteTimePolicy = async (org_id: string, time_policy_id: string) => {
    const url = new URL(
        `/orgs/${org_id}/time-policies/${time_policy_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

// POST /orgs/{org_id}/time-policies/{time_policy_id}/employees -> Associate employees to a time policy
const postTimePolicyEmployees = async (
    org_id: string,
    time_policy_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/time-policies/${time_policy_id}/employees`,
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

// GET /orgs/{org_id}/time-policies/{time_policy_id}/employees -> Get the employees in a time policy
const getTimePolicyEmployees = async (
    org_id: string,
    time_policy_id: string,
    page_token: string | null = null,
    query: string | null = null
) => {
    const url = new URL(
        `/orgs/${org_id}/time-policies/${time_policy_id}/employees`,
        baseApiUrl
    );
    const queryParams = new URLSearchParams();

    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);

    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// DELETE /orgs/{org_id}/time-policies/{time_policy_id}/employees -> Remove employees from a time policy
const deleteTimePolicyEmployees = async (
    org_id: string,
    time_policy_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/time-policies/${time_policy_id}/employees`,
        baseApiUrl
    );
    const response = await laiaFetch(url, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

export {
    getTimePolicies,
    postTimePolicy,
    getTimePolicy,
    patchTimePolicy,
    deleteTimePolicy,
    postTimePolicyEmployees,
    getTimePolicyEmployees,
    deleteTimePolicyEmployees,
};

