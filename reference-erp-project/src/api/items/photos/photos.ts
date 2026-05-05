import { laiaFetch } from "../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";


//POST /orgs/{org_id}/items/{item_id}/photos Create an item photo
const postOrgItemPhotos = async (org_id: string, item_id: string, name: string, content_type: string, content_length: number, file: File) => {
    const url = new URL(`/orgs/${org_id}/items/${item_id}/photos`, baseApiUrl);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('content_type', content_type);
    formData.append('content_length', content_length.toString());
    formData.append('file', file);
    const response = await laiaFetch(url, {
        method: "POST",
        // Don't set Content-Type header - browser will set it automatically with boundary
        body: formData,
    });
    return response;
};

//GET /orgs/{org_id}/items/{item_id}/photos Get item photos
const getOrgItemPhotos = async (org_id: string, item_id: string) => {
    const url = new URL(`/orgs/${org_id}/items/${item_id}/photos`, baseApiUrl);
    const queryParams = new URLSearchParams();
    url.search = queryParams.toString();
    const response = await laiaFetch(url, {
        method: "GET",
    });
    return response;
};

//PATCH /orgs/{org_id}/items/{item_id}/photos Update item photos
const patchOrgItemPhotos = async (org_id: string, item_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/items/${item_id}/photos`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

//DELETE /orgs/{org_id}/items/{item_id}/photos/{photo_id} Delete an item photo
const deleteOrgItemPhotos = async (org_id: string, item_id: string, photo_id: string) => {
    const url = new URL(`/orgs/${org_id}/items/${item_id}/photos/${photo_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "DELETE",
    });
    return response;
};

export { postOrgItemPhotos, getOrgItemPhotos, patchOrgItemPhotos, deleteOrgItemPhotos };
