import { laiaFetch } from '../../0.core/basics';
import { baseApiUrl } from "@/api/0.core/url";

// GET /me/api-keys -> { api_keys: Array<{ id: string, name: string, key: string, created_at: string, last_used: string | null }> }
export const getMeApiKeys = async () => {
    const url = new URL("/me/api-keys", baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /me/api-keys { name: string } -> { api_key: { id: string, name: string, key: string, created_at: string, last_used: string | null } }
export const postMeApiKeys = async (data: { name: string }) => {
    const url = new URL("/me/api-keys", baseApiUrl);

    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /me/api-keys/{api_key_id} -> 204 No Content
export const deleteMeApiKey = async (api_key_id: string) => {
    const url = new URL(`/me/api-keys/${api_key_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};