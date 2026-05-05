import { laiaFetch } from "../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";


const getMeIntegrations = async (
    page_token?: string
) => {
    const url = new URL("/me/integrations", baseApiUrl);
    const queryParams = new URLSearchParams();
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

const deleteMeIntegrations = async (id: string) => {
    const url = new URL(`/me/integrations/${id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

const postMeIntegrations = async (data: any) => {
    const url = new URL("/me/integrations", baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
    return response;
};

const getMeIntegrationStatus = async (id: string) => {
    const url = new URL(`/me/integrations/${id}/status`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /me/integrations/{integration_id}/default
const postMeIntegrationDefault = async (integration_id: string) => {
    const url = new URL(`/me/integrations/${integration_id}/default`, baseApiUrl);
    const response = await laiaFetch(url, { method: "POST" });
    return response;
};

export { getMeIntegrations, postMeIntegrations, deleteMeIntegrations, getMeIntegrationStatus, postMeIntegrationDefault };