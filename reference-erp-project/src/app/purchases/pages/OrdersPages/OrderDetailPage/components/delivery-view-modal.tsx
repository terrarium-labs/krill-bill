import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Package } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import CustomActionsDropdown from '@/app/components/custom-actions-dropdown';
import { Separator } from '@/components/ui/separator';
import { ItemAvatar } from '@/app/components/avatars/item-avatar';
import IdBadge from '@/app/components/id-badge';
import {
    TableProvider,
    TableHeader,
    TableHeaderGroup,
    TableHead,
    TableBody,
    TableCell,
    type ColumnDef,
} from '@/components/ui/shadcn-io/table';
import { TableRow as TableRowRaw, TableCell as TableCellRaw } from '@/components/ui/table';
import { getOrgOrderDeliveryItems } from '@/api/orgs/orders/deliveries/items/items';
import { DeliveryOrderItem } from '@/types/orders/deliveries/items/items';
import { Delivery } from '@/types/orders/deliveries/deliveries';
import { formatDate } from '@/utils/miscelanea';
import { EmployeeAvatar } from '@/app/components/avatars/employee-avatar';
import FilesSection from '@/app/components/files/files-section';
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/shadcn-io/tabs";
import { Button } from '@/components/ui/button';
import ThreadSection from '@/app/components/thread-section';

interface DeliveryViewModalProps {
    delivery: Delivery | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDeleteDelivery: (delivery: Delivery) => void;
    orderId: string;
}

const DeliveryViewModal: React.FC<DeliveryViewModalProps> = ({
    delivery,
    open,
    onOpenChange,
    onDeleteDelivery,
    orderId,
}) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [items, setItems] = useState<DeliveryOrderItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    const columns: ColumnDef<DeliveryOrderItem>[] = useMemo(
        () => [
            {
                accessorKey: "id",
                header: t("common.id", "ID"),
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <IdBadge id={item.order_item.item.id} hideIcon={true} customTooltip={t("common.copyId", "Copy ID")} />
                    );
                },
            },
            {
                accessorKey: "item",
                header: t("orders.item", "Item"),
                cell: ({ row }) => {
                    const item = row.original;
                    return item.order_item.item ? <ItemAvatar item={item.order_item.item} /> : <span className="text-muted-foreground">-</span>;
                },
            },
            {
                accessorKey: "item_code",
                header: t("items.itemCode", "Item Code"),
                cell: ({ row }) => {
                    const item = row.original;
                    return item.order_item.item.item_code ? <IdBadge id={item.order_item.item.item_code} hideIcon={true} customTooltip={t("common.copyId", "Copy ID")} /> : <span className="text-muted-foreground">-</span>;
                },
            },
            {
                accessorKey: "quantity",
                header: t("orders.quantityDelivered", "Delivered"),
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{item.quantity}</span>
                        </div>
                    );
                },
            },
            {
                accessorKey: "description",
                header: t("orders.description", "Description"),
                cell: ({ row }) => {
                    const description = row.original.order_item.description as string;
                    return description ? (
                        <div className="max-w-md truncate" title={description}>
                            {description}
                        </div>
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    );
                },
            },
        ],
        [t]
    );

    const fetchItems = useCallback(async () => {
        if (!orgId || !orderId || !delivery?.id) return;

        setIsLoading(true);
        try {
            const response = await getOrgOrderDeliveryItems(orgId, orderId, delivery.id);

            if (response.success) {
                const fetchedItems = response.success.order_delivery_items || [];
                setItems(fetchedItems);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(
                    t("orders.errorFetchingDeliveryItems", "Error fetching delivery items")
                );
            }
        } catch (error) {
            console.error("Error fetching delivery items:", error);
            toast.error(
                t("orders.errorFetchingDeliveryItems", "Error fetching delivery items")
            );
        } finally {
            setIsLoading(false);
        }
    }, [orgId, orderId, delivery?.id, t]);

    const loadMoreItems = useCallback(async () => {
        if (!orgId || !orderId || !delivery?.id || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getOrgOrderDeliveryItems(orgId, orderId, delivery.id, undefined, nextPageToken);

            if (response.success) {
                const fetchedItems = response.success.order_delivery_items || [];
                setItems(prev => [...prev, ...fetchedItems]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(
                    t("orders.errorFetchingDeliveryItems", "Error fetching delivery items")
                );
            }
        } catch (error) {
            console.error("Error fetching delivery items:", error);
            toast.error(
                t("orders.errorFetchingDeliveryItems", "Error fetching delivery items")
            );
        } finally {
            setLoadingMore(false);
        }
    }, [orgId, orderId, delivery?.id, nextPageToken, loadingMore, isLoading, t]);

    useEffect(() => {
        if (open && delivery?.id) {
            fetchItems();
        } else {
            // Reset state when modal closes
            setItems([]);
            setNextPageToken(null);
        }
    }, [open, delivery?.id, fetchItems]);

    // Early return after all hooks
    if (!delivery) return null;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="min-h-[70vh] max-h-[70vh] w-full md:max-w-5xl flex flex-col" showCloseButton={false}>
                    <DialogHeader>
                        <div className="flex items-start gap-2">
                            <DialogTitle className="flex flex-col items-start gap-1">
                                {t('orders.deliveryDetails', 'Delivery Details')}
                            </DialogTitle>
                            <div className="flex items-center gap-2 ml-auto">
                                <IdBadge id={delivery.id} />
                            </div>
                            <CustomActionsDropdown
                                items={[
                                    {
                                        label: t('common.delete', 'Delete'),
                                        icon: "trash-2",
                                        onClick: () => {
                                            onDeleteDelivery(delivery);
                                            onOpenChange(false);
                                        },
                                        variant: "destructive",
                                    },
                                ]}
                            />
                        </div>
                    </DialogHeader>

                    <div className="space-y-4 overflow-y-auto max-h-[70vh] px-2 scrollbar-hide">
                        {/* Delivery Information */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <h4 className="font-medium text-sm">{t('orders.deliveryDate', 'Delivery Date')}</h4>
                                <p className="text-sm text-muted-foreground">
                                    {formatDate(new Date(delivery.delivery_date), {
                                        showTime: false,
                                        showYear: true,
                                        useUTC: false,
                                    })}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <h4 className="font-medium text-sm">{t('orders.totalItems', 'Total Items')}</h4>
                                <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    <span className="text-sm">
                                        {delivery.num_order_items} {delivery.num_order_items === 1 ? t('orders.item', 'item') : t('orders.items', 'items')}
                                    </span>
                                </div>
                            </div>

                            {delivery.created_by && (
                                <div className="space-y-1">
                                    <h4 className="font-medium text-sm">{t('orders.createdBy', 'Created By')}</h4>
                                    <EmployeeAvatar employee={delivery.created_by} showJobTitle />
                                </div>
                            )}


                            {/* Document Reference */}

                            <div className="space-y-2">
                                <h4 className="font-medium text-sm">{t('orders.documentReference', 'Document Reference')}</h4>
                                <p className="text-sm text-muted-foreground">
                                    {delivery.document_reference ? delivery.document_reference : <span className="text-muted-foreground">-</span>}
                                </p>
                            </div>
                        </div>

                        {/* Description/Notes */}
                        {delivery.notes && (
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm">{t('orders.notes', 'Notes')}</h4>
                                <p className="text-sm text-muted-foreground">
                                    {delivery.notes}
                                </p>
                            </div>
                        )}

                        <Separator className="my-4" />

                        <Tabs defaultValue="items">
                            <TabsList className="w-full justify-start border-b-2 border-border bg-background" activeClassName='border-b-2 border-primary -mb-1.5'>
                                <TabsTrigger className="py-0" value="items">{t("orders.deliveryItems", "Delivered Items")}</TabsTrigger>
                                <TabsTrigger className="py-0" value="files">{t("orders.files", "Files")}</TabsTrigger>
                                <TabsTrigger className="py-0" value="messages">{t("orders.messages", "Messages")}</TabsTrigger>
                            </TabsList>
                            <TabsContents transition={{ duration: 0 }} className="mt-2">
                                <TabsContent value="items" transition={{ duration: 0 }}>
                                    <div className="space-y-4">
                                        <h4 className="font-medium text-sm">{t('orders.deliveryItems', 'Delivered Items')}</h4>

                                        {/* Items Table */}
                                        <TableProvider data={items} columns={columns}>
                                            <TableHeader>
                                                {({ headerGroup }) => (
                                                    <TableHeaderGroup key={headerGroup.id} headerGroup={headerGroup}>
                                                        {({ header }) => <TableHead key={header.id} header={header} />}
                                                    </TableHeaderGroup>
                                                )}
                                            </TableHeader>
                                            <TableBody
                                                isLoading={isLoading}
                                                loadingState={
                                                    <TableRowRaw className="hover:bg-transparent">
                                                        <TableCellRaw className="h-48 text-center hover:bg-transparent" colSpan={columns.length}>
                                                            <div className="flex items-center justify-center space-y-2 flex-col">
                                                                <Loader2 className="h-8 w-8 animate-spin" />
                                                            </div>
                                                        </TableCellRaw>
                                                    </TableRowRaw>
                                                }
                                                emptyState={
                                                    <TableRowRaw className="hover:bg-transparent">
                                                        <TableCellRaw className="h-48 text-center hover:bg-transparent" colSpan={columns.length}>
                                                            <div className="flex items-center justify-center space-y-4 flex-col">
                                                                <Package className="h-10 w-10 text-muted-foreground" />
                                                                <div className="flex flex-col items-center justify-center">
                                                                    <h3 className="text-lg font-medium">
                                                                        {t("orders.noDeliveryItems", "No delivery items found")}
                                                                    </h3>
                                                                    <p className="text-muted-foreground">
                                                                        {t(
                                                                            "orders.noDeliveryItemsDescription",
                                                                            "No items in this delivery."
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </TableCellRaw>
                                                    </TableRowRaw>
                                                }
                                            >
                                                {({ row }) => (
                                                    <TableRowRaw
                                                        key={row.id}
                                                        className="hover:bg-muted/50"
                                                        data-state={row.getIsSelected() && 'selected'}
                                                    >
                                                        {row.getVisibleCells().map((cell) => (
                                                            <TableCell
                                                                key={cell.id}
                                                                cell={cell}
                                                            />
                                                        ))}
                                                    </TableRowRaw>
                                                )}
                                            </TableBody>
                                        </TableProvider>

                                        {/* Load More Button */}
                                        {nextPageToken && (
                                            <div className="flex justify-center mt-4">
                                                <Button
                                                    variant="outline"
                                                    onClick={loadMoreItems}
                                                    disabled={loadingMore}
                                                    className="min-w-32"
                                                >
                                                    {loadingMore ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            {t("common.loading", "Loading...")}
                                                        </>
                                                    ) : (
                                                        t("common.loadMore", "Load More")
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                                <TabsContent value="files" transition={{ duration: 0 }}>
                                    <FilesSection
                                        entity_id={delivery.id}
                                        showBreadcrumbs={false}
                                        showCreateFolder={false}
                                    />
                                </TabsContent>
                                <TabsContent value="messages" transition={{ duration: 0 }}>
                                    <div className="w-full h-105">
                                        <ThreadSection entityId={delivery.id} />
                                    </div>
                                </TabsContent>
                            </TabsContents>
                        </Tabs>


                        {/* Items Section */}

                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default DeliveryViewModal;
