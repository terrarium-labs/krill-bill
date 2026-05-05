import { laiaFetch } from "../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/clients/{client_id}/stakeholders - List stakeholders for a client
export const getClientStakeholders = async (
    org_id: string,
    client_id: string,
    page_token?: string
) => {
    const url = new URL(
        `/orgs/${org_id}/clients/${client_id}/stakeholders`,
        baseApiUrl
    );
    const queryParams = new URLSearchParams();
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();

    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/clients/{client_id}/stakeholders - Create a stakeholder for a client
export const postClientStakeholder = async (
    org_id: string,
    client_id: string,
    data: any
) => {
    const url = new URL(
        `/orgs/${org_id}/clients/${client_id}/stakeholders`,
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

// DELETE /orgs/{org_id}/clients/{client_id}/stakeholders/{stakeholder_id} - Delete a stakeholder for a client
export const deleteClientStakeholder = async (
    org_id: string,
    client_id: string,
    stakeholder_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/clients/${client_id}/stakeholders/${stakeholder_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

