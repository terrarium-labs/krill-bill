import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// POST /orgs/{org_id}/serial-numbers -> Create a serial number
const postOrgSerialNumber = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/serial-numbers`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// GET /orgs/{org_id}/serial-numbers -> List serial numbers
const getOrgSerialNumbers = async (
    org_id: string,
    entity?: "orders" | "sales_invoices" | "purchase_invoices",
    query?: string | null,
    page_token?: string | null
) => {
    const url = new URL(`/orgs/${org_id}/serial-numbers`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    if (entity) queryParams.set("entity", entity);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// PATCH /orgs/{org_id}/serial-numbers/{serial_number_id} -> Update a serial number
const patchOrgSerialNumber = async (org_id: string, serial_number_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/serial-numbers/${serial_number_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/serial-numbers/{serial_number_id} -> Delete a serial number
const deleteOrgSerialNumber = async (org_id: string, serial_number_id: string) => {
    const url = new URL(`/orgs/${org_id}/serial-numbers/${serial_number_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

export { postOrgSerialNumber, getOrgSerialNumbers, patchOrgSerialNumber, deleteOrgSerialNumber };

