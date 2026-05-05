import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";


// GET /orgs/{org_id}/vehicles/{vehicle_id}/coordinates
const getOrgVehicleCoordinates = async (org_id: string, vehicle_id: string, day: string) => {
    const url = new URL(`/orgs/${org_id}/vehicles/${vehicle_id}/coordinates`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (day) queryParams.set("day", day);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/vehicles/{vehicle_id}/coordinates
const postOrgVehicleCoordinates = async (org_id: string, vehicle_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/vehicles/${vehicle_id}/coordinates`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

export { getOrgVehicleCoordinates, postOrgVehicleCoordinates };