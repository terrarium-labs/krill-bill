import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";


// GET /orgs/{org_id}/vehicles/{vehicle_id}/employees
const getOrgVehicleEmployees = async (org_id: string, vehicle_id: string, query?: string, page_token?: string) => {
    const url = new URL(`/orgs/${org_id}/vehicles/${vehicle_id}/employees`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/vehicles/{vehicle_id}/employees -> {"employee_id": string, "valid_from": string, "valid_to": string | null}
const postOrgVehicleEmployee = async (org_id: string, vehicle_id: string, data: { employee_id: string; valid_from: string; valid_to?: string | null }) => {
    const url = new URL(`/orgs/${org_id}/vehicles/${vehicle_id}/employees`, baseApiUrl);
    const response = await laiaFetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    return response;
};

// PATCH /orgs/{org_id}/vehicles/{vehicle_id}/employees/{vehicle_employee_id}
const patchOrgVehicleEmployee = async (org_id: string, vehicle_id: string, vehicle_employee_id: string, data: { valid_from?: string | null; valid_to?: string | null }) => {
    const url = new URL(`/orgs/${org_id}/vehicles/${vehicle_id}/employees/${vehicle_employee_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    return response;
};

// DELETE /orgs/{org_id}/vehicles/{vehicle_id}/employees/{vehicle_employee_id}
const deleteOrgVehicleEmployee = async (org_id: string, vehicle_id: string, vehicle_employee_id: string) => {
    const url = new URL(`/orgs/${org_id}/vehicles/${vehicle_id}/employees/${vehicle_employee_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};
export { getOrgVehicleEmployees, postOrgVehicleEmployee, patchOrgVehicleEmployee, deleteOrgVehicleEmployee };