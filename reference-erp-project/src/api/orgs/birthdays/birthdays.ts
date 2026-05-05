import { laiaFetch } from "../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";


// GET /orgs/{org_id}/birthdays -> { birthdays: Array<{ id: string, name: string, date: string }> }
const getBirthdays = async (org_id: string, from_date?: string, to_date?: string) => {
    const url = new URL(`/orgs/${org_id}/birthdays`, baseApiUrl);
    if (from_date) url.searchParams.set("from_date", from_date);
    if (to_date) url.searchParams.set("to_date", to_date);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

export { getBirthdays };