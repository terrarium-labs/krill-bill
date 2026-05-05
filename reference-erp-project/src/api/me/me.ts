import { laiaFetch } from '../0.core/basics';
import { baseApiUrl } from "@/api/0.core/url";

// GET /me -> { user: { id: number, name: string, email: string, phone: string, photo_url: string, lang: string } }
export const getMe = async () => {
    const url = new URL("/me", baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// PATCH /me -> { detail: Array<{ loc: Array<string | number>, msg: string, type: string }> } (en caso de error)
export const patchMe = async (data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    photo_url?: string;
    lang?: string;
}) => {
    const url = new URL("/me", baseApiUrl);

    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    return response;
};

// GET /me/orgs query: string, page_token: string | null
export const getMeOrgs = async (query: string, page_token: string | null) => {
    const url = new URL("/me/orgs", baseApiUrl);
    const queryParams = new URLSearchParams();

    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);

    url.search = queryParams.toString();

    const response = await laiaFetch(url, { method: "GET" });
    return response;
};