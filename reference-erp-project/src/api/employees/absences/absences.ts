import { laiaFetch } from "../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";


// GET /orgs/{org_id}/employees/{employee_id}/absences
const getEmployeeAbsences = async (org_id: string, employee_id: string, year: string, status?: string[] | null, absence_type_id?: string, query?: string) => {
    const url = new URL(`/orgs/${org_id}/employees/${employee_id}/absences`, baseApiUrl);

    // Add year parameter
    if (year) {
        url.searchParams.set("year", year);
    } else {
        url.searchParams.set("year", new Date().getFullYear().toString());
    }

    // Add status parameters (multiple values)
    if (status) {
        status.forEach((s) => {
            url.searchParams.append("status", s);
        });
    }

    // Add other optional parameters
    if (absence_type_id) { url.searchParams.set("absence_type_id", absence_type_id); }
    if (query) { url.searchParams.set("query", query); }
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/employees/{employee_id}/absences
const postEmployeeAbsence = async (org_id: string, employee_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/employees/${employee_id}/absences`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// GET /orgs/{org_id}/employees/{employee_id}/absences/{absence_id}
const getEmployeeAbsence = async (org_id: string, employee_id: string, absence_id: string) => {
    const url = new URL(`/orgs/${org_id}/employees/${employee_id}/absences/${absence_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// PATCH /orgs/{org_id}/employees/{employee_id}/absences/{absence_id}
const patchEmployeeAbsence = async (org_id: string, employee_id: string, absence_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/employees/${employee_id}/absences/${absence_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// POST /orgs/{org_id}/employees/me/absences/{absence_id}/cancel
const postMeAbsenceCancel = async (org_id: string, absence_id: string) => {
    const url = new URL(`/orgs/${org_id}/employees/me/absences/${absence_id}/cancel`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
    });
    return response;
};

// GET /orgs/{org_id}/employees/{employee_id}/absence-tracker
const getEmployeeAbsenceTracker = async (org_id: string, employee_id: string, year: string) => {
    const url = new URL(`/orgs/${org_id}/employees/${employee_id}/absence-tracker`, baseApiUrl);
    if (year) {
        url.searchParams.set("year", year);
    }
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// GET /orgs/{org_id}/employees/{employee_id}/absence-counters
const getEmployeeAbsenceCounters = async (org_id: string, employee_id: string) => {
    const url = new URL(`/orgs/${org_id}/employees/${employee_id}/absence-counters`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// GET /orgs/{org_id}/employees/{employee_id}/raw-counters
const getEmployeeAbsenceRawCounters = async (org_id: string, employee_id: string, year: string) => {
    const url = new URL(`/orgs/${org_id}/employees/${employee_id}/raw-counters`, baseApiUrl);
    if (year) {
        url.searchParams.set("year", year);
    }
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// GET /orgs/{org_id}/employees/{employee_id}/absence-types
const getEmployeeAbsenceTypes = async (org_id: string, employee_id: string, year: string) => {
    const url = new URL(`/orgs/${org_id}/employees/${employee_id}/absence-types`, baseApiUrl);
    if (year) {
        url.searchParams.set("year", year);
    }
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};


// POST /orgs/{org_id}/employees/{employee_id}/absences/modify-counters
const postEmployeeAbsencesModifyCounters = async (org_id: string, employee_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/employees/${employee_id}/absences/modify-counters`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// POST /orgs/{org_id}/employees/{employee_id}/absences/adjustments
const postEmployeeAbsencesAdjustments = async (org_id: string, employee_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/employees/${employee_id}/absences/adjustments`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
}

export {
    getEmployeeAbsences,
    postEmployeeAbsence,
    getEmployeeAbsence,
    patchEmployeeAbsence,
    postMeAbsenceCancel,
    getEmployeeAbsenceTracker,
    getEmployeeAbsenceCounters,
    getEmployeeAbsenceRawCounters,
    getEmployeeAbsenceTypes,
    postEmployeeAbsencesModifyCounters,
    postEmployeeAbsencesAdjustments,
};