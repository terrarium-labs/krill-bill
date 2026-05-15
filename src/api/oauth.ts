import { apiFetch } from './api';

const baseApiUrl = import.meta.env.VITE_SUPABASE_URL;

const postOauth = async (data: any) => {
    const url = new URL("/oauth/callback", baseApiUrl);
    const response = await apiFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

export { postOauth };