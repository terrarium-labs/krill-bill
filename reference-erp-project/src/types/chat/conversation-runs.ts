import { Employee } from "@/types/employees/employees";

/** User object on a Charles / agent run (API shape). */


export interface CharlesRunVersion {
    id: string;
    name: string;
    deployment?: unknown;
    is_prod?: boolean;
}

/** Single run row from GET .../charles-conversations/:group_id/runs */
export interface CharlesRun {
    id: string;
    parent_id?: string | null;
    group_id?: string;
    employee?: Employee;
    version?: CharlesRunVersion;
    status: string;
    status_detail?: string | null;
    duration_ms?: number;
    cost_usd?: number;
    cost_credits?: number;
    last_reaction_sentiment?: string | null;
    trace: unknown;
    /** Unix ms */
    created_at?: string;
    idempotency_key?: string;
}

export interface CharlesConversationRunsSuccess {
    runs: CharlesRun[];
    group_id?: string;
    user_id?: string | null;
    next_page_token?: string | null;
}
