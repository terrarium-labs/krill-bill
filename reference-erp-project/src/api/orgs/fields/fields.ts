import { laiaFetch } from "../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// Orgs Fields ☭ ######################################################### / ☭

// POST /orgs/{org_id}/fields -> { field: { id: string, name: string, description: string, created_at: string, updated_at: string } }
const postOrgField = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/fields`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// GET /orgs/{org_id}/fields -> { fields: Array<{ id: string, name: string, description: string, created_at: string, updated_at: string }> }
const getOrgFields = async (org_id: string, table_name: string) => {
    const url = new URL(`/orgs/${org_id}/fields`, baseApiUrl);

    // Convertir a PascalCase: primera letra mayúscula + camelCase
    const toPascalCase = (str: string) => {
        return str
            .split(/[_\s-]+/) // Dividir por guiones bajos, espacios o guiones
            .map(
                (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join("");
    };

    // Agregar table_name como query parameter
    const queryParams = new URLSearchParams();
    queryParams.set("table_name", toPascalCase(table_name));
    url.search = queryParams.toString();

    const response = await laiaFetch(url, {
        method: "GET",
    });
    return response;
};

// PATCH /orgs/{org_id}/fields/{field_id} -> { field: { id: string, name: string, description: string, created_at: string, updated_at: string } }
const patchOrgField = async (org_id: string, field_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/fields/${field_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/fields/{field_id} -> 204 No Content
const deleteOrgField = async (org_id: string, field_id: string) => {
    const url = new URL(`/orgs/${org_id}/fields/${field_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

export { postOrgField, getOrgFields, patchOrgField, deleteOrgField };