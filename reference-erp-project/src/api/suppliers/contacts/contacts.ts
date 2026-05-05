import { laiaFetch } from '../../0.core/basics';
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/suppliers/{supplier_id}/contacts
export const getSupplierContacts = async (
    org_id: string,
    supplier_id: string,
    query: string | null,
    page_token: string | null
) => {
    const url = new URL(
        `/orgs/${org_id}/suppliers/${supplier_id}/contacts`,
        baseApiUrl
    );
    const queryParams = new URLSearchParams();

    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);

    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// GET /orgs/{org_id}/suppliers/{supplier_id}/contacts/{contact_id}
export const getSupplierContact = async (
    org_id: string,
    supplier_id: string,
    contact_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/suppliers/${supplier_id}/contacts/${contact_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/suppliers/{supplier_id}/contacts
export const postSupplierContact = async (
    org_id: string,
    supplier_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/suppliers/${supplier_id}/contacts`,
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

// PATCH /orgs/{org_id}/suppliers/{supplier_id}/contacts/{contact_id}
export const patchSupplierContact = async (
    org_id: string,
    supplier_id: string,
    contact_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/suppliers/${supplier_id}/contacts/${contact_id}`,
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

// DELETE /orgs/{org_id}/suppliers/{supplier_id}/contacts/{contact_id}
export const deleteSupplierContact = async (
    org_id: string,
    supplier_id: string,
    contact_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/suppliers/${supplier_id}/contacts/${contact_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

// POST /orgs/{org_id}/suppliers/{supplier_id}/contacts/{contact_id}/default
export const postSupplierContactDefault = async (
    org_id: string,
    supplier_id: string,
    contact_id: string,
    is_default: boolean
) => {
    const url = new URL(
        `/orgs/${org_id}/suppliers/${supplier_id}/contacts/${contact_id}/default`,
        baseApiUrl
    );
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_default: is_default }),
    });
    return response;
};

