import { laiaFetch } from "../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";
/*POST /orgs/{org_id}/stocks Create a new inventory transaction */
const postOrgItemStock = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/stocks`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

export {
    postOrgItemStock,
};