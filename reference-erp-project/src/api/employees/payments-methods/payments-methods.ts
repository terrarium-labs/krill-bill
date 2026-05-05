import { laiaFetch } from '../../0.core/basics';
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/employees/{employee_id}/payments-methods
export const getEmployeePaymentsMethods = async (
    org_id: string,
    employee_id: string,
    page_token: string | null = null
) => {
    const url = new URL(
        `/orgs/${org_id}/employees/${employee_id}/payments-methods`,
        baseApiUrl
    );
    const queryParams = new URLSearchParams();

    if (page_token) queryParams.set("page_token", page_token);

    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/employees/{employee_id}/payments-methods
export const postEmployeePaymentsMethod = async (
    org_id: string,
    employee_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/employees/${employee_id}/payments-methods`,
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

// GET /orgs/{org_id}/employees/{employee_id}/payments-methods/{payment_method_id}
export const getEmployeePaymentsMethod = async (
    org_id: string,
    employee_id: string,
    payment_method_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/employees/${employee_id}/payments-methods/${payment_method_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// PATCH /orgs/{org_id}/employees/{employee_id}/payments-methods/{payment_method_id}
export const patchEmployeePaymentsMethod = async (
    org_id: string,
    employee_id: string,
    payment_method_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/employees/${employee_id}/payments-methods/${payment_method_id}`,
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

// DELETE /orgs/{org_id}/employees/{employee_id}/payments-methods/{payment_method_id}
export const deleteEmployeePaymentsMethod = async (
    org_id: string,
    employee_id: string,
    payment_method_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/employees/${employee_id}/payments-methods/${payment_method_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

// POST /orgs/{org_id}/employees/{employee_id}/payments-methods/{payment_method_id}/default
export const postDefaultEmployeePaymentsMethod = async (
    org_id: string,
    employee_id: string,
    payment_method_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/employees/${employee_id}/payments-methods/${payment_method_id}/default`,
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

