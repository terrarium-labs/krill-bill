import { TableFilters } from "@/types/general/filters";
import { laiaFetch } from "../../0.core/basics";
import { calculateParams } from "@/utils/miscelanea";
import { baseApiUrl } from "@/api/0.core/url";

// Time Records
// GET /orgs/{org_id}/time-records -> { time_records: Array<TimeRecord>, next_page_token?: string }
const getTimeRecords = async (
    org_id: string,
    query?: string,
    page_token?: string,
    params?: TableFilters,
) => {
    const url = new URL(`/orgs/${org_id}/time-records`, baseApiUrl);
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

// GET /orgs/{org_id}/time-records-summary/days
const getTimeRecordsSummaryDays = async (
    org_id: string,
    employee_id?: string,
    from_date?: string,
    to_date?: string,
    page_token?: string,
) => {
    const url = new URL(`/orgs/${org_id}/time-records-summary/days`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (employee_id) queryParams.set("employee_id", employee_id);
    if (from_date) queryParams.set("from_date", from_date);
    if (to_date) queryParams.set("to_date", to_date);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// GET /orgs/{org_id}/time-records-summary/employees
const getTimeRecordsSummaryEmployees = async (
    org_id: string,
    from_date?: string,
    to_date?: string,
    query?: string,
    page_token?: string,
    params?: TableFilters,
) => {
    const url = new URL(`/orgs/${org_id}/time-records-summary/employees`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (from_date) queryParams.set("from_date", from_date);
    if (to_date) queryParams.set("to_date", to_date);
    if (page_token) queryParams.set("page_token", page_token);
    if (query) queryParams.set("query", query);
    if (params) {
        queryParams.set("params", calculateParams(params));
    }
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// PATCH /orgs/{org_id}/time-records/{time_record_id} { start_time: string, end_time: string, notes: string } -> { time_record: TimeRecord }
const patchTimeRecord = async (
    org_id: string,
    time_record_id: string,
    data: any
) => {
    const url = new URL(`/orgs/${org_id}/time-records/${time_record_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/time-records/{time_record_id} -> 204 No Content
const deleteTimeRecord = async (
    org_id: string,
    time_record_id: string
) => {
    const url = new URL(`/orgs/${org_id}/time-records/${time_record_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

// POST /orgs/{org_id}/time-records/verify
const postTimeRecordsVerify = async (
    org_id: string,
    data: any
) => {
    const url = new URL(`/orgs/${org_id}/time-records/verify`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// POST /orgs/{org_id}/time-records/verify/all
const postTimeRecordsVerifyAll = async (
    org_id: string,
    data: any
) => {
    const url = new URL(`/orgs/${org_id}/time-records/verify/all`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// POST /orgs/{org_id}/time-records-summary/verify
const postTimeRecordsSummaryVerify = async (
    org_id: string,
    data: any
) => {
    const url = new URL(`/orgs/${org_id}/time-records-summary/verify`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

export {
    getTimeRecords,
    getTimeRecordsSummaryDays,
    getTimeRecordsSummaryEmployees,
    patchTimeRecord,
    deleteTimeRecord,
    postTimeRecordsVerify,
    postTimeRecordsVerifyAll,
    postTimeRecordsSummaryVerify,
};

