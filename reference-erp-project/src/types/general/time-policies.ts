export type TimePolicyType = "default" | "on_call" | "special";

export type TimeSlotRewardType = "mandatory_rest_hours" | "vacation_bonus_hours" | "monetary_bonus";

export interface TimeSlotReward {

    id: string;
    quantity: number;
    name: string;
    description: string;
    type: TimeSlotRewardType;
}

export interface TimeSlot {
    id: string;
    name: string;
    description: string | null;
    day_of_week: number;
    start_time: string;
    end_time: string;
    break_time_duration: number;
    is_holiday: boolean;
    reward_count: number;
    type: TimePolicyType;
    from_date: string;
    to_date: string;
}

export interface TimeSlotRange {
    from_date: string;
    to_date: string;
    type: TimePolicyType;
    time_slots: TimeSlot[];
}

export interface OvertimeRule {
    id: string;
    name: string;
    description: string | null;
    day_of_week: number;
    start_time: string;
    end_time: string;
    multiplier: number;
    max_hours: number;
    is_holiday: boolean;
}

export interface TimePolicy {
    id: string;
    flexibility: number;
    name: string;
    description: string | null;
    default_overtime_multiplier: number;
    number_of_slots: number;
    number_of_employees: number;
    time_slot_ranges: TimeSlotRange[];
    number_of_overtime_rules: number;
    overtime_rules: OvertimeRule[];
}

/** All time slots from every dated range (default / on_call / special). */
export function flattenTimeSlots(ranges: TimeSlotRange[] | undefined | null): TimeSlot[] {
    if (!ranges?.length) return [];
    return ranges.flatMap((r) => r.time_slots ?? []);
}

/** Default weekly schedule slots only (excludes on_call / special). */
export function flattenDefaultTimeSlots(ranges: TimeSlotRange[] | undefined | null): TimeSlot[] {
    return flattenTimeSlots(ranges).filter((s) => s.type === "default");
}
