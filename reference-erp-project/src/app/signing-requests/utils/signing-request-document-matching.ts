import type { SigningRequestDocumentRow } from "@/api/orgs/signing-requests/signing-requests";
import type { Signer } from "@/types/general/signing-requests";

function normalizeEmail(value: string | null | undefined): string | null {
    const t = value?.trim().toLowerCase();
    return t || null;
}

function normalizeIdKey(value: number | string | null | undefined): string | null {
    if (value === null || value === undefined) return null;
    const s = String(value).trim();
    return s || null;
}

function collectSignerEmails(signer: Signer): Set<string> {
    const out = new Set<string>();
    const add = (v: string | null | undefined) => {
        const n = normalizeEmail(v);
        if (n) out.add(n);
    };
    add(signer.email);
    add(signer.employee?.email);
    return out;
}

/** IDs the backend may put on `employee_id` in document rows (employee record vs org user). */
function collectSignerEmployeeKeys(signer: Signer): Set<string> {
    const out = new Set<string>();
    const add = (v: string | null | undefined) => {
        const k = normalizeIdKey(v ?? null);
        if (k) out.add(k);
    };
    add(signer.employee?.id);
    add(signer.employee?.org_user_id);
    return out;
}

/**
 * Finds the signed/evidence document row for a signer.
 * Prefer `signer_id` when the API sends it; otherwise match by email (signer + employee)
 * or `employee_id` against employee `id` / `org_user_id`.
 */
export function matchSignerToDocumentRow(
    signer: Signer,
    rows: SigningRequestDocumentRow[]
): SigningRequestDocumentRow | undefined {
    const emails = collectSignerEmails(signer);
    const empKeys = collectSignerEmployeeKeys(signer);

    return rows.find((row) => {
        if (row.signer_id && row.signer_id === signer.id) return true;

        const rowEmail = normalizeEmail(row.email);
        if (rowEmail && emails.has(rowEmail)) return true;

        const rowEmp = normalizeIdKey(row.employee_id);
        if (rowEmp && empKeys.has(rowEmp)) return true;

        return false;
    });
}
