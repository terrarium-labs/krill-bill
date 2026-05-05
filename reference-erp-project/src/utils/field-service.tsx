import type { WorkOrderReasonNotCompleted } from "@/types/field-service/work-orders/work-orders";

/** All possible values for work order "reason not completed". */
export const ALL_REASONS_NOT_COMPLETED: WorkOrderReasonNotCompleted[] = [
    "coordinate_with_client",
    "incomplete_material",
    "wrong_material",
    "required_material",
    "special_resources_required",
    "pending_external_contractor",
    "pending_subcontract",
    "quotation_required",
    "repair_not_completed",
    "leak_inspection",
    "establishment_closed",
    "breakdown_follow_up_visit",
    "others",
];

/** Returns the translated display label for a reason_not_completed value. */
export function getReasonNotCompletedName(
    t: (key: string, fallback?: string) => string,
    reason: WorkOrderReasonNotCompleted
): string {
    switch (reason) {
        case "coordinate_with_client":
            return t("workOrders.finishWorkOrder.reason.coordinateWithClient", "Coordinate with client");
        case "incomplete_material":
            return t("workOrders.finishWorkOrder.reason.incompleteMaterial", "Incomplete material");
        case "wrong_material":
            return t("workOrders.finishWorkOrder.reason.wrongMaterial", "Wrong material");
        case "required_material":
            return t("workOrders.finishWorkOrder.reason.requiredMaterial", "Required material");
        case "special_resources_required":
            return t("workOrders.finishWorkOrder.reason.specialResourcesRequired", "Special resources required");
        case "pending_external_contractor":
            return t("workOrders.finishWorkOrder.reason.pendingExternalContractor", "Pending external contractor");
        case "pending_subcontract":
            return t("workOrders.finishWorkOrder.reason.pendingSubcontract", "Pending subcontract");
        case "quotation_required":
            return t("workOrders.finishWorkOrder.reason.quotationRequired", "Quotation required");
        case "repair_not_completed":
            return t("workOrders.finishWorkOrder.reason.repairNotCompleted", "Repair not completed");
        case "leak_inspection":
            return t("workOrders.finishWorkOrder.reason.leakInspection", "Leak inspection");
        case "establishment_closed":
            return t("workOrders.finishWorkOrder.reason.establishmentClosed", "Establishment closed");
        case "breakdown_follow_up_visit":
            return t("workOrders.finishWorkOrder.reason.breakdownFollowUpVisit", "Breakdown follow-up visit");
        case "others":
            return t("workOrders.finishWorkOrder.reason.others", "Others");
        default:
            return reason;
    }
}

/** Translation key and default text for the special checks info tooltip. */
export const SPECIAL_CHECKS_INFO_TOOLTIP_KEY = "workorders.specialChecks.infoTooltip";
export const SPECIAL_CHECKS_INFO_TOOLTIP_DEFAULT =
    "Special guidelines that are required for this specific Work Order. These may include safety instructions, equipment needs, access requirements, or other important details that technicians should follow.";

/** Returns the translated tooltip text for the special checks field. */
export function getSpecialChecksTooltipText(t: (key: string, fallback?: string) => string): string {
    return t(SPECIAL_CHECKS_INFO_TOOLTIP_KEY, SPECIAL_CHECKS_INFO_TOOLTIP_DEFAULT);
}
