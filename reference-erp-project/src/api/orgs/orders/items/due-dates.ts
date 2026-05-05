import { laiaFetch } from "../../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

/*POST /orgs/{org_id}/orders/{order_id}/items/{order_item_id}/due-dates Create a due date for an order item*/
const postOrgOrderItemDueDate = async (org_id: string, order_id: string, order_item_id: string, data: any = {}) => {
    const url = new URL(`/orgs/${org_id}/orders/${order_id}/items/${order_item_id}/due-dates`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

/*DELETE /orgs/{org_id}/orders/{order_id}/items/{order_item_id}/due-dates/{due_date_id} Delete a due date for an order item*/
const deleteOrgOrderItemDueDate = async (org_id: string, order_id: string, order_item_id: string, due_date_id: string) => {
    const url = new URL(`/orgs/${org_id}/orders/${order_id}/items/${order_item_id}/due-dates/${due_date_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "DELETE"
    });
    return response;
};

export { postOrgOrderItemDueDate, deleteOrgOrderItemDueDate };
