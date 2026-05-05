import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import LocationLabel from "@/app/components/labels/location-label";
import WorkOrderCard from "@/app/components/cards/work-order-card";
import type { WorkOrder } from "@/types/field-service/work-orders/work-orders";

export type WorkOrderLocationDrawerVariant = "client" | "client-location" | "location";

export interface WorkOrderLocationDrawerProps {
    open: boolean;
    workOrders: WorkOrder[];
    onOpenChange: (open: boolean) => void;
    /** Optional custom title. When not provided, defaults to "Work orders at" + location label. */
    title?: ReactNode;
    /** Card variant passed to WorkOrderCard. Defaults to "client". */
    variant?: WorkOrderLocationDrawerVariant;
}

export default function WorkOrderLocationDrawer({
    open,
    workOrders,
    onOpenChange,
    title,
    variant = "client",
}: WorkOrderLocationDrawerProps) {
    const { t } = useTranslation();

    const displayTitle =
        title ?? (
            <div className="flex items-center gap-2">
                {t("workorders.workOrdersAtLocation", "Work orders at ")}{" "}
                <LocationLabel data={workOrders[0]?.location} />
            </div>
        );

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="flex flex-col w-full max-w-md sm:max-w-lg overflow-hidden overflow-y-auto rounded-l-xl"
            >
                <SheetHeader>
                    <SheetTitle>{displayTitle}</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto flex flex-col gap-3 py-4 -mx-6 px-8">
                    {workOrders.map((wo) => (
                        <WorkOrderCard key={wo.id} workOrder={wo} variant={variant} />
                    ))}
                </div>
            </SheetContent>
        </Sheet>
    );
}
