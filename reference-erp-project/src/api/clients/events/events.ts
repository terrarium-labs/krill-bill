import { laiaFetch } from '@/api/0.core/basics';
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/clients/{client_id}/events
export const getClientEvents = async (
    org_id: string,
    client_id: string,
    query?: string,
    page_token?: string
) => {
    const url = new URL(
        `/orgs/${org_id}/clients/${client_id}/events`,
        baseApiUrl
    );
    const queryParams = new URLSearchParams();

    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);

    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// GET /orgs/{org_id}/clients/{client_id}/events/{event_id}
export const getClientEvent = async (
    org_id: string,
    client_id: string,
    event_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/clients/${client_id}/events/${event_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};
