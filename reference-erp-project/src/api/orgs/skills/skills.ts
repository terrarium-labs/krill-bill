import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/skills -> { skills: Array<{ id: string, type: "hard" | "soft", name: string, description: any | null, level: number }> }
const getOrgSkills = async (
    org_id: string,
    type?: "hard" | "soft",
    query?: string,
    page_token?: string
) => {
    const url = new URL(`/orgs/${org_id}/skills`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    if (type) queryParams.set("type", type);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/skills -> { skill: { id: string, type: "hard" | "soft", name: string, description: any | null, level: number } }
const postOrgSkill = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/skills`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// GET /orgs/{org_id}/skills/{skill_id} -> { skill: { id: string, type: "hard" | "soft", name: string, description: any | null, level: number } }
const getOrgSkill = async (org_id: string, skill_id: string) => {
    const url = new URL(`/orgs/${org_id}/skills/${skill_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// PATCH /orgs/{org_id}/skills/{skill_id} -> { skill: { id: string, type: "hard" | "soft", name: string, description: any | null, level: number } }
const patchOrgSkill = async (org_id: string, skill_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/skills/${skill_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/skills/{skill_id} -> 204 No Content
const deleteOrgSkill = async (org_id: string, skill_id: string) => {
    const url = new URL(`/orgs/${org_id}/skills/${skill_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

export { getOrgSkills, postOrgSkill, getOrgSkill, patchOrgSkill, deleteOrgSkill };

