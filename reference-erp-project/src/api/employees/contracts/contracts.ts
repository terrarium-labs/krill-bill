import { laiaFetch } from '../../0.core/basics';
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/employees/{employee_id}/contracts
export const getEmployeeContracts = async (
    org_id: string,
    employee_id: string,
    query: string | null = null,
    page_token: string | null = null
) => {
    const url = new URL(
        `/orgs/${org_id}/employees/${employee_id}/contracts`,
        baseApiUrl
    );
    const queryParams = new URLSearchParams();

    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);

    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/employees/{employee_id}/contracts
export const postEmployeeContract = async (
    org_id: string,
    employee_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/employees/${employee_id}/contracts`,
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

// GET /orgs/{org_id}/employees/{employee_id}/contracts/{contract_id}
export const getEmployeeContract = async (
    org_id: string,
    employee_id: string,
    contract_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/employees/${employee_id}/contracts/${contract_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// DELETE /orgs/{org_id}/employees/{employee_id}/contracts/{contract_id}
export const deleteEmployeeContract = async (
    org_id: string,
    employee_id: string,
    contract_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/employees/${employee_id}/contracts/${contract_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

// POST /orgs/{org_id}/employees/{employee_id}/contracts/{contract_id}/activate
export const activateEmployeeContract = async (
    org_id: string,
    employee_id: string,
    contract_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/employees/${employee_id}/contracts/${contract_id}/activate`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "POST" });
    return response;
};

