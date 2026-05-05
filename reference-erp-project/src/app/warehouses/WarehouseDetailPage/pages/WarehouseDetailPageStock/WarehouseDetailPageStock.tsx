import { StockLocationInfoItem } from "@/types/items/stock";
import { useTranslation } from "@/hooks/useTranslation";
import { useEffect, useState } from "react";
import { getLocationStocks } from "@/api/orgs/locations/locations";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import SearchBar from "@/app/components/search-bar";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import WarehouseStockTable from "./components/warehouse-stock-table";

const WarehouseDetailPageStock = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId, locationId } = useParams<{ orgId: string; locationId: string }>();
    const [stocks, setStocks] = useState<StockLocationInfoItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);

    // Fetch stocks function
    const fetchStocks = async (search?: string) => {
        if (search) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        if (!orgId || !locationId) return;

        try {
            const response = await getLocationStocks(orgId, locationId, search);
            if (response.success && response.success.stocks) {
                setStocks(response.success.stocks);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("warehouses.stock.errorFetchingStocks", "Error fetching location stocks"));
            }
        } catch (error) {
            toast.error(t("warehouses.stock.errorFetchingStocks", "Error fetching location stocks"));
        } finally {
            setIsLoading(false);
            setIsSearching(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchStocks();
    }, []);

    // Load more stocks
    const loadMoreStocks = async () => {
        if (!orgId || !locationId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getLocationStocks(orgId, locationId, searchQuery || undefined, nextPageToken);
            if (response.success && response.success.stocks) {
                setStocks(prev => [...prev, ...response.success.stocks]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("warehouses.stock.errorFetchingStocks", "Error fetching location stocks"));
            }
        } catch (error) {
            toast.error(t("warehouses.stock.errorFetchingStocks", "Error fetching location stocks"));
        } finally {
            setLoadingMore(false);
        }
    };

    // Navigate to item detail
    const handleViewItem = (itemId: string) => {
        navigate(`/${orgId}/items/${itemId}`);
    };

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <SearchBar
                value={searchQuery}
                className="w-full"
                isLoading={isSearching}
                onChange={(query) => setSearchQuery(query)}
                onSearch={fetchStocks}
                placeholder={t("warehouses.stock.searchItems", "Search items...")}
            />

            {/* Stocks Table */}
            <WarehouseStockTable
                stocks={stocks}
                isLoading={isLoading}
                searchQuery={searchQuery}
                onViewItem={handleViewItem}
            />

            {/* Load More Button */}
            {nextPageToken && (
                <div className="flex justify-center mt-4">
                    <Button
                        variant="outline"
                        onClick={loadMoreStocks}
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

export default WarehouseDetailPageStock;

