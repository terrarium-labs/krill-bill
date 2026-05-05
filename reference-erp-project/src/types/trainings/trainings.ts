export type TrainingDeliveryType = "online" | "in_person" | "hybrid";

/** Who may enroll: organization-wide vs invite-only. */
export type TrainingVisibility = "public" | "private";

export type TrainingStatus =
    | "draft"
    | "scheduled"
    | "in_progress"
    | "completed"
    | "cancelled";

export type EnrollmentStatus =
    | "enrolled"
    | "in_progress"
    | "completed"
    | "failed"
    | "withdrew";

export interface TrainingCategory {
    id: string;
    org_id: string;
    name: string;
    description?: string | null;
    color?: string | null;
}


export interface TrainingMaterial {
    id: string;
    training_id: string;
    name: string;
    file_url: string;
    file_type?: string | null;
    file_size?: number | null;
    uploaded_by?: string | null;
    created_at: string;
}

export interface Training {
    id: string;
    title: string;
    description?: string | null;
    category_id?: string | null;
    /** When set, preferred over single `category_id` for multi-label trainings. */
    category_ids?: string[];
    category?: TrainingCategory | null;
    categories?: TrainingCategory[];
    delivery_type: TrainingDeliveryType;
    delivery_types?: TrainingDeliveryType[];
    /** When omitted, treat as `"public"` for display and editing. */
    visibility?: TrainingVisibility;
    status: TrainingStatus;
    statuses?: TrainingStatus[];
    provider?: string | null;
    location?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    duration_hours?: number | null;
    is_mandatory: boolean;
    max_participants?: number | null;
    enrolled_count?: number;
    sessions_count?: number;
    validity_months?: number | null;
    learning_platform_url?: string | null;
    cost_per_participant?: number | null;
    budget?: number | null;
    is_subsidized?: boolean;
    subsidized_by?: string | null;
}

export interface TrainingSession {
    id: string;
    training_id: string;
    title: string;
    description?: string | null;
    content?: string | null;
    order: number;
    /** When false, learners typically should not see this session yet. Omit/true treated as visible. */
    is_visible?: boolean | null;
    is_required: boolean;
    date?: string | null;
    duration_minutes?: number | null;
    location?: string | null;
    created_at: string;
    updated_at: string;
    materials?: TrainingSessionMaterial[];
}

export interface TrainingSessionMaterial {
    id: string;
    session_id: string;
    name: string;
    file_url: string;
    /** When true, learner must open this file before marking the session complete. */
    read_required?: boolean | null;
    file_type?: string | null;
    file_size?: number | null;
    uploaded_by?: string | null;
    created_at: string;
}

export interface TrainingEnrollmentEmployee {
    id: string;
    first_name: string;
    last_name: string;
    photo_url?: string | null;
}

/** Per-material read tracking on a session (returned on enrollment detail). */
export interface EnrollmentSessionMaterialProgress {
    id: string;
    name: string;
    read_required: boolean;
    read_at?: string | null;
}

export interface EnrollmentSessionCompletion {
    session_id?: string;
    session_title: string;
    completed: boolean;
    completed_at?: string | null;
    session_materials?: EnrollmentSessionMaterialProgress[];
}

export interface TrainingEnrollment {
    id: string;
    training_id: string;
    training?: Training;
    employee_id: string;
    employee?: TrainingEnrollmentEmployee;
    status: EnrollmentStatus;
    enrolled_at: string;
    completion_date?: string | null;
    expires_at?: string | null;
    attendance_confirmed?: boolean;
    attendance_confirmed_at?: string | null;
    score?: number | null;
    certificate_url?: string | null;
    notes?: string | null;
    /** From list/detail API; prefer with `total_sessions` for progress when `session_completions` is omitted. */
    total_sessions?: number | null;
    completed_sessions?: number | null;
    session_completions?: EnrollmentSessionCompletion[] | null;
}

export interface TrainingInsights {
    total_trainings: number;
    /** Present when API scopes by training or returns session aggregates. */
    total_sessions?: number;
    total_enrollments: number;
    completion_rate: number;
    total_hours_delivered: number;
    mandatory_completion_rate: number;
    optional_completion_rate: number;
    total_cost: number;
    /** Counts keyed by enrollment status. */
    enrollments_by_status: Record<string, number>;
    top_categories: Array<{
        category_id: string;
        category_name: string;
        count: number;
    }>;
}
