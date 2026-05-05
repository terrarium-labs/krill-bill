import { laiaFetch } from '../0.core/basics';
import { baseApiUrl } from "@/api/0.core/url";

const postOauth = async (data: any) => {
    const url = new URL("/oauth/callback", baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

export { postOauth };