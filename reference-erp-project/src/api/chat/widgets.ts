import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

export interface WidgetResponse {
    type: string;
    title?: string;
    data: any;
}

const widgetCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

const fetchWidget = async (
    org_id: string,
    widget_id: string,
    { skipCache = false }: { skipCache?: boolean } = {},
) => {
    const cleanId = widget_id.replace(/^\/+|\/+$/g, "");
    const cacheKey = `${org_id}:${cleanId}`;

    if (!skipCache) {
        const cached = widgetCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            return cached.data;
        }
    }

    const result = await laiaFetch(
        new URL(`/orgs/${org_id}/charles/widgets/${cleanId}`, baseApiUrl),
        { method: "GET" },
    );

    widgetCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
};

const getCachedWidget = (
    org_id: string,
    widget_id: string,
): WidgetResponse | null => {
    const cleanId = widget_id.replace(/^\/+|\/+$/g, "");
    const cacheKey = `${org_id}:${cleanId}`;
    const cached = widgetCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        const result = cached.data;
        if ((result as any)?.error) return null;
        const payload = (result as any)?.success ?? result;
        return payload as WidgetResponse;
    }
    return null;
};

export { fetchWidget, getCachedWidget };
