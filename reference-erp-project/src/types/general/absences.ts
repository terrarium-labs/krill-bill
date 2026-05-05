export interface AbsenceType {
    id: string;
    org_id?: string | null;
    name: string;
    description: string | null;
    icon_url: string;
    color: string;
    created_at?: string | null;
}

export interface AbsenceCounter {
    id: string;
    name: string;
}

export type CycleStart = "january" | "february" | "march" | "april" | "may" | "june" | "july" | "august" | "september" | "october" | "november" | "december" | "first_day_of_contract";

export type CycleDuration = 1 | 2 | 3 | 4 | 6 | 12;

export type Unit = "days" | "hours";

export type ExpirationPeriod = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 15 | 18 | 24 | 36 | 48 | 60;

export interface AbsencePolicy {
    id: string;
    name: string;
    description: string | null;
    cycle_start: CycleStart;
    cycle_duration: CycleDuration;
    unit: Unit;
    value: number;
    is_working_day: boolean;
    is_unlimited: boolean;
    count_if_holiday: boolean;
    is_prorated: boolean;
    max_days: number;
    negative_counter: boolean;
    expiration: boolean;
    expiration_period: ExpirationPeriod;
    absence_types: AbsenceType[];
    admin_only: boolean;
    start_date: string;
    end_date: string;
    theoretical_end_date: string;
}

export interface AbsenceCounter {
    id: string;
    name: string;
    description?: string;
    cycle_start: CycleStart;
    cycle_start_year?: number;
    cycle_duration: CycleDuration;
    unit: Unit;
    value: number;
    is_working_day: boolean;
    is_unlimited: boolean;
    count_if_holiday: boolean;
    is_prorated: boolean;
    max_days: number;
    negative_counter: boolean;
    expiration: boolean;
    expiration_period: ExpirationPeriod;
    absence_types: AbsenceType[];
    admin_only: boolean;
    start_date: string;
    end_date: string;
    theoretical_end_date: string;
    created_at?: string;
}