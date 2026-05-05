import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { Plus, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { OrderItem } from "@/types/orders/items/items";
import { getOrgOrderItems, postOrgOrderItem, patchOrgOrderItem, deleteOrgOrderItem } from "@/api/orgs/orders/items/items";
import { getOrgTaxes } from "@/api/orgs/taxes/taxes";
import { TaxType } from "@/types/miscelanea";
import { toast } from "sonner";
import { useOrder } from "../../contexts/OrderContext";
import { useParams } from "react-router-dom";
import AddItemModal from "./add-item-modal";
import { Item } from "@/types/items/items";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency } from "@/utils/miscelanea";
import { Separator } from "@/components/ui/separator";
import { OrderItemRow, EditableOrderItem } from "./order-item-row";

interface ItemWithPrice extends Omit<Item, 'buy_price'> {
    buy_price?: {
        id: string;
        price_quantity: number;
        price_currency: string;
        margin: number;
        billing_type: "one-off" | "recurring";
        billing_period?: "daily" | "weekly" | "monthly" | "yearly" | null;
        price_model: "flat-rate" | "graduated";
        tax_included: boolean;
        pricing_mode?: "margin_fixed" | "price_fixed";
        taxes?: string[];
    } | null;
}

// Generate a unique ID for new items
const generateId = () => `new_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export interface OrderItemsSectionRef {
    saveOrderItems: () => Promise<void>;
}

interface OrderItemsSectionProps {
    isReadOnly?: boolean;
}

const OrderItemsSection = forwardRef<OrderItemsSectionRef, OrderItemsSectionProps>(({ isReadOnly = false }, ref) => {
    const { t } = useTranslation();
    const { order } = useOrder();
    const { orgId } = useParams<{ orgId: string }>();
    const [orderItems, setOrderItems] = useState<EditableOrderItem[]>([]);
    const [taxes, setTaxes] = useState<TaxType[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Fetch order items
    const fetchOrderItems = useCallback(async (page_token: string | null = null) => {
        if (!orgId || !order.id) return;

        try {
            const response = await getOrgOrderItems(orgId, order.id, undefined, page_token || undefined);
            if (response.success && response.success.order_items) {
                const newItems = response.success.order_items.map((item: OrderItem) => ({
                    ...item,
                    isNew: false,
                    isDeleted: false,
                }));

                if (page_token) {
                    // Loading more results - append to existing
                    setOrderItems((prev) => [...prev, ...newItems]);
                } else {
                    // Initial load - replace existing
                    setOrderItems(newItems);
                }

                // Handle next page token
                if (response.success.next_page_token) {
                    setNextPageToken(response.success.next_page_token);
                } else {
                    setNextPageToken(null);
                }
            }
        } catch (error) {
            console.error("Error fetching order items:", error);
            toast.error(t("orders.errorFetchingItems", "Error fetching order items"));
        }
    }, [orgId, order.id, t]);

    // Fetch taxes
    const fetchTaxes = useCallback(async () => {
        if (!orgId) return;

        try {
            const response = await getOrgTaxes(orgId, true);
            if (response.success && response.success.taxes) {
                setTaxes(response.success.taxes);
            }
        } catch (error) {
            console.error("Error fetching taxes:", error);
        }
    }, [orgId]);

    // Load more items
    const loadMore = useCallback(async () => {
        if (!nextPageToken || isLoadingMore) return;

        setIsLoadingMore(true);
        try {
            await fetchOrderItems(nextPageToken);
        } finally {
            setIsLoadingMore(false);
        }
    }, [nextPageToken, isLoadingMore, fetchOrderItems]);

    // Initial load
    useEffect(() => {
        fetchOrderItems();
        fetchTaxes();
    }, [fetchOrderItems, fetchTaxes]);

    const handleUpdateOrderItem = useCallback((id: string, field: keyof EditableOrderItem, value: any) => {
        setOrderItems((prev) => prev.map((item) => item.id === id ? { ...item, [field]: value } : item));
    }, []);

    const handleDeleteOrderItem = useCallback(async (id: string) => {
        const item = orderItems.find(item => item.id === id);

        if (item?.isNew) {
            // Just remove from state if it's a new item
            setOrderItems((prev) => prev.filter((item) => item.id !== id));
        } else {
            // Mark as deleted and delete from server
            setOrderItems((prev) => prev.map((item) => item.id === id ? { ...item, isDeleted: true } : item));

            if (orgId && order.id) {
                try {
                    await deleteOrgOrderItem(orgId, order.id, id);
                    // Remove from state after successful deletion
                    setOrderItems((prev) => prev.filter((item) => item.id !== id));
                    toast.success(t("orders.itemDeleted", "Item deleted successfully"));
                } catch (error) {
                    console.error("Error deleting order item:", error);
                    toast.error(t("orders.errorDeletingItem", "Error deleting item"));
                    // Revert the deletion
                    setOrderItems((prev) => prev.map((item) => item.id === id ? { ...item, isDeleted: false } : item));
                }
            }
        }
    }, [orderItems, orgId, order.id, t]);

    const handleAddItems = async (items: ItemWithPrice[]) => {
        if (!orgId || !order.id) return;

        for (const item of items) {
            const buyPrice = (item as any).buy_price;
            const price = buyPrice?.price_quantity || 0;
            const itemTaxes = buyPrice?.taxes && buyPrice.taxes.length > 0
                ? taxes.filter(tax => buyPrice.taxes?.includes(tax.id))
                : [];

            const newOrderItem: EditableOrderItem = {
                id: generateId(),
                item: item as Item,
                name: item.name,
                description: item.description || "",
                quantity: 1,
                received_quantity: 0,
                price: price,
                taxes: itemTaxes,
                due_dates: [],
                isNew: true,
                isDeleted: false,
            };

            // Add to state immediately
            setOrderItems((prev) => [...prev, newOrderItem]);

            // Save to server
            try {
                const response = await postOrgOrderItem(orgId, order.id, {
                    item_id: item.id,
                    name: newOrderItem.name,
                    description: newOrderItem.description,
                    quantity: newOrderItem.quantity,
                    price: newOrderItem.price,
                    taxes_ids: itemTaxes.map(tax => tax.id),
                });

                if (response.success && response.success.item) {
                    // Update with server-generated ID
                    setOrderItems((prev) => prev.map((orderItem) =>
                        orderItem.id === newOrderItem.id
                            ? { ...response.success.item, isNew: false, isDeleted: false }
                            : orderItem
                    ));
                }
            } catch (error) {
                console.error("Error adding order item:", error);
                toast.error(t("orders.errorAddingItem", "Error adding item"));
                // Remove from state if failed
                setOrderItems((prev) => prev.filter((orderItem) => orderItem.id !== newOrderItem.id));
            }
        }

        toast.success(t("orders.itemsAdded", `${items.length} item(s) added successfully`));
    };

    // Expose save function to parent via ref
    const saveOrderItems = useCallback(async () => {
        if (!orgId || !order.id) return;

        const itemsToSave = orderItems.filter(item => !item.isNew && !item.isDeleted);

        for (const item of itemsToSave) {
            try {
                await patchOrgOrderItem(orgId, order.id, item.id, {
                    name: item.name,
                    description: item.description,
                    quantity: item.quantity,
                    price: item.price,
                    taxes_ids: item.taxes?.map(tax => tax.id) || [],
                });
            } catch (error) {
                console.error("Error saving order item:", error);
                throw error;
            }
        }
    }, [orderItems, orgId, order.id, t]);

    useImperativeHandle(ref, () => ({
        saveOrderItems
    }));

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{t("orders.items", "Order Items")}</h3>
                    {!isReadOnly && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1.5"
                                            onClick={() => setIsAddModalOpen(true)}
                                            disabled={!order.supplier?.id}
                                        >
                                            <Plus className="h-4 w-4" />
                                            {t("orders.addItem", "Add Item")}
                                        </Button>
                                    </span>
                                </TooltipTrigger>
                                {!order.supplier?.id && (
                                    <TooltipContent>
                                        <p>{t("orders.selectSupplierToAddItems", "Select a supplier to add items")}</p>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>

                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-8">{t("common.id", "ID")}</TableHead>
                            <TableHead className="w-16">{t("orders.item", "Item")}</TableHead>
                            <TableHead className="min-w-32">{t("orders.description", "Description")}</TableHead>
                            <TableHead className="w-20">{t("orders.quantity", "Quantity")}</TableHead>
                            <TableHead className="w-24">{t("orders.subtotal", "Subtotal")}</TableHead>
                            <TableHead className="min-w-48">{t("orders.taxes", "Taxes")}</TableHead>
                            <TableHead className="w-24">{t("orders.total", "Total")}</TableHead>
                            <TableHead className="w-8"></TableHead>
                            <TableHead className="w-8"></TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {orderItems.length > 0 ? (
                            orderItems.filter(item => !item.isDeleted).map((orderItem) => (
                                <OrderItemRow
                                    key={orderItem.id}
                                    orderItem={orderItem}
                                    onUpdate={handleUpdateOrderItem}
                                    onDelete={handleDeleteOrderItem}
                                    onRefresh={fetchOrderItems}
                                    taxes={taxes}
                                    orgId={orgId || ""}
                                    orderId={order.id}
                                    isReadOnly={isReadOnly}
                                />
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground text-sm">
                                    {t("orders.noItems", "No items yet. Click 'Add Item' to get started.")}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {/* Load More Button */}
                {nextPageToken && (
                    <div className="flex justify-center py-4">
                        <Button
                            variant="outline"
                            onClick={loadMore}
                            disabled={isLoadingMore}
                            className="gap-2"
                        >
                            {isLoadingMore ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {t("common.loading", "Loading...")}
                                </>
                            ) : (
                                t("common.loadMore", "Load More")
                            )}
                        </Button>
                    </div>
                )}

                <Separator className="-mt-4" />

                {/* Order Summary */}
                {orderItems.length > 0 && (
                    <div className="flex justify-end mt-4">
                        <div className="w-80 space-y-2">
                            {/* Subtotal */}
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-sm text-muted-foreground">
                                    {t("orders.subtotal", "Subtotal")}
                                </span>
                                <span className="text-sm font-medium">
                                    {formatCurrency(order.subtotal)}
                                </span>
                            </div>

                            {/* Taxes */}
                            {order.taxes && order.taxes.length > 0 &&
                                order.taxes.map((tax) => (
                                    <div key={tax.tax}>
                                        <div className="flex justify-between items-center py-2 border-b">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm text-muted-foreground">
                                                    {tax.tax}:
                                                </span>
                                            </div>
                                            <span className="text-sm font-medium">
                                                {formatCurrency(tax.amount)}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                            {/* Total */}
                            <div className="flex justify-between items-center py-2">
                                <span className="text-base font-semibold">
                                    {t("orders.total", "Total")}
                                </span>
                                <span className="text-base font-bold">
                                    {formatCurrency(order.total_price)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <AddItemModal
                open={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                orgId={orgId || ""}
                supplierId={order.supplier?.id || null}
                onAddItems={handleAddItems}
            />
        </>
    );
});

OrderItemsSection.displayName = "OrderItemsSection";

export default OrderItemsSection;