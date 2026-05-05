import { laiaFetch } from '../0.core/basics';
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/trainings
export const getTrainings = async (
    org_id: string,
    query: string | null = null,
    page_token: string | null = null,
    status?: string | null,
    category_id?: string | null
) => {
    const url = new URL(`/orgs/${org_id}/trainings`, baseApiUrl);
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (page_token) params.set("page_token", page_token);
    if (status) params.set("status", status);
    if (category_id) params.set("category_id", category_id);
    url.search = params.toString();
    return await laiaFetch(url, { method: "GET" });
};

// POST /orgs/{org_id}/trainings
export const postTraining = async (org_id: string, data: Record<string, unknown>) => {
    const url = new URL(`/orgs/${org_id}/trainings`, baseApiUrl);
    return await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
};

// GET /orgs/{org_id}/trainings/{training_id}
export const getTraining = async (org_id: string, training_id: string) => {
    const url = new URL(`/orgs/${org_id}/trainings/${training_id}`, baseApiUrl);
    return await laiaFetch(url, { method: "GET" });
};

// PATCH /orgs/{org_id}/trainings/{training_id}
export const patchTraining = async (
    org_id: string,
    training_id: string,
    data: Record<string, unknown>
) => {
    const url = new URL(`/orgs/${org_id}/trainings/${training_id}`, baseApiUrl);
    return await laiaFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
};

// DELETE /orgs/{org_id}/trainings/{training_id}
export const deleteTraining = async (org_id: string, training_id: string) => {
    const url = new URL(`/orgs/${org_id}/trainings/${training_id}`, baseApiUrl);
    return await laiaFetch(url, { method: "DELETE" });
};

// GET /orgs/{org_id}/trainings/{training_id}/enrollments
export const getTrainingEnrollments = async (
    org_id: string,
    training_id: string,
    page_token: string | null = null
) => {
    const url = new URL(`/orgs/${org_id}/trainings/${training_id}/enrollments`, baseApiUrl);
    const params = new URLSearchParams();
    if (page_token) params.set("page_token", page_token);
    url.search = params.toString();
    return await laiaFetch(url, { method: "GET" });
};

// GET /orgs/{org_id}/trainings/{training_id}/enrollments/{enrollment_id}
export const getTrainingEnrollment = async (
    org_id: string,
    training_id: string,
    enrollment_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/trainings/${training_id}/enrollments/${enrollment_id}`,
        baseApiUrl
    );
    return await laiaFetch(url, { method: "GET" });
};

// POST /orgs/{org_id}/trainings/{training_id}/enrollments
export const postTrainingEnrollment = async (
    org_id: string,
    training_id: string,
    data: Record<string, unknown>
) => {
    const url = new URL(`/orgs/${org_id}/trainings/${training_id}/enrollments`, baseApiUrl);
    return await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
};

// PATCH /orgs/{org_id}/trainings/{training_id}/enrollments/{enrollment_id}
export const patchTrainingEnrollment = async (
    org_id: string,
    training_id: string,
    enrollment_id: string,
    data: Record<string, unknown>
) => {
    const url = new URL(
        `/orgs/${org_id}/trainings/${training_id}/enrollments/${enrollment_id}`,
        baseApiUrl
    );
    return await laiaFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
};

// DELETE /orgs/{org_id}/trainings/{training_id}/enrollments/{enrollment_id}
export const deleteTrainingEnrollment = async (
    org_id: string,
    training_id: string,
    enrollment_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/trainings/${training_id}/enrollments/${enrollment_id}`,
        baseApiUrl
    );
    return await laiaFetch(url, { method: "DELETE" });
};

// POST /orgs/{org_id}/trainings/{training_id}/enrollments/{enrollment_id}/attendance
export const postEnrollmentAttendance = async (
    org_id: string,
    training_id: string,
    enrollment_id: string,
    confirmed: boolean
) => {
    const url = new URL(
        `/orgs/${org_id}/trainings/${training_id}/enrollments/${enrollment_id}/attendance`,
        baseApiUrl
    );
    return await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed }),
    });
};

// GET /orgs/{org_id}/trainings/export
export const getTrainingsExport = async (
    org_id: string,
    format: "csv" | "xlsx" = "csv",
    filters?: {
        training_id?: string;
        category_id?: string;
        employee_id?: string;
        status?: string;
        from_date?: string;
        to_date?: string;
    }
) => {
    const url = new URL(`/orgs/${org_id}/trainings/export`, baseApiUrl);
    const params = new URLSearchParams();
    params.set("format", format);
    if (filters?.training_id) params.set("training_id", filters.training_id);
    if (filters?.category_id) params.set("category_id", filters.category_id);
    if (filters?.employee_id) params.set("employee_id", filters.employee_id);
    if (filters?.status) params.set("status", filters.status);
    if (filters?.from_date) params.set("from_date", filters.from_date);
    if (filters?.to_date) params.set("to_date", filters.to_date);
    url.search = params.toString();
    return await laiaFetch(url, { method: "GET" });
};

// GET /orgs/{org_id}/trainings/insights
export const getTrainingsInsights = async (
    org_id: string,
    from_date?: string,
    to_date?: string,
    training_id?: string | null
) => {
    const url = new URL(`/orgs/${org_id}/trainings/insights`, baseApiUrl);
    const params = new URLSearchParams();
    if (from_date) params.set("from_date", from_date);
    if (to_date) params.set("to_date", to_date);
    if (training_id) params.set("training_id", training_id);
    url.search = params.toString();
    return await laiaFetch(url, { method: "GET" });
};
