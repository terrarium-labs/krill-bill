import { laiaFetch } from "../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// POST /orgs/{org_id}/checklists
// {
//     "name": "string",
//     "description": "string",
//     "data": any
//   }
export const postChecklist = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/checklists`, baseApiUrl);

    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// PATCH /orgs/{org_id}/checklists/{checklist_id}
export const patchChecklist = async (org_id: string, checklist_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/checklists/${checklist_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data)
    });
    return response;
};

// GET /orgs/{org_id}/checklists
// -> checklists: Checklist[]
export const getChecklists = async (org_id: string) => {
    const url = new URL(`/orgs/${org_id}/checklists`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// GET /orgs/{org_id}/checklists/{checklist_id}
// -> checklist: Checklist
export const getChecklist = async (org_id: string, checklist_id: string) => {
    const url = new URL(
        `/orgs/${org_id}/checklists/${checklist_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// DELETE /orgs/{org_id}/checklists/{checklist_id}
export const deleteChecklist = async (org_id: string, checklist_id: string) => {
    const url = new URL(
        `/orgs/${org_id}/checklists/${checklist_id}`,
        baseApiUrl
    );
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

