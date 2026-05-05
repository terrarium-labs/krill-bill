import { EntityType } from "@/types/general/entities";

/**
 * Infer entity type from entityId prefix (e.g. wo_ → work_order, od_ → order, cl_ → client).
 * Returns undefined for unknown prefixes.
 */
export function getEntityTypeFromId(entityId: string): EntityType | undefined {
    const prefix = entityId.split("_")[0];
    if (prefix === "us") return "org_user";
    if (prefix === "wo") return "work_order";
    if (prefix === "od") return "order";
    if (prefix === "ot") return "order_type";
    if (prefix === "cl") return "client";
    if (prefix === "iv") return "invoice";
    if (prefix === "siv") return "sales_invoice";
    if (prefix === "piv") return "purchase_invoice";
    if (prefix === "ti") return "ticket";
    if (prefix === "it") return "item";
    if (prefix === "ih") return "item_hierarchy";
    if (prefix === "lo") return "location";
    if (prefix === "cv") return "inventory";
    if (prefix === "ra") return "rates";
    if (prefix === "cr") return "commuting_rate";
    if (prefix === "hr") return "hourly_rate";
    if (prefix === "ou") return "employee";
    if (prefix === "ea") return "absence";
    if (prefix === "tr") return "time_record";
    if (prefix === "sl") return "sick_leave";
    if (prefix === "py") return "payroll";
    if (prefix === "ecr") return "employee_contract";
    if (prefix === "cl") return "client";
    if (prefix === "su") return "supplier";
    if (prefix === "ch") return "checklist";
    if (prefix === "tp") return "time_policy";
    if (prefix === "ap") return "absence_policy";
    if (prefix === "wp") return "work_place";
    if (prefix === "wtt") return "work_order_ticket_type";
    if (prefix === "jt") return "job_title";
    if (prefix === "hs") return "hard_skill";
    if (prefix === "og") return "org_group";
    if (prefix === "al") return "audit_logs";
    if (prefix === "orl") return "org_role";
    if (prefix === "st") return "status_template";
    if (prefix === "ocg") return "on_call_shifts_group";
    if (prefix === "vh") return "vehicle";
    if (prefix === "nw") return "news";
    if (prefix === "fi") return "file";
    if (prefix === "sr") return "signing_request";
    if (prefix === "srs") return "signing_request_signer";
    return undefined;
}
