import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// POST /orgs/{org_id}/roles/{role_id}/custom-permissions -> Create a custom permission for a role
const postOrgRoleCustomPermission = async (org_id: string, role_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/roles/${role_id}/custom-permissions`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// DELETE /orgs/{org_id}/roles/{role_id}/custom-permissions/{permission_id} -> Delete a custom permission for a role
const deleteOrgRoleCustomPermission = async (org_id: string, role_id: string, permission_id: string) => {
    const url = new URL(`/orgs/${org_id}/roles/${role_id}/custom-permissions/${permission_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};


// POST /orgs/{org_id}/roles/{role_id}/permissions/allowed -> Update allowed permissions for a role
const postOrgRolePermissionsAllowed = async (org_id: string, role_id: string, data: { permissions_ids: string[] }) => {
    const url = new URL(`/orgs/${org_id}/roles/${role_id}/permissions/allowed`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

// GET /orgs/{org_id}/functions -> List functions !!!!! is a exeption
const getOrgFunctions = async (org_id: string) => {
    const url = new URL(`/orgs/${org_id}/functions`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};


export { postOrgRoleCustomPermission, deleteOrgRoleCustomPermission, getOrgFunctions, postOrgRolePermissionsAllowed };