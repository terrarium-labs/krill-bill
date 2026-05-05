import { laiaFetch } from '../../0.core/basics';
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/me/employee/trainings
export const getMyTrainings = async (
    org_id: string,
    page_token: string | null = null
) => {
    const url = new URL(`/orgs/${org_id}/me/employee/trainings`, baseApiUrl);
    const params = new URLSearchParams();
    if (page_token) params.set("page_token", page_token);
    url.search = params.toString();
    return await laiaFetch(url, { method: "GET" });
};
