import { laiaFetch } from '../../0.core/basics';
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/employees/{employee_id}/trainings
export const getEmployeeTrainings = async (
    org_id: string,
    employee_id: string,
    page_token: string | null = null
) => {
    const url = new URL(
        `/orgs/${org_id}/employees/${employee_id}/trainings`,
        baseApiUrl
    );
    const params = new URLSearchParams();
    if (page_token) params.set("page_token", page_token);
    url.search = params.toString();
    return await laiaFetch(url, { method: "GET" });
};
