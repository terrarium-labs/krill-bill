import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form } from "@/components/ui/form";
import { DateTimePicker } from "@/app/components/forms-elements/date-time-picker";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { getOrgOrderItems } from "@/api/orgs/orders/items/items";
import { postOrgOrderDelivery } from "@/api/orgs/orders/deliveries/deliveries";
import { OrderItem } from "@/types/orders/items/items";
import { toast } from "sonner";
import { ItemAvatar } from "@/app/components/avatars/item-avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import FilesSection from "@/app/components/files/files-section";
import SelectReceiveItemsModal from "./select-receive-items-modal";
import { Label } from "@/components/ui/label";

const formInputSchema = z.object({
    delivery_date: z.date(),
    delivery_items: z.array(z.object({
        item_id: z.string(),
        quantity: z.number(),
    })),
    notes: z.string().optional(),
    document_reference: z.string().optional(),
});

type FormValues = z.infer<typeof formInputSchema>;

interface DeliveryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orderId: string;
}

const DeliveryModal = ({ open, onOpenChange, orderId }: DeliveryModalProps) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [selectedItemsToReceive, setSelectedItemsToReceive] = useState<OrderItem[]>([]);
    const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [deliveryId, setDeliveryId] = useState<string | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formInputSchema),
        defaultValues: {
            // SET NOW AS DEFAULT
            delivery_date: new Date(),
            delivery_items: [],
        },
    });

    // Fetch order items
    const fetchOrderItems = useCallback(async (page_token: string | null = null) => {
        if (!orgId || !orderId) return;

        if (!page_token) {
            setIsLoading(true);
        }

        try {
            const response = await getOrgOrderItems(orgId, orderId, undefined, page_token || undefined);
            if (response.success && response.success.order_items) {
                if (page_token) {
                    // Loading more results - append to existing
                    setOrderItems((prev) => [...prev, ...response.success.order_items]);
                } else {
                    // Initial load - replace existing
                    setOrderItems(response.success.order_items);
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
        } finally {
            setIsLoading(false);
        }
    }, [orgId, orderId, t]);

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

    // Reset form and fetch items when modal opens
    useEffect(() => {
        if (open) {
            form.reset({
                delivery_date: new Date(),
                delivery_items: [],
            });
            setSelectedItemsToReceive([]);
            setReceivedQuantities({});
            setNextPageToken(null);
            setDeliveryId(undefined);
            setPendingFiles([]);
            fetchOrderItems();
        }
    }, [open, fetchOrderItems]);

    const handleSelectItems = (items: OrderItem[]) => {
        // Add items that aren't already in the list
        setSelectedItemsToReceive(prev => {
            const existingIds = new Set(prev.map(item => item.id));
            const newItems = items.filter(item => !existingIds.has(item.id));
            return [...prev, ...newItems];
        });

        // Initialize received quantities for new items
        const newQuantities: Record<string, number> = {};
        items.forEach((item) => {
            if (!receivedQuantities[item.id]) {
                newQuantities[item.id] = item.quantity; // Default to ordered quantity
            }
        });

        setReceivedQuantities((prev) => ({
            ...prev,
            ...newQuantities,
        }));
    };

    const handleQuantityChange = (itemId: string, value: string) => {
        const parsed = parseFloat(value);
        setReceivedQuantities((prev) => ({
            ...prev,
            [itemId]: isNaN(parsed) || parsed < 0 ? 0 : parsed,
        }));
    };

    const handleRemoveItem = (itemId: string) => {
        setSelectedItemsToReceive(prev => prev.filter(item => item.id !== itemId));
        setReceivedQuantities(prev => {
            const newQuantities = { ...prev };
            delete newQuantities[itemId];
            return newQuantities;
        });
    };

    const handleSubmit = async (data: FormValues) => {
        if (!orgId) return;

        // Build delivery items array from received quantities
        const deliveryItems = selectedItemsToReceive
            .filter(item => receivedQuantities[item.id] > 0)
            .map(item => ({
                item_id: item.id,
                quantity: receivedQuantities[item.id],
            }));

        if (deliveryItems.length === 0) {
            toast.error(t("orders.noItemsToReceive", "Please add items and enter quantities to receive"));
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await postOrgOrderDelivery(orgId, orderId, {
                delivery_date: data.delivery_date.toISOString(),
                delivery_items: deliveryItems,
                notes: data.notes || null,
                document_reference: data.document_reference || null,
            });

            if (response.success && response.success.order_delivery_id) {
                setDeliveryId(response.success.order_delivery_id);
                toast.success(t("orders.deliveryCreated", "Delivery created successfully"));

                // Close modal - pending files will upload automatically
                setTimeout(() => {
                    onOpenChange(false);
                }, 100);
            } else {
                toast.error(t("orders.errorCreatingDelivery", "Error creating delivery"));
            }
        } catch (error) {
            console.error("Error creating delivery:", error);
            toast.error(t("orders.errorCreatingDelivery", "Error creating delivery"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl md:min-w-5xl w-full max-h-[90vh] overflow-y-auto flex flex-col" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>{t("orders.receiveItems", "Receive Items")}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-2 flex-1 flex flex-col">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <DateTimePicker
                                form={form}
                                name="delivery_date"
                                showMonthYearPicker={true}
                                label={t("orders.deliveryDate", "Delivery Date")}
                                placeholder={t("orders.selectDeliveryDate", "Select delivery date")}
                            />
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t("orders.documentReference", "Document Reference")}</label>
                                <Input
                                    placeholder={t("orders.documentReferencePlaceholder", "Delivery note, invoice, etc.")}
                                    {...form.register("document_reference")}
                                    disabled={!!deliveryId}
                                />
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold">{t("orders.itemsToReceive", "Items to Receive")}</h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsSelectModalOpen(true)}
                                    disabled={isLoading || orderItems.length === 0}
                                    className="gap-1.5"
                                >
                                    <Plus className="h-4 w-4" />
                                    {t("orders.addItems", "Add Items")}
                                </Button>
                            </div>

                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="overflow-hidden flex-1 flex flex-col">
                                    <div className="overflow-auto flex-1">
                                        <Table>
                                            <TableHeader className="sticky top-0 bg-background z-10">
                                                <TableRow>
                                                    <TableHead className="w-16">{t("orders.item", "Item")}</TableHead>
                                                    <TableHead className="min-w-48">{t("orders.description", "Description")}</TableHead>
                                                    <TableHead className="w-24 text-right">{t("orders.quantity", "Quantity")}</TableHead>
                                                    <TableHead className="w-32">{t("orders.rcvQuantity", "Rcv. Quantity")}</TableHead>
                                                    <TableHead className="w-12"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedItemsToReceive.length > 0 ? (
                                                    selectedItemsToReceive.map((orderItem) => (
                                                        <TableRow key={orderItem.id} className="group">
                                                            {/* Item Avatar */}
                                                            <TableCell className="p-2">
                                                                <ItemAvatar item={orderItem.item} />
                                                            </TableCell>

                                                            {/* Description */}
                                                            <TableCell className="p-2">
                                                                <div className="flex flex-col gap-1">
                                                                    {orderItem.description && (
                                                                        <span className="text-sm text-muted-foreground line-clamp-2">
                                                                            {orderItem.description}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </TableCell>

                                                            {/* Ordered Quantity */}
                                                            <TableCell className="p-2 text-right">
                                                                <span className="text-sm font-medium">{orderItem.quantity}</span>
                                                            </TableCell>

                                                            {/* Received Quantity Input */}
                                                            <TableCell className="p-2">
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    step="any"
                                                                    value={receivedQuantities[orderItem.id] || 0}
                                                                    onChange={(e) => handleQuantityChange(orderItem.id, e.target.value)}
                                                                    className="h-9 text-sm"
                                                                    placeholder="0"
                                                                />
                                                            </TableCell>

                                                            {/* Remove Button */}
                                                            <TableCell className="p-2">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                                                    onClick={() => handleRemoveItem(orderItem.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-sm">
                                                            {t("orders.noItemsSelected", "No items selected. Click 'Add Items' to get started.")}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t("orders.notes", "Notes")}</label>
                            <Textarea
                                placeholder={t("orders.addNotesPlaceholder", "Add notes about this delivery...")}
                                className="resize-none"
                                rows={3}
                                {...form.register("notes")}
                                disabled={!!deliveryId}
                            />
                        </div>


                        <Separator />
                        <div className="flex flex-col gap-0">
                            <Label className="text-sm font-medium">{t("orders.files", "Files ")}</Label>
                            <FilesSection
                                entity_id={deliveryId}
                                showBreadcrumbs={false}
                                showSearch={false}
                                showUpload={false}
                                showCreateFolder={false}
                                onPendingFilesChange={setPendingFiles}
                            />
                        </div>


                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                {t("common.cancel", "Cancel")}
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        {t("common.creating", "Creating...")}
                                    </>
                                ) : (
                                    t("orders.receiveItems", "Receive Items")
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>

            {/* Select Items Modal */}
            <SelectReceiveItemsModal
                open={isSelectModalOpen}
                onOpenChange={setIsSelectModalOpen}
                orderItems={orderItems}
                onSelectItems={handleSelectItems}
                nextPageToken={nextPageToken}
                isLoadingMore={isLoadingMore}
                onLoadMore={loadMore}
            />
        </Dialog>
    );
};

export default DeliveryModal;