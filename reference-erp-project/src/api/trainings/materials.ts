import { laiaFetch } from "../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

export const getTrainingMaterials = async (
    org_id: string,
    training_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/trainings/${training_id}/materials`,
        baseApiUrl
    );
    return await laiaFetch(url, { method: "GET" });
};

export const postTrainingMaterial = async (
    org_id: string,
    training_id: string,
    file: File,
    name: string
) => {
    const url = new URL(
        `/orgs/${org_id}/trainings/${training_id}/materials`,
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

export const deleteTrainingMaterial = async (
    org_id: string,
    training_id: string,
    material_id: string
) => {
    const url = new URL(
        `/orgs/${org_id}/trainings/${training_id}/materials/${material_id}`,
        baseApiUrl
    );
    return await laiaFetch(url, { method: "DELETE" });
};
