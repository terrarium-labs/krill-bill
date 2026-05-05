import { laiaFetch } from "../../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// POST /orgs/{org_id}/time-policies/{time_policy_id}/time-slots -> Create a time slot
const postTimeSlot = async (
    org_id: string,
    time_policy_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/time-policies/${time_policy_id}/time-slots`,
        baseApiUrl
    );
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// GET /orgs/{org_id}/time-policies/{time_policy_id}/time-slots -> List time slots
const getTimeSlots = async (
    org_id: string,
    time_policy_id: string,
    query?: string | null,
    page_token?: string | null
) => {
    const url = new URL(
        `/orgs/${org_id}/time-policies/${time_policy_id}/time-slots`,
        baseApiUrl
    );
    const queryParams = new URLSearchParams();

    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);

    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// GET /orgs/{org_id}/time-policies/{time_policy_id}/time-slots/{time_slot_id} -> Get a time slot
const getTimeSlot = async (
    org_id: string,
    time_policy_id: string,
    time_slot_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/time-policies/${time_policy_id}/time-slots/${time_slot_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// PATCH /orgs/{org_id}/time-policies/{time_policy_id}/time-slots/{time_slot_id} -> Update a time slot
const patchTimeSlot = async (
    org_id: string,
    time_policy_id: string,
    time_slot_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/time-policies/${time_policy_id}/time-slots/${time_slot_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/time-policies/{time_policy_id}/time-slots/{time_slot_id} -> Delete a time slot
const deleteTimeSlot = async (
    org_id: string,
    time_policy_id: string,
    time_slot_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/time-policies/${time_policy_id}/time-slots/${time_slot_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

export {
    postTimeSlot,
    getTimeSlots,
    getTimeSlot,
    patchTimeSlot,
    deleteTimeSlot,
};

