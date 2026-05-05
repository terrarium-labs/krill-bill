import { laiaFetch } from "../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

export const getTrainingSessions = async (
    org_id: string,
    training_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/trainings/${training_id}/sessions`,
        baseApiUrl
    );
    return await laiaFetch(url, { method: "GET" });
};

export const getTrainingSession = async (
    org_id: string,
    training_id: string,
    session_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/trainings/${training_id}/sessions/${session_id}`,
        baseApiUrl
    );
    return await laiaFetch(url, { method: "GET" });
};

export const postTrainingSession = async (
    org_id: string,
    training_id: string,
    data: Record<string, unknown>
) => {
    const url = new URL(
        `/orgs/${org_id}/trainings/${training_id}/sessions`,
        baseApiUrl
    );
    return await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
};

export const patchTrainingSession = async (
    org_id: string,
    training_id: string,
    session_id: string,
    data: Record<string, unknown>
) => {
    const url = new URL(
        `/orgs/${org_id}/trainings/${training_id}/sessions/${session_id}`,
        baseApiUrl
    );
    return await laiaFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
};

export const deleteTrainingSession = async (
    org_id: string,
    training_id: string,
    session_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/trainings/${training_id}/sessions/${session_id}`,
        baseApiUrl
    );
    return await laiaFetch(url, { method: "DELETE" });
};

export const postTrainingSessionMaterial = async (
    org_id: string,
    training_id: string,
    session_id: string,
    file: File,
    name: string
) => {
    const url = new URL(
        `/orgs/${org_id}/trainings/${training_id}/sessions/${session_id}/materials`,
        baseApiUrl
    );
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name);
    return await laiaFetch(url, {
        method: "POST",
        body: formData,
    });
};

export const patchTrainingSessionMaterial = async (
    org_id: string,
    training_id: string,
    session_id: string,
    material_id: string,
    data: Record<string, unknown>
) => {
    const url = new URL(
        `/orgs/${org_id}/trainings/${training_id}/sessions/${session_id}/materials/${material_id}`,
        baseApiUrl
    );
    return await laiaFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
};

export const deleteTrainingSessionMaterial = async (
    org_id: string,
    training_id: string,
    session_id: string,
    material_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/trainings/${training_id}/sessions/${session_id}/materials/${material_id}`,
        baseApiUrl
    );
    return await laiaFetch(url, { method: "DELETE" });
};

export const postEnrollmentSessionCompletion = async (
    org_id: string,
    training_id: string,
    enrollment_id: string,
    session_id: string,
    completed: boolean
) => {
    const url = new URL(
        `/orgs/${org_id}/trainings/${training_id}/enrollments/${enrollment_id}/sessions/${session_id}/completion`,
        baseApiUrl
    );
    return await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
    });
};
