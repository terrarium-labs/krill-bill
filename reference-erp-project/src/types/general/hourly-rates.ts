import { JobTitle } from "./job-titles";

export interface HourlyRate {
    id: string;
    name: string;
    status: "active" | "inactive";
    due_date: string;
    valid_from: string;
    rate_job_titles: HourlyRateJobTitle[];
    number_job_titles: number;
}

export interface HourlyRateJobTitle {
    id: string;
    job_title: JobTitle;
    default_pvp: number;
    pmc: number;
    min_quantity: number;
    step_quantity: number;
    time_frames: TimeFrame[];
}

export interface TimeFrame {
    min_quantity: number;
    step_quantity: number;
    start_time: string;
    end_time: string;
    day_of_week: number;
    price: number;
    is_holiday?: boolean;
}