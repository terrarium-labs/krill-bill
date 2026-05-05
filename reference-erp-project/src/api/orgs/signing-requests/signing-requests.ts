import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";
import type { NewSigningRequest } from "@/types/general/signing-requests";
import type { File as OrgFile } from "@/types/general/files";

/** Base64 / data URL → PDF blob when `file` is not a browser `File`. */
export function signingRequestBase64ToBlob(input: string): Blob {
    const trimmed = input.trim();
    const base64 = trimmed.startsWith("data:") ? (trimmed.split(",")[1] ?? "") : trimmed;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: "application/pdf" });
}

/** Row returned by original / signed / evidence document GET endpoints. */
export type SigningRequestDocumentEntry = {
    /** May be missing or null when the backend only identifies the recipient by email. */
    employee_id?: number | string | null;
    email: string;
    content: string;
    /** When present, matches `Signer.id` from the signing-request signers list. */
    signer_id?: string;
};

function isSigningRequestDocumentEntry(x: unknown): x is SigningRequestDocumentEntry {
    if (!x || typeof x !== "object") return false;
    const o = x as Record<string, unknown>;
    if (typeof o.email !== "string" || typeof o.content !== "string") return false;
    if (!o.email.trim() || !o.content.trim()) return false;

    const id = o.employee_id;
    if (id === null || id === undefined) return true;
    if (typeof id === "number" && Number.isFinite(id)) return true;
    if (typeof id === "string") return true;
    return false;
}

function sanitizeEmailForFilename(email: string): string {
    return email.trim().replace(/[^a-zA-Z0-9@._+-]+/g, "_");
}

/**
 * Parses API `success` as an array of `{ employee_id, email, content }` (or a single object).
 * `content` is Base64-encoded PDF bytes; builds a blob URL for download/preview.
 */
export function parseSigningRequestDocumentResponse(
    success: unknown,
    filenamePrefix: string
): { file: OrgFile; signerEmail: string | null } | null {
    if (success == null) return null;
    const entries: SigningRequestDocumentEntry[] = Array.isArray(success)
        ? success.filter(isSigningRequestDocumentEntry)
        : isSigningRequestDocumentEntry(success)
          ? [success]
          : [];
    const first = entries[0];
    if (!first?.content?.trim()) return null;

    const blob = signingRequestBase64ToBlob(first.content);
    const url = URL.createObjectURL(blob);
    const name = first.email?.trim()
        ? `${filenamePrefix}-${sanitizeEmailForFilename(first.email)}.pdf`
        : `${filenamePrefix}.pdf`;

    const employeeKey =
        first.employee_id != null && String(first.employee_id).trim() !== ""
            ? typeof first.employee_id === "number"
                ? String(first.employee_id)
                : String(first.employee_id).trim()
            : sanitizeEmailForFilename(first.email);

    const file: OrgFile = {
        id: `sr-doc-${filenamePrefix}-${employeeKey}`,
        name,
        path: "",
        is_dir: false,
        size: blob.size,
        url,
        created_at: "",
        created_by: {} as OrgFile["created_by"],
        updated_at: "",
    };

    return { file, signerEmail: first.email?.trim() || null };
}

/** One decoded PDF per API row (blob URL on `file.url`). */
export type SigningRequestDocumentRow = {
    employee_id: number | string | null;
    email: string;
    file: OrgFile;
    signer_id?: string;
};

/**
 * Parses every row in the API payload into a blob-backed `OrgFile` (one per signer when the API returns an array).
 */
export function parseSigningRequestDocumentEntriesList(
    success: unknown,
    filenamePrefix: string
): SigningRequestDocumentRow[] {
    if (success == null) return [];
    const raw: unknown[] = Array.isArray(success)
        ? success
        : isSigningRequestDocumentEntry(success)
          ? [success]
          : [];
    const rows: SigningRequestDocumentRow[] = [];
    for (let i = 0; i < raw.length; i++) {
        const item = raw[i];
        if (!isSigningRequestDocumentEntry(item) || !item.content?.trim()) continue;
        const blob = signingRequestBase64ToBlob(item.content);
        const url = URL.createObjectURL(blob);
        const name = item.email?.trim()
            ? `${filenamePrefix}-${sanitizeEmailForFilename(item.email)}.pdf`
            : `${filenamePrefix}-${i + 1}.pdf`;
        const employeeKey =
            item.employee_id != null && String(item.employee_id).trim() !== ""
                ? typeof item.employee_id === "number"
                    ? String(item.employee_id)
                    : String(item.employee_id).trim()
                : sanitizeEmailForFilename(item.email);
        const signerId =
            typeof item.signer_id === "string" && item.signer_id.trim() !== ""
                ? item.signer_id.trim()
                : undefined;
        const normalizedEmployeeId =
            item.employee_id == null || (typeof item.employee_id === "string" && item.employee_id.trim() === "")
                ? null
                : item.employee_id;
        rows.push({
            employee_id: normalizedEmployeeId,
            email: item.email,
            signer_id: signerId,
            file: {
                id: `sr-doc-${filenamePrefix}-${employeeKey}-${i}`,
                name,
                path: "",
                is_dir: false,
                size: blob.size,
                url,
                created_at: "",
                created_by: {} as OrgFile["created_by"],
                updated_at: "",
            },
        });
    }
    return rows;
}

// GET /orgs/{org_id}/signing-requests -> Get all signing requests for an org
const getSigningRequests = async (org_id: string, query?: string, page_token?: string) => {
    const url = new URL(`/orgs/${org_id}/signing-requests`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};


// POST /orgs/{org_id}/signing-requests — multipart: name, workflow_type, expire_time, signers JSON, file; optional description, reminders JSON
const postSigningRequest = async (org_id: string, data: NewSigningRequest) => {
    const url = new URL(`/orgs/${org_id}/signing-requests`, baseApiUrl);
    const { file, name, description, workflow_type, expire_time, reminders, signers } = data;
    const formData = new FormData();
    formData.append("name", name);
    const descriptionTrimmed = description?.trim();
    if (descriptionTrimmed) {
        formData.append("description", descriptionTrimmed);
    }
    formData.append("workflow_type", workflow_type);
    formData.append("expire_time", String(expire_time));
    if (reminders !== undefined && reminders !== null) {
        formData.append("reminders", JSON.stringify(reminders));
    }
    formData.append("signers", JSON.stringify(signers));
    if (typeof file === "string") {
        const blob = signingRequestBase64ToBlob(file);
        formData.append("file", blob, "document.pdf");
    } else {
        formData.append("file", file, file.name);
    }
    const response = await laiaFetch(url, {
        method: "POST",
        body: formData,
    });
    return response;
};

// GET /orgs/{org_id}/signing-requests/{signing_request_id} -> Get a signing request by id
const getSigningRequest = async (org_id: string, signing_request_id: string) => {
    const url = new URL(`/orgs/${org_id}/signing-requests/${signing_request_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// DELETE /orgs/{org_id}/signing-requests/{signing_request_id} -> Delete a signing request by id
const deleteSigningRequest = async (org_id: string, signing_request_id: string) => {
    const url = new URL(`/orgs/${org_id}/signing-requests/${signing_request_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

// GET /orgs/{org_id}/signing-requests/{signing_request_id}/signers -> Get all signers for a signing request
const getSigningRequestSigners = async (org_id: string, signing_request_id: string, query?: string, page_token?: string) => {
    const url = new URL(`/orgs/${org_id}/signing-requests/${signing_request_id}/signers`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// GET /orgs/{org_id}/signing-requests/{signing_request_id}/original-document
const getSigningRequestOriginalDocument = async (org_id: string, signing_request_id: string) => {
    const url = new URL(`/orgs/${org_id}/signing-requests/${signing_request_id}/original-document`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// GET /orgs/{org_id}/signing-requests/{signing_request_id}/signed-document
const getSigningRequestSignedDocument = async (org_id: string, signing_request_id: string) => {
    const url = new URL(`/orgs/${org_id}/signing-requests/${signing_request_id}/signed-document`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// GET /orgs/{org_id}/signing-requests/{signing_request_id}/evidence-document 
const getSigningRequestEvidenceDocument = async (org_id: string, signing_request_id: string) => {
    const url = new URL(`/orgs/${org_id}/signing-requests/${signing_request_id}/evidence-document`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// GET /orgs/{org_id}/me/pending-signing-requests
const getMyPendingSignatures = async (org_id: string, page_token?: string) => {
    const url = new URL(`/orgs/${org_id}/me/pending-signing-requests`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/me/pending-signing-requests/{signing_request_id}/sign
const postMySignature = async (org_id: string, signing_request_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/me/pending-signing-requests/${signing_request_id}/sign`, baseApiUrl);
    const response = await laiaFetch(url, { method: "POST", body: data });
    return response;
};


export {
    getSigningRequests,
    postSigningRequest,
    getSigningRequest,
    deleteSigningRequest,
    getSigningRequestSigners,
    getSigningRequestOriginalDocument,
    getSigningRequestSignedDocument,
    getSigningRequestEvidenceDocument,
    getMyPendingSignatures,
    postMySignature,
};