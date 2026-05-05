import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

//GET /orgs/{org_id}/employees/{employee_id}/skills -> { skills: Array<{ id: string, type: "hard" | "soft", name: string, description: any | null, level: number }> }
const getEmployeeSkills = async (org_id: string, employee_id: string) => {
    const url = new URL(`/orgs/${org_id}/employees/${employee_id}/skills`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

//POST /orgs/{org_id}/employees/{employee_id}/skills -> { skill: { id: string, type: "hard" | "soft", name: string, description: any | null, level: number } }
const postEmployeeSkill = async (org_id: string, employee_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/employees/${employee_id}/skills`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

//DELETE /orgs/{org_id}/employees/{employee_id}/skills/{skill_id} -> 204 No Content
const deleteEmployeeSkill = async (org_id: string, employee_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/employees/${employee_id}/skills`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

export { getEmployeeSkills, postEmployeeSkill, deleteEmployeeSkill };