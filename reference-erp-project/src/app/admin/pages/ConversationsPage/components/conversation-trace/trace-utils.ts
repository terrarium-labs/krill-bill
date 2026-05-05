import type { TraceCall, TraceHierarchy } from "./trace-types";

const KNOWN_USAGE_KEYS = new Set([
    "prompt_tokens",
    "completion_tokens",
    "total_tokens",
    "cache_read_input_tokens",
    "cache_creation_input_tokens",
]);

export function parseTrace(raw: unknown): TraceCall[] {
    if (Array.isArray(raw)) return raw as TraceCall[];
    if (typeof raw === "string") {
        try {
            const parsed = JSON.parse(raw) as unknown;
            return Array.isArray(parsed) ? (parsed as TraceCall[]) : [];
        } catch {
            return [];
        }
    }
    return [];
}

export function buildHierarchy(trace: unknown): TraceHierarchy {
    const arr = parseTrace(trace);
    if (arr.length === 0) {
        return { flatSteps: [], rootCall: null };
    }

    const callMap = new Map<string, TraceCall>();

    for (const call of arr) {
        const id = call.call_id;
        if (!id) continue;
        const t0 = call.start_time ?? call.t0 ?? 0;
        const t1 = call.end_time ?? call.t1 ?? t0;
        callMap.set(id, {
            ...call,
            children: [],
            duration:
                typeof call.duration === "number"
                    ? call.duration
                    : Number(t1) - Number(t0),
        });
    }

    let rootCall: TraceCall | null = null;
    for (const call of arr) {
        const id = call.call_id;
        if (!id || !callMap.has(id)) continue;
        const node = callMap.get(id)!;
        const parentId = call.parent_call_id;
        if (parentId && callMap.has(parentId)) {
            callMap.get(parentId)!.children.push(node);
        }
        if (!parentId) {
            rootCall = node;
        }
    }

    callMap.forEach((node) => {
        node.children.sort(
            (a, b) =>
                (Number(a.start_time ?? a.t0) || 0) -
                (Number(b.start_time ?? b.t0) || 0),
        );
    });

    const flatSteps: TraceCall[] = [];
    const dfs = (node: TraceCall) => {
        flatSteps.push(node);
        node.children.forEach(dfs);
    };
    if (rootCall) dfs(rootCall);

    return { flatSteps, rootCall };
}

export function getTokenCount(step: TraceCall): number | null {
    const u = step.usage;
    if (!u || typeof u !== "object") return null;
    if (typeof u.total_tokens === "number") return u.total_tokens;
    const p = u.prompt_tokens ?? 0;
    const c = u.completion_tokens ?? 0;
    if (p + c > 0) return p + c;
    let sum = 0;
    for (const [k, v] of Object.entries(u)) {
        if (KNOWN_USAGE_KEYS.has(k) || typeof v !== "number") continue;
        if (k.includes(":input_tokens") || k.includes(":output_tokens")) sum += v;
    }
    return sum > 0 ? sum : null;
}

export function getActualModel(step: TraceCall): string | null {
    if (step.usage) {
        for (const key of Object.keys(step.usage)) {
            if (
                !KNOWN_USAGE_KEYS.has(key) &&
                typeof step.usage[key] === "number" &&
                key.includes(":")
            ) {
                return key.slice(0, key.indexOf(":"));
            }
        }
    }
    const m = step.metadata;
    if (m && typeof m === "object") {
        const meta = m as Record<string, unknown>;
        return (
            (typeof meta.model_name === "string" && meta.model_name) ||
            (typeof meta.model === "string" && meta.model) ||
            null
        );
    }
    return null;
}
