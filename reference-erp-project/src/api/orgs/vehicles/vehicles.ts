import { TableFilters } from "@/types/general/filters";
import { laiaFetch } from "../../0.core/basics";
import { calculateParams } from "@/utils/miscelanea";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/vehicles
const getOrgVehicles = async (org_id: string, query?: string, page_token?: string, params?: TableFilters) => {
    const url = new URL(`/orgs/${org_id}/vehicles`, baseApiUrl);
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

// GET /orgs/{org_id}/vehicles/{vehicle_id}
const getOrgVehicle = async (org_id: string, vehicle_id: string) => {
    const url = new URL(`/orgs/${org_id}/vehicles/${vehicle_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/vehicles
const postOrgVehicle = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/vehicles`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return response;
};

// PATCH /orgs/{org_id}/vehicles/{vehicle_id}
const patchOrgVehicle = async (org_id: string, vehicle_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/vehicles/${vehicle_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return response;
};

// DELETE /orgs/{org_id}/vehicles/{vehicle_id}
const deleteOrgVehicle = async (org_id: string, vehicle_id: string) => {
    const url = new URL(`/orgs/${org_id}/vehicles/${vehicle_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

// GET /orgs/{org_id}/vehicles/{vehicle_id}/kilometers-overview
const getOrgVehicleKilometersOverview = async (org_id: string, vehicle_id: string, from_date: string, to_date: string) => {
    const url = new URL(`/orgs/${org_id}/vehicles/${vehicle_id}/kilometers-overview`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (from_date) queryParams.set("from_date", from_date);
    if (to_date) queryParams.set("to_date", to_date);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

export { getOrgVehicles, getOrgVehicle, postOrgVehicle, patchOrgVehicle, deleteOrgVehicle, getOrgVehicleKilometersOverview };