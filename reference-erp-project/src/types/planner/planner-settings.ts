/**
 * Planner settings for automatic replanning and Mapbox Optimization v2.
 * Custom interface for route planning configuration (excludes agent instructions).
 */

export type ReplanFrequencyUnit = "days" | "weeks" | "months";

/** Replan frequency: manual or interval with value + unit */
export type ReplanFrequency =
    | { mode: "manual" }
    | { mode: "interval"; value: number; unit: ReplanFrequencyUnit };

export type DurationUnit = "minutes" | "hours";

/** Duration with value + unit (minutes or hours) */
export interface DurationValue {
    value: number;
    unit: DurationUnit;
}

export interface PlannerSettings {
    /** How often the automatic replan runs */
    replan_frequency: ReplanFrequency;
    /** How far ahead to plan (value + minutes/hours) */
    planning_horizon: DurationValue;
    /** Times of day when replan runs (hh:mm format, e.g. ["06:00", "12:00", "18:00"]) */
    replan_start_times: string[];
    /** How far ahead employees can see their planned routes (value + minutes/hours) */
    employee_route_visibility: DurationValue;
    /** Max time before employee shift start (value + minutes/hours) */
    max_before_shift: DurationValue;
    /** Max time after employee shift end (value + minutes/hours) */
    max_after_shift: DurationValue;
    // --- Optimization priorities (commented out for now, uncomment to enable) ---
    // /** Travel time importance (1-5) */
    // travel_time_level: number;
    // /** Skills matching importance (1-5) */
    // skills_matching_level: number;
    // /** Workload balance importance (1-5) */
    // workload_balance_level: number;
    // /** Work order priority importance (1-5) */
    // priority_level: number;
    /** Default service time at each stop (value + minutes/hours) */
    default_service_time: DurationValue;
}
