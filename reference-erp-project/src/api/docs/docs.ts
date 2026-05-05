import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /platform-documents — list platform documentation tree (no query parameters)
const getPlatformDocuments = async () => {
    const url = new URL("/platform-documents", baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

export { getPlatformDocuments };
