import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Package, Truck } from "lucide-react";
import { Delivery } from "@/types/orders/deliveries/deliveries";
import { OrderItem } from "@/types/orders/items/items";
import { getOrgOrderDeliveries, deleteOrgOrderDelivery } from "@/api/orgs/orders/deliveries/deliveries";
import { toast } from "sonner";
import DeliveryModal from "./delivery-modal";
import DeliveryViewModal from "./delivery-view-modal";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/utils/miscelanea";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import IdBadge from "@/app/components/id-badge";

interface DeliveriesSectionProps {
    orderId: string;
    orderItems: OrderItem[];
}

const DeliveriesSection: React.FC<DeliveriesSectionProps> = ({ orderId }) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deliveryToDelete, setDeliveryToDelete] = useState<Delivery | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewDelivery, setViewDelivery] = useState<Delivery | null>(null);

    const fetchDeliveries = useCallback(async (pageToken: string | null = null, append = false) => {
        if (!orgId || !orderId) return;

        if (!pageToken) {
            setIsLoading(true);
        }else {
            setIsLoadingMore(true);
        }

        try {
            const response = await getOrgOrderDeliveries(orgId, orderId, undefined, pageToken || undefined);
            if (response.success && response.success.order_deliveries) {
                setDeliveries(prevDeliveries =>
                    append ? [...prevDeliveries, ...response.success.order_deliveries] : response.success.order_deliveries
                );
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("orders.errorFetchingDeliveries", "Error fetching deliveries"));
            }
        } catch (error) {
            console.error("Error fetching deliveries:", error);
            toast.error(t("orders.errorFetchingDeliveries", "Error fetching deliveries"));
        } finally {
            setIsLoading(false);
        }
    }, [orgId, orderId, t]);

    useEffect(() => {
        fetchDeliveries();
    }, [fetchDeliveries]);

    const handleCreateDelivery = () => {
        setIsModalOpen(true);
    };

    const handleViewDelivery = (delivery: Delivery) => {
        setViewDelivery(delivery);
        setIsViewModalOpen(true);
    };

    const handleDeleteClick = (delivery: Delivery) => {
        setDeliveryToDelete(delivery);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!orgId || !orderId || !deliveryToDelete) return;

        setIsDeleting(true);
        try {
            const response = await deleteOrgOrderDelivery(orgId, orderId, deliveryToDelete.id);
            if (response.success) {
                toast.success(t("orders.deliveryDeleted", "Delivery deleted successfully"));
                fetchDeliveries(null, false);
                setIsDeleteDialogOpen(false);
                setDeliveryToDelete(null);
            } else {
                toast.error(t("orders.deliveryDeleteFailed", "Failed to delete delivery"));
            }
        } catch (error) {
            console.error("Error deleting delivery:", error);
            toast.error(t("orders.deliveryDeleteError", "Error deleting delivery"));
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <>
            <Card className="shadow-none flex flex-col h-full">
                <CardHeader className="shrink-0">
                    <CardTitle className="flex items-center gap-2 justify-between">
                        {t("orders.deliveries", "Deliveries")}
                        <Button onClick={handleCreateDelivery} size="sm" variant="outline">
                            <Plus className="h-4 w-4" />
                            {t("orders.add", "Add")}
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="py-0 px-4 pt-0 flex-1 overflow-y-auto min-h-0">
                    {deliveries.length === 0 ? (
                        <div className="text-center py-4">
                            <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <h3 className="text-md font-medium text-muted-foreground">
                                {t("orders.noDeliveries", "No deliveries yet")}
                            </h3>
                            <p className="text-muted-foreground mb-4 text-xs">
                                {t("orders.noDeliveriesDescription", "Add your first delivery to get started")}
                            </p>
                        </div>
                    ) : (
                        <div>
                            {deliveries.map((delivery, index) => {
                                return (
                                    <div key={delivery.id}>
                                        <div className="hover:bg-accent/50 transition-colors p-2 rounded-lg">
                                            <div className="flex items-center justify-between gap-2">
                                                <div
                                                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                                                    onClick={() => handleViewDelivery(delivery)}
                                                >
                                                    <Truck className="h-5 w-5 text-muted-foreground shrink-0" />
                                                    <div className="flex flex-col items-start gap-0 min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 w-full">
                                                            <h4 className="font-medium text-sm">
                                                                {formatDate(new Date(delivery.delivery_date), {
                                                                    showTime: false,
                                                                    showYear: true,
                                                                    useUTC: false,
                                                                })}
                                                            </h4>

                                                        </div>
                                                        {delivery.notes && (
                                                            <span className="text-xs text-muted-foreground truncate w-full line-clamp-1">
                                                                {delivery.notes}
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-muted-foreground">
                                                            {delivery.num_order_items} {delivery.num_order_items === 1 ? t('orders.item', 'item') : t('orders.items', 'items')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <IdBadge id={delivery.id} hideIcon={true} />
                                                    <CustomActionsDropdown
                                                        items={[
                                                            {
                                                                label: t("common.view", "View"),
                                                                icon: "eye",
                                                                onClick: () => handleViewDelivery(delivery),
                                                            },
                                                            {
                                                                label: t("common.delete", "Delete"),
                                                                icon: "trash-2",
                                                                onClick: () => handleDeleteClick(delivery),
                                                                variant: "destructive",
                                                            },
                                                        ]}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        {index < deliveries.length - 1 && <Separator />}
                                    </div>
                                );
                            })}

                            {/* Load More Button */}
                            {nextPageToken && (
                                <div className="text-center pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => fetchDeliveries(nextPageToken, true)}
                                        disabled={isLoadingMore}
                                    >
                                        {isLoadingMore ? t('common.loading', 'Loading...') : t('common.loadMore', 'Load More')}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delivery Modal */}
            <DeliveryModal
                open={isModalOpen}
                onOpenChange={(open) => {
                    setIsModalOpen(open);
                    if (!open) {
                        // Refresh deliveries when modal closes
                        fetchDeliveries(null, false);
                    }
                }}
                orderId={orderId}
            />

            {/* Delivery View Modal */}
            <DeliveryViewModal
                delivery={viewDelivery}
                open={isViewModalOpen}
                onOpenChange={(open) => {
                    setIsViewModalOpen(open);
                    if (!open) {
                        // Refresh deliveries when modal closes
                        fetchDeliveries(null, false);
                    }
                }}
                onDeleteDelivery={handleDeleteClick}
                orderId={orderId}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle>{t("orders.deleteDelivery", "Delete Delivery")}</DialogTitle>
                        <DialogDescription>
                            {t(
                                "orders.deleteDeliveryConfirmation",
                                "Are you sure you want to delete this delivery? This action cannot be undone."
                            )}
                            {deliveryToDelete && (
                                <div className="mt-2 p-2 bg-muted rounded">
                                    <strong>
                                        {formatDate(new Date(deliveryToDelete.delivery_date), {
                                            showTime: false,
                                            showYear: true,
                                            useUTC: false,
                                        })}
                                    </strong>
                                    {deliveryToDelete.notes && ` - ${deliveryToDelete.notes}`}
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            disabled={isDeleting}
                        >
                            {t("common.cancel", "Cancel")}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {t("common.deleting", "Deleting...")}
                                </>
                            ) : (
                                t("common.delete", "Delete")
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default DeliveriesSection;
