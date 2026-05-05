import { laiaFetch } from "../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

const getOrgInvitations = async (orgId: string, query?: string, pageToken?: string | null) => {
    const url = new URL(`/orgs/${orgId}/invitations`, baseApiUrl);
    if (query) {
        url.searchParams.set("query", query);
    }
    if (pageToken) {
        url.searchParams.set("page_token", pageToken);
    }
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

const cancelOrgInvitation = async (orgId: string, invitationId: string) => {
    const url = new URL(`/orgs/${orgId}/invitations/${invitationId}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

export { getOrgInvitations, cancelOrgInvitation };