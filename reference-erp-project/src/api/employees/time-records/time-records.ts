import { TableFilters } from '@/types/general/filters';
import { laiaFetch } from '../../0.core/basics';
import { calculateParams } from '@/utils/miscelanea';
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/employees/{employee_id}/time-records
export const getEmployeeTimeRecords = async (
    org_id: string,
    employee_id: string,
    from_day: string | null = null,
    to_day: string | null = null,
    query: string | null = null,
    page_token: string | null = null,
    params: TableFilters | null = null,
) => {
    const url = new URL(
        `/orgs/${org_id}/employees/${employee_id}/time-records`,
        baseApiUrl
    );
    const queryParams = new URLSearchParams();

    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    if (from_day) queryParams.set("from_day", from_day);
    if (to_day) queryParams.set("to_day", to_day);
    if (params) {
        queryParams.set("params", calculateParams(params));
    }
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/employees/{employee_id}/time-records
export const postEmployeeTimeRecord = async (
    org_id: string,
    employee_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/employees/${employee_id}/time-records`,
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

// GET /orgs/{org_id}/employees/{employee_id}/time-records/{time_record_id}
export const getEmployeeTimeRecord = async (
    org_id: string,
    employee_id: string,
    time_record_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/employees/${employee_id}/time-records/${time_record_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// PATCH /orgs/{org_id}/employees/{employee_id}/time-records/{time_record_id}
export const patchEmployeeTimeRecord = async (
    org_id: string,
    employee_id: string,
    time_record_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/employees/${employee_id}/time-records/${time_record_id}`,
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

// DELETE /orgs/{org_id}/employees/{employee_id}/time-records/{time_record_id}
export const deleteEmployeeTimeRecord = async (
    org_id: string,
    employee_id: string,
    time_record_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/employees/${employee_id}/time-records/${time_record_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

// GET /orgs/{org_id}/employees/{employee_id}/active-time-record
export const getEmployeeActiveTimeRecord = async (
    org_id: string,
    employee_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/employees/${employee_id}/active-time-record`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/employees/{employee_id}/start-time-record
export const postEmployeeStartTimeRecord = async (
    org_id: string,
    employee_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/employees/${employee_id}/start-time-record`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "POST" });
    return response;
};

// POST /orgs/{org_id}/employees/{employee_id}/stop-time-record
export const postEmployeeStopTimeRecord = async (
    org_id: string,
    employee_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/employees/${employee_id}/stop-time-record`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "POST" });
    return response;
};