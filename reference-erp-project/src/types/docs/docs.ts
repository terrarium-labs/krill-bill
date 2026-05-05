import type { IconType } from "@/types/miscelanea";

export interface PlatformDocument {
    id: string;
    name: string;
    slug?: string;
    /** HTTPS URL that returns markdown for the in-app documentation viewer. */
    url: string;
    /** Iconify string (e.g. `lucide:book` or `mdi:file`) or Lucide name; see {@link IconType}. */
    icon: IconType | null;
    children: PlatformDocument[] | null;
}

/**
 * Expected JSON body for `GET /orgs/{org_id}/platform-documents`.
 * Backends may use a different envelope; {@link parsePlatformDocumentsResponse} normalizes it.
 */
export interface PlatformDocumentsListBody {
    platform_documents?: PlatformDocument[];
    documents?: PlatformDocument[];
}

/** Normalize list endpoint JSON to a document tree (root items). */
export function parsePlatformDocumentsResponse(data: unknown): PlatformDocument[] {
    if (data == null) return [];
    if (Array.isArray(data)) return data as PlatformDocument[];
    if (typeof data === "object") {
        const o = data as PlatformDocumentsListBody;
        if (Array.isArray(o.platform_documents)) return o.platform_documents;
        if (Array.isArray(o.documents)) return o.documents;
    }
    return [];
}