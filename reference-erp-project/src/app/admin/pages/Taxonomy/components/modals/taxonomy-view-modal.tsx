import { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Package, Plus } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import CustomActionsDropdown from '@/app/components/custom-actions-dropdown';
import { Separator } from '@/components/ui/separator';
import Tag from '@/app/components/tag/tag';
import IdBadge from '@/app/components/id-badge';
import SearchBar from '@/app/components/search-bar';
import { getOrgsItemsHierarchyItems, deleteOrgsItemsHierarchyItems } from '@/api/orgs/hierachy/items/items';
import { deleteOrgsItemsHierarchy } from '@/api/orgs/hierachy/hierachy';
import { ItemHierarchy } from '@/types/general/taxonomy';
import IconLabel from '@/app/components/labels/icon-label';
import PageHeader from '@/app/components/page-header';
import { Item } from '@/types/items/items';
import TaxonomyItemsTable from '../taxonomy-items-table';
import TaxonomyDeleteModal from './taxonomy-delete-modal';
import TaxonomyItemDeleteModal from './taxonomy-item-delete-modal';

interface TaxonomyViewModalProps {
    taxonomy: ItemHierarchy | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEditTaxonomy: (taxonomy: ItemHierarchy) => void;
    onTaxonomyDeleted: () => void;
    onAddItemClick: () => void;
}

export interface TaxonomyViewModalRef {
    refreshItems: () => void;
}

const TaxonomyViewModal = forwardRef<TaxonomyViewModalRef, TaxonomyViewModalProps>(({
    taxonomy,
    open,
    onOpenChange,
    onEditTaxonomy,
    onTaxonomyDeleted,
    onAddItemClick,
}, ref) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [items, setItems] = useState<Item[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteItemModalOpen, setDeleteItemModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
    const [deletingItem, setDeletingItem] = useState(false);
    const [deleteTaxonomyModalOpen, setDeleteTaxonomyModalOpen] = useState(false);
    const [deletingTaxonomy, setDeletingTaxonomy] = useState(false);

    // Get type color
    const getTypeColor = (type: string) => {
        switch (type) {
            case "family":
                return "cyan";
            case "sub_family":
                return "emerald";
            case "category":
                return "yellow";
            default:
                return "zinc";
        }
    };

    const handleDeleteConfirm = useCallback((item: Item) => {
        setItemToDelete(item);
        setDeleteItemModalOpen(true);
    }, []);

    // Custom render function for table actions
    const renderTableActions = (item: Item) => {
        return (
            <CustomActionsDropdown
                items={[
                    {
                        label: t("common.delete", "Delete"),
                        icon: "trash-2",
                        onClick: () => handleDeleteConfirm(item),
                        variant: "destructive",
                    },
                ]}
            />
        );
    };

    const fetchItems = useCallback(async (query: string = "") => {
        if (!orgId || !taxonomy?.id) return;

        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }

        try {
            const response = await getOrgsItemsHierarchyItems(
                orgId,
                taxonomy.id,
                query || undefined,
                null
            );

            if (response.success) {
                const fetchedItems = response.success.items || [];
                setItems(fetchedItems);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(
                    t("taxonomy.items.errorFetching", "Error fetching hierarchy items")
                );
            }
        } catch (error) {
            console.error("Error fetching hierarchy items:", error);
            toast.error(
                t("taxonomy.items.errorFetching", "Error fetching hierarchy items")
            );
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    }, [orgId, taxonomy?.id, t]);

    const loadMoreItems = useCallback(async () => {
        if (!orgId || !taxonomy?.id || !nextPageToken || isLoadingMore || isLoading) return;

        setIsLoadingMore(true);
        try {
            const response = await getOrgsItemsHierarchyItems(
                orgId,
                taxonomy.id,
                searchQuery || undefined,
                nextPageToken
            );
            if (response.success && response.success.items) {
                setItems(prev => [...prev, ...response.success.items]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("taxonomy.items.errorFetching", "Error fetching items"));
            }
        } catch (error) {
            toast.error(t("taxonomy.items.errorFetching", "Error fetching items"));
        } finally {
            setIsLoadingMore(false);
        }
    }, [orgId, taxonomy?.id, nextPageToken, isLoadingMore, isLoading, searchQuery, t]);

    useEffect(() => {
        if (open && taxonomy?.id) {
            fetchItems();
        } else {
            // Reset state when modal closes
            setItems([]);
            setSearchQuery("");
            setNextPageToken(null);
        }
    }, [open, taxonomy?.id, fetchItems]);

    // Expose refresh method to parent
    useImperativeHandle(ref, () => ({
        refreshItems: () => fetchItems(searchQuery)
    }), [fetchItems, searchQuery]);

    const handleDeleteItem = useCallback(async () => {
        if (!itemToDelete || !orgId || !taxonomy?.id) return;

        setDeletingItem(true);
        try {
            const response = await deleteOrgsItemsHierarchyItems(orgId, taxonomy.id, {
                items_ids: [itemToDelete.id],
            });
            if (response?.success) {
                toast.success(t("taxonomy.items.itemDeleted", "Item removed from hierarchy successfully"));
                // Remove from local state
                setItems(prev => prev.filter(i => i.id !== itemToDelete.id));
                setDeleteItemModalOpen(false);
                setItemToDelete(null);
            } else {
                toast.error(t("taxonomy.items.errorDeleting", "Error removing item from hierarchy"));
            }
        } catch (error) {
            toast.error(t("taxonomy.items.errorDeleting", "Error removing item from hierarchy"));
        } finally {
            setDeletingItem(false);
        }
    }, [itemToDelete, orgId, taxonomy?.id, t]);

    const handleDeleteTaxonomy = useCallback(async () => {
        if (!orgId || !taxonomy?.id) return;

        setDeletingTaxonomy(true);
        try {
            const response = await deleteOrgsItemsHierarchy(orgId, taxonomy.id);

            if (response.success) {
                toast.success(t('taxonomy.deletedSuccess', 'Item hierarchy deleted successfully'));
                setDeleteTaxonomyModalOpen(false);
                onOpenChange(false);
                onTaxonomyDeleted();
            } else {
                toast.error(response.error || t('taxonomy.errorDeleting', 'Failed to delete item hierarchy'));
            }
        } catch (error) {
            console.error('Error deleting item hierarchy:', error);
            toast.error(t('taxonomy.errorDeleting', 'Failed to delete item hierarchy'));
        } finally {
            setDeletingTaxonomy(false);
        }
    }, [orgId, taxonomy?.id, t, onOpenChange, onTaxonomyDeleted]);

    // Early return after all hooks
    if (!taxonomy) return null;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="min-h-[70vh] max-h-[90vh] w-full md:max-w-5xl flex flex-col" showCloseButton={false}>
                    <DialogHeader>
                        <div className="flex items-start gap-2">
                            <DialogTitle className="flex flex-col items-start gap-1">
                                <div className="flex items-center gap-2">
                                    <IconLabel size="md" variant="truncate"
                                    data={{icon: taxonomy.icon, text: taxonomy.name, color: taxonomy.color}} showEmptyColor={false} />
                                </div>
                            </DialogTitle>
                            <div className="flex items-center gap-2 ml-auto">
                                <Tag
                                    className="capitalize"
                                    text={t(`taxonomy.type.${taxonomy.type}`, taxonomy.type.replace("_", " ") as string)}
                                />
                                <IdBadge id={taxonomy.id} />
                            </div>
                            <CustomActionsDropdown
                                items={[
                                    {
                                        label: t('common.edit', 'Edit'),
                                        icon: "edit",
                                        onClick: () => {
                                            onEditTaxonomy(taxonomy);
                                            onOpenChange(false);
                                        },
                                    },
                                    {
                                        label: t('common.delete', 'Delete'),
                                        icon: "trash-2",
                                        onClick: () => setDeleteTaxonomyModalOpen(true),
                                        variant: "destructive",
                                    },
                                ]}
                            />
                        </div>
                    </DialogHeader>

                    <div className="space-y-4 overflow-y-auto max-h-[80vh] px-2 scrollbar-hide">
                        {/* Taxonomy Information */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <h4 className="font-medium text-sm">{t('taxonomy.type', 'Type')}</h4>
                                <Tag
                                    className="capitalize"
                                    text={t(`taxonomy.type.${taxonomy.type}`, taxonomy.type.replace("_", " ") as string)}
                                />
                            </div>

                            <div className="space-y-1">
                                <h4 className="font-medium text-sm">{t('taxonomy.margin', 'Margin')}</h4>
                                {taxonomy.margin !== null ? (
                                    <span className="text-sm">{taxonomy.margin}%</span>
                                ) : (
                                    <span className="text-sm text-muted-foreground">-</span>
                                )}
                            </div>

                            <div className="space-y-1">
                                <h4 className="font-medium text-sm">{t('taxonomy.parent', 'Parent Hierarchy')}</h4>
                                {taxonomy.parent ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">{taxonomy.parent.name}</span>
                                        <IdBadge id={taxonomy.parent.id} />
                                    </div>
                                ) : (
                                    <span className="text-sm text-muted-foreground">-</span>
                                )}
                            </div>

                            <div className="space-y-1">
                                <h4 className="font-medium text-sm">{t('taxonomy.numItems', 'Number of Items')}</h4>
                                <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    <span
                                        className="text-sm"
                                        title={`Direct: ${taxonomy.num_items_hierarchy || 0} | Total (incl. sub-categories): ${taxonomy.num_items_total || 0}`}
                                    >
                                        {(taxonomy.num_items_hierarchy || 0) === (taxonomy.num_items_total || 0)
                                            ? taxonomy.num_items_hierarchy || 0
                                            : `${taxonomy.num_items_hierarchy || 0} (${taxonomy.num_items_total || 0})`
                                        }
                                    </span>
                                </div>
                                {(taxonomy.num_items_hierarchy || 0) !== (taxonomy.num_items_total || 0) && (
                                    <p className="text-xs text-muted-foreground">
                                        Direct: {taxonomy.num_items_hierarchy || 0} | Total (incl. sub-categories): {taxonomy.num_items_total || 0}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        {taxonomy.description && (
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm">{t('taxonomy.description', 'Description')}</h4>
                                <p className="text-sm text-muted-foreground">
                                    {taxonomy.description}
                                </p>
                            </div>
                        )}

                        <Separator className="my-4" />

                        {/* Items Section */}
                        <div className="space-y-4">
                            <PageHeader
                                title={t('taxonomy.items.title', 'Items')}
                                showBackButton={false}
                                action={
                                    <Button onClick={onAddItemClick} size="sm">
                                        <Plus className="h-4 w-4" />
                                        {t("taxonomy.items.addItem", "Add Items")}
                                    </Button>
                                }
                            />

                            {/* Search Bar */}
                            <SearchBar
                                value={searchQuery}
                                isLoading={isSearching}
                                onChange={(query) => setSearchQuery(query)}
                                onSearch={fetchItems}
                                placeholder={t(
                                    "taxonomy.items.searchPlaceholder",
                                    "Search items in this hierarchy..."
                                )}
                                className="w-full"
                            />

                            {/* Items Table */}
                            <TaxonomyItemsTable
                                data={items}
                                isLoading={isLoading}
                                renderActions={renderTableActions}
                                onEmptyStateAction={onAddItemClick}
                                searchQuery={searchQuery}
                            />

                            {/* Load More Button */}
                            {nextPageToken && (
                                <div className="flex justify-center mt-4">
                                    <Button
                                        variant="outline"
                                        onClick={loadMoreItems}
                                        disabled={isLoadingMore}
                                        size="sm"
                                    >
                                        {isLoadingMore ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                {t("common.loading", "Loading...")}
                                            </>
                                        ) : (
                                            t("common.loadMore", "Load more")
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Taxonomy Confirmation Modal */}
            <TaxonomyDeleteModal
                open={deleteTaxonomyModalOpen}
                onOpenChange={setDeleteTaxonomyModalOpen}
                taxonomy={taxonomy}
                onConfirm={handleDeleteTaxonomy}
                isDeleting={deletingTaxonomy}
            />

            {/* Delete Item Confirmation Modal */}
            <TaxonomyItemDeleteModal
                open={deleteItemModalOpen}
                onOpenChange={(open) => {
                    setDeleteItemModalOpen(open);
                    if (!open) {
                        setItemToDelete(null);
                    }
                }}
                item={itemToDelete}
                onConfirm={handleDeleteItem}
                isDeleting={deletingItem}
            />
        </>
    );
});

TaxonomyViewModal.displayName = 'TaxonomyViewModal';

export default TaxonomyViewModal;

