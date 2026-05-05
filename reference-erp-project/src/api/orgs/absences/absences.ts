import { laiaFetch } from "../../0.core/basics";
import { TableFilters } from "@/types/general/filters";
import { calculateParams } from "@/utils/miscelanea";
import { baseApiUrl } from "@/api/0.core/url";

// Absences
// GET /orgs/{org_id}/absences
const getAbsences = async (org_id: string, query?: string | null, page_token?: string | null, params?: TableFilters) => {
    const url = new URL(`/orgs/${org_id}/absences`, baseApiUrl);
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

// PATCH /orgs/{org_id}/absences/{absence_id}
const patchAbsence = async (org_id: string, absence_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/absences/${absence_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/absences/{absence_id}
const deleteAbsence = async (org_id: string, absence_id: string) => {
    const url = new URL(`/orgs/${org_id}/absences/${absence_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

// POST /orgs/{org_id}/absences/status
const postAbsenceStatus = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/absences/status`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// POST /orgs/{org_id}/absences/status/all
const postAbsenceStatusAll = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/absences/status/all`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// Absence Types
// GET /orgs/{org_id}/absence-types -> { absence_types: Array<{ id: string, name: string, description: string, created_at: string }> }
const getAbsenceTypes = async (
    org_id: string,
    query?: string | null,
    page_token?: string | null
) => {
    const url = new URL(`/orgs/${org_id}/absence-types`, baseApiUrl);
    const queryParams = new URLSearchParams();

    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);

    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/absence-types { name: string, description: string } -> { absence_type: { id: string, name: string, description: string, created_at: string } }
const postAbsenceType = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/absence-types`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// GET /orgs/{org_id}/absence-types/{absence_type_id} -> { absence_type: { id: string, name: string, description: string, created_at: string } }
const getAbsenceType = async (org_id: string, absence_type_id: string) => {
    const url = new URL(
        `/orgs/${org_id}/absence-types/${absence_type_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

const patchAbsenceType = async (
    org_id: string,
    absence_type_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/absence-types/${absence_type_id}`,
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

// DELETE /orgs/{org_id}/absence-types/{absence_type_id} -> 204 No Content
const deleteAbsenceType = async (org_id: string, absence_type_id: string) => {
    const url = new URL(
        `/orgs/${org_id}/absence-types/${absence_type_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

// Absence Policies
// GET /orgs/{org_id}/absence-policies -> { absence_policies: Array<{ id: string, name: string, description: string, created_at: string }>, next_page_token?: string }
const getAbsencePolicies = async (
    org_id: string,
    query: string | null,
    page_token: string | null
) => {
    const url = new URL(`/orgs/${org_id}/absence-policies`, baseApiUrl);
    const queryParams = new URLSearchParams();

    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);

    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/absence-policies { name: string, description: string } -> { absence_policy: { id: string, name: string, description: string, created_at: string } }
const postAbsencePolicy = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/absence-policies`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

const getAbsencePolicy = async (
    org_id: string,
    absence_policy_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/absence-policies/${absence_policy_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};
// PATCH /orgs/{org_id}/absence-policies/{absence_policy_id} -> { absence_policy: { id: string, name: string, description: string, created_at: string } }
const patchAbsencePolicy = async (
    org_id: string,
    absence_policy_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/absence-policies/${absence_policy_id}`,
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
// DELETE /orgs/{org_id}/absence-policies/{absence_policy_id} -> 204 No Content
const deleteAbsencePolicy = async (
    org_id: string,
    absence_policy_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/absence-policies/${absence_policy_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

// Absence Policy Counters
// GET /orgs/{org_id}/absence-policies/{absence_policy_id}/policy-counters -> { policy_counters: { total_days: number, used_days: number, remaining_days: number } }
const getAbsencePolicyCounters = async (
    org_id: string,
    absence_policy_id: string,
    year: string,
    query?: string,
    page_token?: string,
    params?: TableFilters
) => {
    const url = new URL(
        `/orgs/${org_id}/absence-policies/${absence_policy_id}/policy-counters`,
        baseApiUrl
    );
    const queryParams = new URLSearchParams();
    if (year) queryParams.set("year", year);
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    if (params) {
        queryParams.set("params", calculateParams(params));
    }
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/absence-policies/{absence_policy_id}/policy-counters -> { policy_counters: { total_days: number, used_days: number, remaining_days: number } }
const postAbsencePolicyCounters = async (
    org_id: string,
    absence_policy_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/absence-policies/${absence_policy_id}/policy-counters`,
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

// PATCH /orgs/{org_id}/absence-policies/{absence_policy_id}/policy-counters -> { policy_counters: { total_days: number, used_days: number, remaining_days: number } }
const patchAbsencePolicyCounters = async (
    org_id: string,
    absence_policy_id: string,
    data: any,
    policy_counter_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/absence-policies/${absence_policy_id}/policy-counters/${policy_counter_id}`,
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

// DELETE /orgs/{org_id}/absence-policies/{absence_policy_id}/policy-counters -> 204 No Content
const deleteAbsencePolicyCounters = async (
    org_id: string,
    absence_policy_id: string,
    policy_counter_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/absence-policies/${absence_policy_id}/policy-counters/${policy_counter_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};


export {
    getAbsences,
    patchAbsence,
    deleteAbsence,
    postAbsenceStatus,
    postAbsenceStatusAll,
    getAbsenceTypes,
    postAbsenceType,
    getAbsenceType,
    patchAbsenceType,
    deleteAbsenceType,
    getAbsencePolicy,
    patchAbsencePolicy,
    deleteAbsencePolicy,
    getAbsencePolicies,
    postAbsencePolicy,
    getAbsencePolicyCounters,
    postAbsencePolicyCounters,
    patchAbsencePolicyCounters,
    deleteAbsencePolicyCounters
};

