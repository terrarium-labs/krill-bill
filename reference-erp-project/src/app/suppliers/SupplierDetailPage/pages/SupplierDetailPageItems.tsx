import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { Item } from "@/types/items/items";
import SearchBar from "@/app/components/search-bar";
import { getSupplierItems } from "@/api/suppliers/items/items";
import { toast } from "sonner";
import SupplierItemsTable from "@/app/suppliers/components/supplier-items-table";

const SupplierDetailPageItems = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId, supplierId } = useParams<{ orgId: string; supplierId: string }>();
    const [items, setItems] = useState<Item[]>([]);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch items function
    const fetchItems = async (query: string = "") => {
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        if (!orgId || !supplierId) return;

        try {
            const response = await getSupplierItems(orgId, supplierId, query || undefined, undefined);
            if (response.success && response.success.items) {
                setItems(response.success.items);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("items.errorFetchingItems") || "Error fetching items");
            }
        } catch (error) {
            toast.error(t("items.errorFetchingItems") || "Error fetching items");
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchItems();
    }, [orgId, supplierId]);

    // Load more items
    const loadMoreItems = async () => {
        if (!orgId || !supplierId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getSupplierItems(orgId, supplierId, searchQuery, nextPageToken);
            if (response.success && response.success.items) {
                setItems(prev => [...prev, ...response.success.items]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("items.errorFetchingItems") || "Error fetching items");
            }
        } catch (error) {
            toast.error(t("items.errorFetchingItems") || "Error fetching items");
        } finally {
            setLoadingMore(false);
            setIsLoading(false);
        }
    };

    // Navigate to item detail
    const handleViewItem = (itemId: string) => {
        navigate(`/${orgId}/items/${itemId}`);
    };

    // Navigate to items page and trigger new item modal
    const handleAddNewItem = () => {
        navigate(`/${orgId}/items`, { state: { openNewItemModal: true } });
    };

    return (
        <div className="space-y-4">
            {/* Search bar with Add Item button */}
            <div className="flex items-center gap-2">
                <div className="flex-1">
                    <SearchBar
                        value={searchQuery}
                        isLoading={isSearching}
                        onChange={(query) => setSearchQuery(query)}
                        onSearch={fetchItems}
                        placeholder={t("items.searchPlaceholder", "Search items...")}
                    />
                </div>
                <Button onClick={handleAddNewItem}>
                    <Plus className="h-4 w-4" />
                    {t("items.addItem", "Add Item")}
                </Button>
            </div>

            {/* Items Table */}
            <SupplierItemsTable
                items={items}
                isLoading={isLoading}
                onRowClick={(item) => handleViewItem(item.id)}
                clickableRows={true}
                onEmptyStateAction={handleAddNewItem}
                searchQuery={searchQuery}
            />

            {/* Load More Button */}
            {nextPageToken && (
                <div className="flex justify-center mt-6">
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
    );
};

export default SupplierDetailPageItems;

