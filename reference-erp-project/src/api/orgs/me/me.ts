import { laiaFetch } from "../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/users/me
const getOrgMe = async (org_id: string) => {
    const url = new URL(`/orgs/${org_id}/users/me`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

export { getOrgMe };