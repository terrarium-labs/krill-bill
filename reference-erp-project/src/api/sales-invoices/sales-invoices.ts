import { laiaFetch } from "@/api/0.core/basics";
import { TableFilters } from "@/types/general/filters";
import { calculateParams } from "@/utils/miscelanea";
import { baseApiUrl } from "@/api/0.core/url";

// POST /orgs/{org_id}/sales-invoices
export const postSalesInvoice = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/sales-invoices`, baseApiUrl);

    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// GET /orgs/{org_id}/sales-invoices
export const getSalesInvoices = async (
    org_id: string,
    query?: string,
    page_token?: string,
    params?: TableFilters
) => {
    const url = new URL(`/orgs/${org_id}/sales-invoices`, baseApiUrl);
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

// GET /orgs/{org_id}/sales-invoices/{invoice_id}
export const getSalesInvoice = async (org_id: string, invoice_id: string) => {
    const url = new URL(`/orgs/${org_id}/sales-invoices/${invoice_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// PATCH /orgs/{org_id}/sales-invoices/{invoice_id}
export const patchSalesInvoice = async (
    org_id: string,
    invoice_id: string,
    data: any
) => {
    const url = new URL(`/orgs/${org_id}/sales-invoices/${invoice_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/sales-invoices/{invoice_id}
export const deleteSalesInvoice = async (
    org_id: string,
    invoice_id: string
) => {
    const url = new URL(`/orgs/${org_id}/sales-invoices/${invoice_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "DELETE",
    });
    return response;
};

// POST /orgs/{org_id}/sales-invoices/{invoice_id}/approve
export const approveSalesInvoice = async (
    org_id: string,
    invoice_id: string
) => {
    const url = new URL(`/orgs/${org_id}/sales-invoices/${invoice_id}/approve`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST"
    });
    return response;
};
