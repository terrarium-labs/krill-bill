import { laiaFetch } from "../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// POST /orgs/{org_id}/sales-invoices/{invoice_id}/lines
export const postSalesInvoiceLine = async (
    org_id: string,
    invoice_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/sales-invoices/${invoice_id}/lines`,
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

// GET /orgs/{org_id}/sales-invoices/{invoice_id}/lines
export const getSalesInvoiceLines = async (
    org_id: string,
    invoice_id: string,
) => {
    const url = new URL(
        `/orgs/${org_id}/sales-invoices/${invoice_id}/lines`,
        baseApiUrl
    );
    const queryParams = new URLSearchParams();

    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// PATCH /orgs/{org_id}/sales-invoices/{invoice_id}/lines/{line_id}
export const patchSalesInvoiceLine = async (
    org_id: string,
    invoice_id: string,
    line_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/sales-invoices/${invoice_id}/lines/${line_id}`,
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

// DELETE /orgs/{org_id}/sales-invoices/{invoice_id}/lines/{line_id}
export const deleteSalesInvoiceLine = async (
    org_id: string,
    invoice_id: string,
    line_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/sales-invoices/${invoice_id}/lines/${line_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};
