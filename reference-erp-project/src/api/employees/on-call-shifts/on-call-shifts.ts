import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/employees/{employee_id}/on-call-shifts
const getEmployeeOnCallShifts = async (org_id: string, employee_id: string, from_date: string, to_date: string) => {
    const url = new URL(`/orgs/${org_id}/employees/${employee_id}/on-call-shifts`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (from_date) queryParams.set("from_date", from_date);
    if (to_date) queryParams.set("to_date", to_date);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

export { getEmployeeOnCallShifts };