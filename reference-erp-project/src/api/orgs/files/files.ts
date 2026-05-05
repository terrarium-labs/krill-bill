import { laiaFetch } from "../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

//POST /orgs/{org_id}/files/uploader Get the uploader for a file.
const postOrgFilesUploader = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/files/uploader`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

//POST /orgs/{org_id}/files Create a file for an org. V2 API {entity_id*, name*, content_length*, content_type*, file*, path?} -> url 
const postOrgFilesV2 = async (org_id: string, entity_id: string, name: string, content_length: number, content_type: string, file: File, path: string | null) => {
    const url = new URL(`/orgs/${org_id}/files`, baseApiUrl);
    const formData = new FormData();
    formData.append('entity_id', entity_id);
    formData.append('name', name);
    formData.append('content_length', content_length.toString());
    formData.append('content_type', content_type);
    formData.append('file', file);
    if (path) {
        formData.append('path', path);
    }

    const response = await laiaFetch(url, {
        method: "POST",
        // Don't set Content-Type header - browser will set it automatically with boundary
        body: formData,
    });
    return response;
};



//POST /orgs/{org_id}/filesCreate a file for an org.
const postOrgFiles = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/files-old`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

//GET /orgs/{org_id}/files Get files for an org.
const getOrgFiles = async (org_id: string, entity_id: string, path: string = "", query: string = "", page_token: string = "", name_asc: boolean = false, created_at_asc: boolean = false) => {
    const url = new URL(`/orgs/${org_id}/files`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (entity_id) queryParams.set("entity_id", entity_id);
    if (path) queryParams.set("path", path);
    if (page_token) queryParams.set("page_token", page_token);
    if (name_asc) queryParams.set("name_asc", name_asc.toString());
    if (created_at_asc) queryParams.set("created_at_asc", created_at_asc.toString());
    url.search = queryParams.toString();
    const response = await laiaFetch(url, {
        method: "GET",
    });
    return response;
};

//PATCH /orgs/{org_id}/files/{file_id} Update a file for an org.
const patchOrgFiles = async (org_id: string, file_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/files/${file_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
};

//POST /orgs/{org_id}/files/{file_id}/delete Delete a file
const postOrgFilesDelete = async (org_id: string, file_id: string) => {
    const url = new URL(`/orgs/${org_id}/files/${file_id}/delete`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
    });
    return response;
};

export { postOrgFilesUploader, postOrgFilesV2, postOrgFiles, getOrgFiles, patchOrgFiles, postOrgFilesDelete };