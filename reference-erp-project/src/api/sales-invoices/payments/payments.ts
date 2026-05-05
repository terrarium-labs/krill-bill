import { laiaFetch } from "../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// POST /orgs/{org_id}/sales-invoices/{invoice_id}/payments
export const postSalesInvoicePayment = async (
    org_id: string,
    invoice_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/sales-invoices/${invoice_id}/payments`,
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

// GET /orgs/{org_id}/sales-invoices/{invoice_id}/payments
export const getSalesInvoicePayments = async (
    org_id: string,
    invoice_id: string,
    query?: string,
    page_token?: string
) => {
    const url = new URL(
        `/orgs/${org_id}/sales-invoices/${invoice_id}/payments`,
        baseApiUrl
    );
    const queryParams = new URLSearchParams();

    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);

    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// GET /orgs/{org_id}/sales-invoices/{invoice_id}/payments/{payment_id}
export const getSalesInvoicePayment = async (
    org_id: string,
    invoice_id: string,
    payment_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/sales-invoices/${invoice_id}/payments/${payment_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// PATCH /orgs/{org_id}/sales-invoices/{invoice_id}/payments/{payment_id}
export const patchSalesInvoicePayment = async (
    org_id: string,
    invoice_id: string,
    payment_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/sales-invoices/${invoice_id}/payments/${payment_id}`,
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

// DELETE /orgs/{org_id}/sales-invoices/{invoice_id}/payments/{payment_id}
export const deleteSalesInvoicePayment = async (
    org_id: string,
    invoice_id: string,
    payment_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/sales-invoices/${invoice_id}/payments/${payment_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};
