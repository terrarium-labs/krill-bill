import { laiaFetch } from "../../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// POST /orgs/{org_id}/time-policies/{time_policy_id}/overtime-rules -> Create an overtime rule
const postOvertimeRule = async (
    org_id: string,
    time_policy_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/time-policies/${time_policy_id}/overtime-rules`,
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

// GET /orgs/{org_id}/time-policies/{time_policy_id}/overtime-rules -> List overtime rules
const getOvertimeRules = async (
    org_id: string,
    time_policy_id: string,
    query?: string | null,
    page_token?: string | null
) => {
    const url = new URL(
        `/orgs/${org_id}/time-policies/${time_policy_id}/overtime-rules`,
        baseApiUrl
    );
    const queryParams = new URLSearchParams();

    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);

    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// GET /orgs/{org_id}/time-policies/{time_policy_id}/overtime-rules/{overtime_rule_id} -> Get an overtime rule
const getOvertimeRule = async (
    org_id: string,
    time_policy_id: string,
    overtime_rule_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/time-policies/${time_policy_id}/overtime-rules/${overtime_rule_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// PATCH /orgs/{org_id}/time-policies/{time_policy_id}/overtime-rules/{overtime_rule_id} -> Update an overtime rule
const patchOvertimeRule = async (
    org_id: string,
    time_policy_id: string,
    overtime_rule_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/time-policies/${time_policy_id}/overtime-rules/${overtime_rule_id}`,
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

// DELETE /orgs/{org_id}/time-policies/{time_policy_id}/overtime-rules/{overtime_rule_id} -> Delete an overtime rule
const deleteOvertimeRule = async (
    org_id: string,
    time_policy_id: string,
    overtime_rule_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/time-policies/${time_policy_id}/overtime-rules/${overtime_rule_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

export {
    postOvertimeRule,
    getOvertimeRules,
    getOvertimeRule,
    patchOvertimeRule,
    deleteOvertimeRule,
};

