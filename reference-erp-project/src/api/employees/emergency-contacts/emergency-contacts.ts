import { laiaFetch } from '../../0.core/basics';
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/employees/{employee_id}/emergency-contacts
export const getEmployeeEmergencyContacts = async (
    org_id: string,
    employee_id: string,
    page_token: string | null = null
) => {
    const url = new URL(
        `/orgs/${org_id}/employees/${employee_id}/emergency-contacts`,
        baseApiUrl
    );
    const queryParams = new URLSearchParams();

    if (page_token) queryParams.set("page_token", page_token);

    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/employees/{employee_id}/emergency-contacts
export const postEmployeeEmergencyContact = async (
    org_id: string,
    employee_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/employees/${employee_id}/emergency-contacts`,
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

// GET /orgs/{org_id}/employees/{employee_id}/emergency-contacts/{emergency_contact_id}
export const getEmployeeEmergencyContact = async (
    org_id: string,
    employee_id: string,
    emergency_contact_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/employees/${employee_id}/emergency-contacts/${emergency_contact_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// PATCH /orgs/{org_id}/employees/{employee_id}/emergency-contacts/{emergency_contact_id}
export const patchEmployeeEmergencyContact = async (
    org_id: string,
    employee_id: string,
    emergency_contact_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/employees/${employee_id}/emergency-contacts/${emergency_contact_id}`,
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

// DELETE /orgs/{org_id}/employees/{employee_id}/emergency-contacts/{emergency_contact_id}
export const deleteEmployeeEmergencyContact = async (
    org_id: string,
    employee_id: string,
    emergency_contact_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/employees/${employee_id}/emergency-contacts/${emergency_contact_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

