import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/shadcn-io/tabs";
import ClientLabel from "@/app/components/labels/client-label";
import LocationLabel from "@/app/components/labels/location-label";
import { HistoryClientSection } from "./history-client-section";
import { HistoryClientLocationSection } from "./history-client-location-section";
import type { WorkOrder } from "@/types/field-service/work-orders/work-orders";

export interface HistoryClientLocationDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workOrder: WorkOrder | null;
    workOrderId: string | undefined;
}

export default function HistoryClientLocationDrawer({
    open,
    onOpenChange,
    workOrder,
    workOrderId,
}: HistoryClientLocationDrawerProps) {
    const { t } = useTranslation();

    const hasClient = !!workOrder?.client;
    const hasLocation = !!workOrder?.location;
    const showTabs = hasClient && hasLocation;

    const title = showTabs
        ? t("workOrders.clientAndLocationHistory", "Client & Location History")
        : hasClient
          ? t("workOrders.clientHistory", "Client History")
          : t("workOrders.locationHistory", "Location History");

    if (!hasClient && !hasLocation) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="flex flex-col w-full sm:max-w-xl overflow-hidden overflow-y-auto rounded-l-xl"
            >
                <SheetHeader>
                    <SheetTitle>{title}</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col flex-1 min-h-0 mt-4 px-2">
                    {showTabs ? (
                        <Tabs defaultValue="location" className="flex flex-col flex-1 min-h-0">
                            <TabsList
                                className="w-full justify-start border-b-2 border-border bg-background"
                                activeClassName="border-b-2 border-primary -mb-1.5"
                            >
                                <TabsTrigger type="button" className="py-0" value="client">
                                    {t("workorders.tabs.client", "Client")}
                                </TabsTrigger>
                                <TabsTrigger type="button" className="py-0" value="location">
                                    {t("workorders.tabs.location", "Location")}
                                </TabsTrigger>
                            </TabsList>
                            <TabsContents
                                transition={{ duration: 0 }}
                                className="mt-2 flex-1 min-h-0 overflow-y-auto"
                            >
                                <TabsContent
                                    value="client"
                                    transition={{ duration: 0 }}
                                    className="mt-0 h-full"
                                >
                                    {workOrder?.client && (
                                        <HistoryClientSection
                                            key={`client-${workOrder.client.id}`}
                                            clientId={String(workOrder.client.id)}
                                            currentWorkOrderId={workOrderId}
                                        />
                                    )}
                                </TabsContent>
                                <TabsContent
                                    value="location"
                                    transition={{ duration: 0 }}
                                    className="mt-0 h-full"
                                >
                                    {workOrder?.client && workOrder?.location && (
                                        <HistoryClientLocationSection
                                            key={`location-${workOrder.client.id}-${workOrder.location.id}`}
                                            clientId={String(workOrder.client.id)}
                                            locationId={String(workOrder.location.id)}
                                            currentWorkOrderId={workOrderId}
                                        />
                                    )}
                                </TabsContent>
                            </TabsContents>
                        </Tabs>
                    ) : (
                        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
                            {workOrder?.client && (
                                <ClientLabel
                                    data={workOrder.client}
                                    className="text-lg font-semibold my-4"
                                />
                            )}
                            {workOrder?.location && (
                                <LocationLabel
                                    data={workOrder.location}
                                    textClassName="text-lg font-semibold my-4"
                                />
                            )}
                            {workOrder?.client && (
                                <HistoryClientSection
                                    key={`client-${workOrder.client.id}`}
                                    clientId={String(workOrder.client.id)}
                                    currentWorkOrderId={workOrderId}
                                />
                            )}
                            {workOrder?.location && (
                                <HistoryClientLocationSection
                                    key={`location-${workOrder.location.id}`}
                                    clientId={String(workOrder.client?.id ?? "")}
                                    locationId={String(workOrder.location.id)}
                                    currentWorkOrderId={workOrderId}
                                />
                            )}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
