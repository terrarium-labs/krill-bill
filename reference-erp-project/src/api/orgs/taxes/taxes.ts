import { laiaFetch } from "../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/taxes -> { taxes: Array<{ id: string, name: string, description: string, created_at: string }> }
const getOrgTaxes = async (org_id: string, is_default?: boolean) => {
    const url = new URL(`/orgs/${org_id}/taxes`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (is_default) queryParams.set("is_default", is_default.toString());
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

const postOrgTaxesDefault = async (org_id: string, data: { tax_ids: string[] }) => {
    const url = new URL(`/orgs/${org_id}/taxes/default`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

export { getOrgTaxes, postOrgTaxesDefault };