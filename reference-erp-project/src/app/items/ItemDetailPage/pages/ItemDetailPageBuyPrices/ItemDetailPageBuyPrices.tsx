import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { ItemPriceResponse } from "@/types/items/items";
import {
    getOrgItemPrices,
    deleteOrgItemPrice,
    postOrgItemPricePriority,
} from "@/api/items/prices/prices";
import { toast } from "sonner";
import ItemBuyPriceNewModal from "@/app/items/ItemDetailPage/pages/ItemDetailPageBuyPrices/components/item-buy-price-new-modal";
import SearchBar from "@/app/components/search-bar";
import ItemBuyPricesTable from "./components/item-buy-prices-table";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import ItemBuyPriceDeleteModal from "./components/item-buy-price-delete-modal";

const ItemDetailPageBuyPrices = () => {
    const { t } = useTranslation();
    const { orgId, itemId } = useParams<{ orgId: string; itemId: string }>();
    const navigate = useNavigate();
    const [prices, setPrices] = useState<ItemPriceResponse[]>([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [priceToDelete, setPriceToDelete] = useState<ItemPriceResponse | null>(null);
    const [deletingPrice, setDeletingPrice] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [newPriceModalOpen, setNewPriceModalOpen] = useState(false);
    const [priceModalMode, setPriceModalMode] = useState<'create' | 'update'>('create');
    const [priceToEdit, setPriceToEdit] = useState<ItemPriceResponse | null>(null);
    const [isLoadingPriority, setIsLoadingPriority] = useState(false);

    // Fetch prices function
    const fetchPrices = async (search?: string, pageToken?: string) => {
        const isInitialLoad = !pageToken;
        if (isInitialLoad) {
            setIsLoading(true);
        }
        if (search !== undefined) {
            setIsSearching(true);
        }
        if (!orgId || !itemId) return;

        try {
            const response = await getOrgItemPrices(
                orgId,
                itemId,
                "buy",
                search || undefined,
                pageToken
            );
            if (response.success && response.success.prices) {
                setPrices(response.success.prices);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("items.prices.errorFetchingPrices", "Error fetching prices"));
            }
        } catch (error) {
            toast.error(t("items.prices.errorFetchingPrices", "Error fetching prices"));
        } finally {
            setIsLoading(false);
            setIsSearching(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchPrices();
    }, [orgId, itemId]);

    // Load more prices
    const loadMorePrices = async () => {
        if (!orgId || !itemId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getOrgItemPrices(
                orgId,
                itemId,
                "buy",
                searchQuery || undefined,
                nextPageToken
            );
            if (response.success && response.success.prices) {
                setPrices(prev => [...prev, ...response.success.prices]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("items.prices.errorFetchingPrices", "Error fetching prices"));
            }
        } catch (error) {
            toast.error(t("items.prices.errorFetchingPrices", "Error fetching prices"));
        } finally {
            setLoadingMore(false);
        }
    };

    // Handle delete confirmation
    const handleDeleteConfirm = (price: ItemPriceResponse) => {
        setPriceToDelete(price);
        setDeleteModalOpen(true);
    };

    // Handle delete execution
    const handleDeletePrice = async () => {
        if (!priceToDelete || !orgId || !itemId) return;

        setDeletingPrice(true);
        try {
            const response = await deleteOrgItemPrice(orgId, itemId, priceToDelete.id);
            if (response.success) {
                toast.success(t("items.prices.priceDeleted", "Price deleted successfully"));
                // Remove from local state
                setPrices(prev => prev.filter(p => p.id !== priceToDelete.id));
            } else {
                toast.error(t("items.prices.errorDeletingPrice", "Error deleting price"));
            }
        } catch (error) {
            toast.error(t("items.prices.errorDeletingPrice", "Error deleting price"));
        } finally {
            setDeletingPrice(false);
            setDeleteModalOpen(false);
            setPriceToDelete(null);
        }
    };

    // Handle open create price modal
    const handleOpenCreateModal = () => {
        setPriceModalMode('create');
        setPriceToEdit(null);
        setNewPriceModalOpen(true);
    };

    // Handle price created/updated
    const handlePriceChanged = () => {
        fetchPrices(searchQuery);
    };

    // Handle set priority
    const handleSetPriority = async (price: ItemPriceResponse, priority: string) => {
        if (!orgId || !itemId || !price.id) return;
        setIsLoadingPriority(true);
        try {
            const response = await postOrgItemPricePriority(orgId, itemId, price.id, { priority: parseInt(priority) });
            if (response.success) {
                toast.success(t("items.prices.prioritySet", "Priority set successfully"));
                setPrices(prev => prev.map(p => p.id === price.id ? { ...p, priority: parseInt(priority) } : p));
            } else {
                toast.error(t("items.prices.errorSettingPriority", "Error setting priority"));
            }
        } catch (error) {
            toast.error(t("items.prices.errorSettingPriority", "Error setting priority"));
        } finally {
            setIsLoadingPriority(false);
        }
    };

    // Render actions for table
    const renderTableActions = (price: ItemPriceResponse) => {
        return (
            <div className="flex justify-center items-center">
                <CustomActionsDropdown
                    items={[
                        {
                            label: t("common.delete", "Delete"),
                            icon: "trash-2",
                            onClick: () => handleDeleteConfirm(price),
                            variant: "destructive",
                        },
                    ]}
                />
            </div>
        );
    };

    return (
        <div className="space-y-6 w-full">
            {/* Header Actions */}
            <div className="flex items-center justify-between mb-4 gap-4">
                <SearchBar
                    value={searchQuery}
                    className="w-full"
                    isLoading={isSearching}
                    onChange={(query) => setSearchQuery(query)}
                    onSearch={fetchPrices}
                    placeholder={t("items.prices.searchPlaceholder", "Search prices...")}
                />
                <Button onClick={handleOpenCreateModal}>
                    <Plus className="h-4 w-4" />
                    {t("items.prices.addPrice", "Add Price")}
                </Button>
            </div>

            {/* Prices Table */}
            <ItemBuyPricesTable
                prices={prices}
                isLoading={isLoading}
                renderActions={renderTableActions}
                onSetPriority={handleSetPriority}
                onEmptyStateAction={handleOpenCreateModal}
                isLoadingPriority={isLoadingPriority}
            />

            {/* Load More Button */}
            {
                nextPageToken && (
                    <div className="flex justify-center mt-6">
                        <Button
                            variant="outline"
                            onClick={loadMorePrices}
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
                )
            }

            {/* Buy Price Modal */}
            <ItemBuyPriceNewModal
                open={newPriceModalOpen}
                onOpenChange={setNewPriceModalOpen}
                onPriceCreated={handlePriceChanged}
                price={priceToEdit}
                mode={priceModalMode}
                orgId={orgId || ''}
                itemId={itemId || ''}
            />

            {/* Delete Confirmation Modal */}
            <ItemBuyPriceDeleteModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                price={priceToDelete}
                onConfirm={handleDeletePrice}
                isDeleting={deletingPrice}
            />
        </div>
    );
};

export default ItemDetailPageBuyPrices;

