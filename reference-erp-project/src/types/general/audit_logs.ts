import { OrgUser } from "./user";

export interface AuditLog {
    id: string,
    org_user: OrgUser,
    ip_address: string,
    user_agent: string,
    api_version: string,
    req_method: string,
    req_path: string,
    req_body: string,
    req_params: string,
    res_status: number,
    res_body: string,
    duration_ms: number,
    created_at: string, 
}