import React from "react";
import { useTranslation } from "react-i18next";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ItemWorkOrder, getItemDisplayData, getItemDescription } from "@/types/field-service/work-orders/items";
import IdBadge from "@/app/components/id-badge";
import ItemLabel from "@/app/components/labels/item-label";
import TextLargeLabel from "@/app/components/labels/text-large-label";

interface WorkOrderItemViewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workOrderItem: ItemWorkOrder | null;
}

const orDash = (value: string | number | null | undefined): string | number => {
    if (value === null || value === undefined || value === "") return "-";
    return value;
};

const WorkOrderItemViewModal: React.FC<WorkOrderItemViewModalProps> = ({
    open,
    onOpenChange,
    workOrderItem,
}) => {
    const { t } = useTranslation();

    if (!workOrderItem) return null;

    const displayData = getItemDisplayData(workOrderItem);
    const description = getItemDescription(workOrderItem);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold">
                        <span>{t("workOrders.viewMaterial", "View Material")}</span>
                        <IdBadge id={workOrderItem.id} />
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Item & Quantity (shared row - 1 md column each) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1 min-w-0">
                            <h4 className="text-xs font-medium text-muted-foreground">
                                {t("items.item", "Item")}
                            </h4>
                            {displayData ? <ItemLabel data={displayData as any} /> : <span className="text-sm text-muted-foreground">-</span>}
                        </div>
                        <div className="space-y-1 min-w-0">
                            <h4 className="text-xs font-medium text-muted-foreground">
                                {t("workOrders.quantity", "Quantity")}
                            </h4>
                            <div className="text-sm">{orDash(workOrderItem.quantity)}</div>
                        </div>
                    </div>

                    {/* Item Code (only when WorkOrderItemDetail exists) */}
                    <div className="space-y-1">
                        <h4 className="text-xs font-medium text-muted-foreground">
                            {t("items.itemCode", "Item Code")}
                        </h4>
                        <div className="text-sm">
                            {workOrderItem.item?.item_code ? (
                                <IdBadge id={workOrderItem.item.item_code} hideIcon customTooltip={t("items.itemCode", "Copy code")} />
                            ) : (
                                <span className="text-muted-foreground">-</span>
                            )}
                        </div>
                    </div>

                    {/* Description (from item or ItemWorkOrder) */}
                    <div className="space-y-1">
                        <h4 className="text-xs font-medium text-muted-foreground">
                            {t("items.description", "Description")}
                        </h4>
                        <div className="text-sm">
                            {description ? (
                                <TextLargeLabel data={description} maxWidth="max-w-full" />
                            ) : (
                                <span className="text-muted-foreground">-</span>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-1">
                        <h4 className="text-xs font-medium text-muted-foreground">
                            {t("workOrders.notes", "Notes")}
                        </h4>
                        <div className="text-sm">
                            {workOrderItem.notes ? (
                                <TextLargeLabel data={workOrderItem.notes} maxWidth="max-w-full" />
                            ) : (
                                <span className="text-muted-foreground">-</span>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default WorkOrderItemViewModal;
