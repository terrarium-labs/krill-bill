import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";


// GET /orgs/{org_id}/work-orders/{work_order_id}/hard-skills -> Hard skills for a work order
const getWorkOrderHardSkills = async (org_id: string, work_order_id: string) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/hard-skills`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/work-orders/{work_order_id}/hard-skills
const postWorkOrderHardSkill = async (org_id: string, work_order_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/hard-skills`, baseApiUrl);
    const response = await laiaFetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    return response;
};

// DELETE /orgs/{org_id}/work-orders/{work_order_id}/hard-skills/{skill_id}
const deleteWorkOrderHardSkill = async (org_id: string, work_order_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/hard-skills`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" , headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)});
    return response;
};

export { getWorkOrderHardSkills, postWorkOrderHardSkill, deleteWorkOrderHardSkill };