import { TableFilters } from "@/types/general/filters";
import { laiaFetch } from "../../0.core/basics";
import { calculateParams } from "@/utils/miscelanea";
import { baseApiUrl } from "@/api/0.core/url";

// Workplaces
// GET /orgs/{org_id}/workplaces -> { workplaces: Array<{ id: string, name: string, phone: string, address_line_1: string, address_line_2: string, city: string, postal_code: string, state_province: string, country: string, timezone: string, description: string, icon_url: string }>, next_page_token?: string }
const getWorkplaces = async (
    org_id: string,
    query: string | null,
    page_token: string | null,
    params: TableFilters | null
) => {
    const url = new URL(`/orgs/${org_id}/workplaces`, baseApiUrl);
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

// POST /orgs/{org_id}/workplaces -> { workplace: { id: string, name: string, phone: string, address_line_1: string, address_line_2: string, city: string, postal_code: string, state_province: string, country: string, timezone: string, description: string, icon_url: string } }
const postWorkplace = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/workplaces`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// GET /orgs/{org_id}/workplaces/{workplace_id} -> { workplace: { id: string, name: string, phone: string, address_line_1: string, address_line_2: string, city: string, postal_code: string, state_province: string, country: string, timezone: string, description: string, icon_url: string } }
const getWorkplace = async (org_id: string, workplace_id: string) => {
    const url = new URL(
        `/orgs/${org_id}/workplaces/${workplace_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// PATCH /orgs/{org_id}/workplaces/{workplace_id} -> { workplace: { id: string, name: string, phone: string, address_line_1: string, address_line_2: string, city: string, postal_code: string, state_province: string, country: string, timezone: string, description: string, icon_url: string } }
const patchWorkplace = async (
    org_id: string,
    workplace_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/workplaces/${workplace_id}`,
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

// DELETE /orgs/{org_id}/workplaces/{workplace_id} -> 204 No Content
const deleteWorkplace = async (org_id: string, workplace_id: string) => {
    const url = new URL(
        `/orgs/${org_id}/workplaces/${workplace_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

// GET /orgs/{org_id}/workplaces/{workplace_id}/employees -> { users: Array<{ id: string, name: string, email: string, phone: string, photo_url: string, role: string, department: string, status: string, hire_date: string, location: string, manager: string, skills: Array<string>, employment_type: string, permissions: Array<string>, last_login: string, created_at: string, updated_at: string }>, next_page_token?: string }
const getWorkplaceEmployees = async (
    org_id: string,
    workplace_id: string,
    query: string | null,
    page_token: string | null
) => {
    const url = new URL(
        `/orgs/${org_id}/workplaces/${workplace_id}/employees`,
        baseApiUrl
    );
    const queryParams = new URLSearchParams();

    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);

    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/workplaces/{workplace_id}/users -> { user: { id: string, name: string, email: string, phone: string, photo_url: string, role: string, department: string, status: string, hire_date: string, location: string, manager: string, skills: Array<string>, employment_type: string, permissions: Array<string>, last_login: string, created_at: string, updated_at: string } }
const postWorkplaceEmployee = async (
    org_id: string,
    workplace_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/workplaces/${workplace_id}/employees`,
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

// DELETE /orgs/{org_id}/workplaces/{workplace_id}/employees/ -> Body array user_ids
const deleteWorkplaceEmployee = async (
    org_id: string,
    workplace_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/workplaces/${workplace_id}/employees`,
        baseApiUrl
    );
    const response = await laiaFetch(url, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

export {
    getWorkplaces,
    postWorkplace,
    getWorkplace,
    patchWorkplace,
    deleteWorkplace,
    getWorkplaceEmployees,
    postWorkplaceEmployee,
    deleteWorkplaceEmployee,
};