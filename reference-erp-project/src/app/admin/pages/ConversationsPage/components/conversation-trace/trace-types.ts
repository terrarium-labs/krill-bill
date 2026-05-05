import type { CharlesRun } from "@/types/chat/conversation-runs";
import type { Message } from "@/types/chat/chat";

/** One step in a parsed trace (flat array from API). */
export type TraceCall = {
    call_id: string;
    parent_call_id?: string | null;
    path?: string | null;
    t0?: number | null;
    t1?: number | null;
    start_time?: number | null;
    end_time?: number | null;
    elapsed?: number | null;
    duration?: number;
    error?: unknown;
    input?: unknown;
    output?: unknown;
    usage?: Record<string, number> & {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
        cache_read_input_tokens?: number;
        cache_creation_input_tokens?: number;
    };
    metadata?: { type?: string;[k: string]: unknown };
    children: TraceCall[];
    [k: string]: unknown;
};

export type TraceHierarchy = {
    flatSteps: TraceCall[];
    rootCall: TraceCall | null;
};

/** One chat turn: employee message + assistant response, backed by a full API run + trace. */
export type ConversationTurn = {
    id: string;
    employeeText: string;
    assistantPreview: string;
    messages: Message[];
    run: CharlesRun;
};
