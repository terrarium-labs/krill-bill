import { laiaFetch } from "@/api/0.core/basics";
import { WorkOrderBillableItemRequest } from "@/types/field-service/work-orders/billable-items";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/work-orders/{work_order_id}/billable-items -> Billable items for a work order
const getWorkOrderBillableItems = async (org_id: string, work_order_id: string, page_token?: string) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/billable-items`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url,
        {
            method: "GET"
        });
    return response;
}

// POST /orgs/{org_id}/work-orders/{work_order_id}/billable-items -> Create a billable item for a work order
const postWorkOrderBillableItem = async (org_id: string, work_order_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/billable-items`, baseApiUrl);
    const response = await laiaFetch(url,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });
    return response;
}

// PATCH /orgs/{org_id}/work-orders/{work_order_id}/billable-items -> Batch update billable items for a work order
const patchWorkOrderBillableItems = async (org_id: string, work_order_id: string, data: { billable_items: WorkOrderBillableItemRequest[] }) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/billable-items`, baseApiUrl);
    const response = await laiaFetch(url,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });
    return response;
};

// DELETE /orgs/{org_id}/work-orders/{work_order_id}/billable-items/{work_order_billable_item_id} -> Delete a billable item for a work order
const deleteWorkOrderBillableItem = async (org_id: string, work_order_id: string, work_order_billable_item_id: string) => {
    const url = new URL(`/orgs/${org_id}/work-orders/${work_order_id}/billable-items/${work_order_billable_item_id}`, baseApiUrl);
    const response = await laiaFetch(url,
        {
            method: "DELETE",
        });
    return response;
};


export { getWorkOrderBillableItems, postWorkOrderBillableItem, patchWorkOrderBillableItems, deleteWorkOrderBillableItem };
