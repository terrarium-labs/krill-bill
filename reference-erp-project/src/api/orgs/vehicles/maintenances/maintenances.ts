import { laiaFetch } from "../../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/vehicles/{vehicle_id}/maintenances
const getVehicleMaintenances = async (org_id: string, vehicle_id: string, year?: number, query?: string, page_token?: string) => {
    const url = new URL(`/orgs/${org_id}/vehicles/${vehicle_id}/maintenances`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (year) queryParams.set("year", year.toString());
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/vehicles/{vehicle_id}/maintenances
const postVehicleMaintenance = async (org_id: string, vehicle_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/vehicles/${vehicle_id}/maintenances`, baseApiUrl);
    const response = await laiaFetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    return response;
};

// PATCH /orgs/{org_id}/vehicles/{vehicle_id}/maintenances/{maintenance_id}

const patchVehicleMaintenance = async (org_id: string, vehicle_id: string, maintenance_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/vehicles/${vehicle_id}/maintenances/${maintenance_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    return response;
};

// DELETE /orgs/{org_id}/vehicles/{vehicle_id}/maintenances/{maintenance_id}

const deleteVehicleMaintenance = async (org_id: string, vehicle_id: string, maintenance_id: string) => {
    const url = new URL(`/orgs/${org_id}/vehicles/${vehicle_id}/maintenances/${maintenance_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

export { getVehicleMaintenances, postVehicleMaintenance, patchVehicleMaintenance, deleteVehicleMaintenance };