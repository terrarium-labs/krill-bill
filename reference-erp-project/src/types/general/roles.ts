export interface Role {
    id: string;
    name: string;
    description: string;
    num_permissions: number;
    permissions: {
        service_name: string;
        permissions: Permission[];
    }[];
    created_at: string;
    updated_at: string;
}

export interface Permission {   
    id: string;
    name: string;
    description: string;
    endpoint_method: "get" | "post" | "patch" | "delete" | "put" | "head" | "options" | "trace";
    endpoint_path: string;
    is_allowed: boolean;
    is_custom: boolean;
}

export interface CustomPermissionFunction {
    id: string;
    name: string;
    description: string;
    is_custom: boolean;
    user_required: boolean;
}

//ONLY FOR CUSTOM PERMISSIONS POST
export interface CustomPermission {
    name: string;
    description: string;
    endpoint_method: "get" | "post" | "patch" | "delete" | "put" | "head" | "options" | "trace";
    endpoint_path: string;
    is_allowed: boolean;
    functions_used_ids: string[];
}