export type ReportParameterType =
    | "date"
    | "date_range"
    | "text"
    | "number"
    | "select"
    | "employee_select"
    | "employee_multi_select"
    | "boolean";

export interface ReportParameterOption {
    value: string;
    label: string;
}

export interface ReportParameter {
    key: string;
    type: ReportParameterType;
    label: string;
    required: boolean;
    placeholder?: string;
    options?: ReportParameterOption[];
    /** Only relevant for date_range; uses keys `${key}_from` and `${key}_to` */
    range_label_from?: string;
    range_label_to?: string;
}

export interface Report {
    id: string;
    name: string;
    description: string;
    category: string;
    parameters: ReportParameter[];
}

export interface ReportCategory {
    id: string;
    name: string;
    description: string;
    reports: Report[];
}

export interface ReportRunResult {
    /** URL to download the generated report file */
    download_url?: string;
    /** File name suggestion for the download */
    file_name?: string;
    /** If the backend returns inline data instead of a file */
    data?: Record<string, unknown>[];
    /** Total records in the result */
    total_records?: number;
}

/** Values submitted when running a report — keyed by parameter.key */
export type ReportParameterValues = Record<string, string | string[] | boolean | Date | null | undefined>;
