import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

const getEmployeeBonusTypes = async (
    org_id: string,
    employee_id: string,
    query?: string,
    page_token?: string | null
) => {
    const url = new URL(`/orgs/${org_id}/employees/${employee_id}/bonus-types`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

const postEmployeeBonusType = async (
    org_id: string,
    employee_id: string,
    data: { bonus_type_id: string; amount?: number | null }
) => {
    const url = new URL(`/orgs/${org_id}/employees/${employee_id}/bonus-types`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

const patchEmployeeBonusType = async (
    org_id: string,
    employee_id: string,
    bonus_types_employee_id: string,
    data: { bonus_type_id?: string | null; amount?: number | null }
) => {
    const url = new URL(
        `/orgs/${org_id}/employees/${employee_id}/bonus-types/${bonus_types_employee_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

const deleteEmployeeBonusType = async (
    org_id: string,
    employee_id: string,
    bonus_types_employee_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/employees/${employee_id}/bonus-types/${bonus_types_employee_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

export {
    getEmployeeBonusTypes,
    postEmployeeBonusType,
    patchEmployeeBonusType,
    deleteEmployeeBonusType,
};
