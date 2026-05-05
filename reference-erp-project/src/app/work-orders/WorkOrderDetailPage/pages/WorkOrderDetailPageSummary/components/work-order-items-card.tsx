import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getWorkOrderItems, deleteWorkOrderItem } from "@/api/field-service/work-orders/items/items";
import { ItemWorkOrder, getItemDisplayData } from "@/types/field-service/work-orders/items";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import WorkOrderItemEditModal from "./modals/work-order-item-edit-modal";
import WorkOrderItemViewModal from "./modals/work-order-item-view-modal";
import { toast } from "sonner";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import SearchBar from "@/app/components/search-bar";
import WorkOrderItemsTable from "./work-order-items-table";
import ItemLabel from "@/app/components/labels/item-label";

interface WorkOrderItemsCardProps {
    editMode?: boolean;
}

const WorkOrderItemsCard = ({ editMode = false }: WorkOrderItemsCardProps) => {
    const { t } = useTranslation();
    const { orgId, workOrderId } = useParams<{ orgId: string, workOrderId: string }>();
    const [workOrderItems, setWorkOrderItems] = useState<ItemWorkOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ItemWorkOrder | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingItem, setViewingItem] = useState<ItemWorkOrder | null>(null);
    const [isExpanded, setIsExpanded] = useState(true);

    // Calculate total quantity
    const totalQuantity = workOrderItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

    // Extract item objects for ItemLabel (prefer item, fallback to name from ItemWorkOrder)
    const itemObjects = workOrderItems.map(getItemDisplayData).filter(Boolean);

    const fetchWorkOrderItems = async (query: string = "", pageToken?: string) => {
        if (!orgId || !workOrderId) return;
        if (pageToken) {
            setLoadingMore(true);
        } else if (query) {
            setIsSearching(true);
        } else {
            setLoading(true);
        }
        try {
            const response = await getWorkOrderItems(orgId, workOrderId, query || undefined, pageToken);
            if (response.success) {
                const items = response.success.items || [];
                if (pageToken) {
                    setWorkOrderItems((prev) => [...prev, ...items]);
                } else {
                    setWorkOrderItems(items);
                }
                setNextPageToken(response.success.next_page_token || null);
            }
        } catch (error) {
            console.error('Error fetching work order items:', error);
        } finally {
            setLoading(false);
            setIsSearching(false);
            setLoadingMore(false);
        }
    };

    const loadMoreWorkOrderItems = async () => {
        if (!orgId || !workOrderId || !nextPageToken || loadingMore || loading) return;
        await fetchWorkOrderItems(searchQuery, nextPageToken);
    };

    useEffect(() => {
        fetchWorkOrderItems();
    }, [orgId, workOrderId]);

    const handleOpenAddModal = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (item: ItemWorkOrder) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleModalClose = (open: boolean) => {
        setIsModalOpen(open);
        if (!open) {
            setEditingItem(null);
        }
    };

    const handleOpenViewModal = (item: ItemWorkOrder) => {
        setViewingItem(item);
        setIsViewModalOpen(true);
    };

    const handleCloseViewModal = (open: boolean) => {
        setIsViewModalOpen(open);
        if (!open) {
            setViewingItem(null);
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!orgId || !workOrderId) return;

        try {
            const response = await deleteWorkOrderItem(orgId, workOrderId, itemId);
            if (response.success || response === undefined) {
                toast.success(t('workOrders.itemDeletedSuccessfully', 'Item deleted successfully'));
                fetchWorkOrderItems(searchQuery);
                setIsModalOpen(false);
                setEditingItem(null);
            } else {
                toast.error(response.error || t('workOrders.errorDeletingItem', 'Error deleting item'));
            }
        } catch (error) {
            console.error('Error deleting work order item:', error);
            toast.error(t('workOrders.errorDeletingItem', 'Error deleting item'));
        }
    };

    return (
        <>
            <Card className="shadow-none border-border p-0">
                <CardContent className="p-0">
                    {/* Header Row - Always Visible */}
                    <div
                        className={`flex items-center justify-between gap-4 cursor-pointer hover:bg-muted/50 transition-colors p-4 m-0`}
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Title */}
                            <span className="font-semibold">
                                {t('items.items', 'Items')}
                            </span>

                            {/* Collapsed View - Show items and total quantity, or empty state */}
                            {!isExpanded && (
                                <div className="flex items-center gap-3 min-w-0">
                                    {workOrderItems.length > 0 ? (
                                        <>
                                            <ItemLabel data={itemObjects as any} />
                                            <span className="text-sm text-muted-foreground">
                                                ({t('items.totalQuantity', 'Total')}: {totalQuantity}{nextPageToken ? '+' : ''})
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">
                                            {t('workOrdersDetail.noItemsAdded', 'No items added yet')}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Add Button (only in edit mode) */}
                        {editMode && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenAddModal();
                                }}
                            >
                                <Plus className="h-4 w-4" />
                                {t('workOrdersDetail.addItem', 'Add')}
                            </Button>
                        )}

                        {/* Expand/Collapse Icon */}
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                            }}
                        >
                            {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </Button>
                    </div>

                    {/* Expanded View - Full Table */}
                    {isExpanded && (
                        <div className="px-4 pb-4 space-y-4">
                            <SearchBar
                                value={searchQuery}
                                isLoading={isSearching}
                                onChange={(query) => setSearchQuery(query)}
                                onSearch={(query) => fetchWorkOrderItems(query)}
                                placeholder={t('workOrdersDetail.searchItems', 'Search items...')}
                                className="w-full"
                            />
                            <WorkOrderItemsTable
                                items={workOrderItems}
                                isLoading={loading || isSearching}
                                hiddenColumns={["description", "notes"]}
                                clickableRows
                                onRowClick={editMode ? handleOpenEditModal : handleOpenViewModal}
                                renderActions={editMode ? (item) => (
                                    <CustomActionsDropdown
                                        items={[
                                            {
                                                label: t('common.edit', 'Edit'),
                                                icon: 'edit',
                                                onClick: () => handleOpenEditModal(item),
                                            },
                                            {
                                                label: t('common.delete', 'Delete'),
                                                icon: 'trash-2',
                                                onClick: () => handleDeleteItem(item.id),
                                                variant: 'destructive',
                                            },
                                        ]}
                                    />
                                ) : undefined}
                                emptyStateTitle={t('workOrdersDetail.noItemsAdded', 'No items added yet')}
                                emptyStateDescription={t('workOrdersDetail.addItemsToOrder', 'Add items to this work order')}
                                onEmptyStateAction={editMode ? handleOpenAddModal : undefined}
                                emptyStateActionLabel={t('workOrdersDetail.addItem', 'Add Item')}
                            />
                            {nextPageToken && (
                                <div className="flex justify-center">
                                    <Button
                                        variant="outline"
                                        onClick={loadMoreWorkOrderItems}
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
                    )}
                </CardContent>
            </Card>

            {orgId && workOrderId && (
                <WorkOrderItemEditModal
                    open={isModalOpen}
                    onOpenChange={handleModalClose}
                    orgId={orgId}
                    workOrderId={workOrderId}
                    workOrderItem={editingItem}
                    onSuccess={() => fetchWorkOrderItems(searchQuery)}
                    onDelete={handleDeleteItem}
                />
            )}
            <WorkOrderItemViewModal
                open={isViewModalOpen}
                onOpenChange={handleCloseViewModal}
                workOrderItem={viewingItem}
            />
        </>
    );
};

export default WorkOrderItemsCard;
