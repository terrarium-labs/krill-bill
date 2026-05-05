import type { SigningRequest } from "@/types/general/signing-requests";

export type SigningRequestProgressCounts = {
    total: number;
    /** Signers who have completed signing (derived from total − pending − errors when API sends counters). */
    completed: number;
    pending: number;
    errors: number;
};

/**
 * Signer counters from the API (`number_of_signers`, `number_of_signers_pending`, `number_of_signers_errors`)
 * with fallbacks from `overall_status` when optional counters are omitted.
 */
export function getSigningRequestProgressCounts(req: SigningRequest): SigningRequestProgressCounts {
    const total = Math.max(0, req.number_of_signers ?? 0);
    const pendingRaw = req.number_of_signers_pendings;
    const errorsRaw = req.number_of_signers_errors;

    const hasPending = typeof pendingRaw === "number" && Number.isFinite(pendingRaw);
    const hasErrors = typeof errorsRaw === "number" && Number.isFinite(errorsRaw);

    if (hasPending && hasErrors) {
        const pending = Math.max(0, pendingRaw);
        const errors = Math.max(0, errorsRaw);
        const completed = Math.max(0, Math.min(total, total - pending - errors));
        return { total, completed, pending, errors };
    }

    if (req.overall_status === "signed") {
        return {
            total,
            completed: total,
            pending: 0,
            errors: hasErrors ? Math.max(0, errorsRaw) : 0,
        };
    }

    if (hasPending) {
        const pending = Math.max(0, pendingRaw);
        const errors = hasErrors ? Math.max(0, errorsRaw) : 0;
        const completed = Math.max(0, Math.min(total, total - pending - errors));
        return { total, completed, pending, errors };
    }

    if (hasErrors) {
        const errors = Math.max(0, errorsRaw);
        const rest = Math.max(0, total - errors);
        return { total, completed: 0, pending: rest, errors };
    }

    return {
        total,
        completed: 0,
        pending: total,
        errors: 0,
    };
}

/** List summary: treat fully executed envelopes as completed. */
export function isSigningRequestListCompleted(req: SigningRequest): boolean {
    return req.overall_status === "signed";
}
