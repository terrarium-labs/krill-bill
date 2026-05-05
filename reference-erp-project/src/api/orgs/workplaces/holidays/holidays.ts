import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/workplaces/{workplace_id}/holidays - Get all holidays for a workplace
const getOrgWorkplaceHolidays = async (org_id: string, workplace_id: string, year: string) => {
    const url = new URL(`/orgs/${org_id}/workplaces/${workplace_id}/holidays?year=${year}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/workplaces/{workplace_id}/holidays - Create a new holiday
const createOrgWorkplaceHoliday = async (org_id: string, workplace_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/workplaces/${workplace_id}/holidays`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return response;
};

// DELETE /orgs/{org_id}/workplaces/{workplace_id}/holidays - Delete holidays
const deleteOrgWorkplaceHoliday = async (org_id: string, workplace_id: string, holiday_ids: string[]) => {
    const url = new URL(`/orgs/${org_id}/workplaces/${workplace_id}/holidays`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holiday_ids })
    });
    return response;
};

export { getOrgWorkplaceHolidays, createOrgWorkplaceHoliday, deleteOrgWorkplaceHoliday };
