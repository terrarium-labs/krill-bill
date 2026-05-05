import { laiaFetch } from "@/api/0.core/basics";
import { TableFilters } from "@/types/general/filters";
import { calculateParams } from "@/utils/miscelanea";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/suppliers
export const getSuppliers = async (
    org_id: string,
    query?: string,
    page_token?: string,
    params?: TableFilters
) => {
    const url = new URL(`/orgs/${org_id}/suppliers`, baseApiUrl);
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

// POST /orgs/{org_id}/suppliers
export const postSupplier = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/suppliers`, baseApiUrl);

    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// GET /orgs/{org_id}/suppliers/{supplier_id}
export const getSupplier = async (org_id: string, supplier_id: string) => {
    const url = new URL(`/orgs/${org_id}/suppliers/${supplier_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// PATCH /orgs/{org_id}/suppliers/{supplier_id}
export const patchSupplier = async (
    org_id: string,
    supplier_id: string,
    data: any
) => {
    const url = new URL(`/orgs/${org_id}/suppliers/${supplier_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/suppliers/{supplier_id}
export const deleteSupplier = async (org_id: string, supplier_id: string) => {
    const url = new URL(`/orgs/${org_id}/suppliers/${supplier_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};
