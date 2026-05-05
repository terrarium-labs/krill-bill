import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockLocationItem } from "@/types/items/stock";
import { useTranslation } from "@/hooks/useTranslation";
import { useEffect, useState } from "react";
import { getOrgItemStocks } from "@/api/items/stocks/stocks";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import SearchBar from "@/app/components/search-bar";
import { Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useItem } from "@/app/items/contexts/ItemContext";
import { formatMeasure } from "@/utils/miscelanea";
import Tag from "@/app/components/tag/tag";


const ItemStockLocationCard = ({ selectedLocation, setSelectedLocation }: { selectedLocation: StockLocationItem | null, setSelectedLocation: (location: StockLocationItem | null) => void }) => {
    const { t } = useTranslation();
    const { item } = useItem();
    const { orgId } = useParams<{ orgId: string }>();
    const { itemId } = useParams<{ itemId: string }>();
    const [locations, setLocations] = useState<StockLocationItem[]>([]);
    const [allLocations, setAllLocations] = useState<StockLocationItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);

    // Fetch locations function
    const fetchLocations = async (search?: string) => {
        setIsLoading(true);
        setIsSearching(true);
        if (!orgId || !itemId) return;

        try {
            const response = await getOrgItemStocks(orgId, itemId, search);
            if (response.success && response.success.stocks) {
                setAllLocations(response.success.stocks);
                // Apply search filter if there's a search query
                if (search) {
                    const searchLower = search.toLowerCase();
                    const filtered = response.success.stocks.filter((location: StockLocationItem) => {
                        return location.location_name.toLowerCase().includes(searchLower);
                    });
                    setLocations(filtered);
                } else {
                    setLocations(response.success.stocks);
                }
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("items.stock.errorFetchingLocations", "Error fetching stock locations"));
            }
        } catch (error) {
            toast.error(t("items.stock.errorFetchingLocations", "Error fetching stock locations"));
        } finally {
            setIsLoading(false);
            setIsSearching(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchLocations();
    }, []);

    // Handle search query changes
    useEffect(() => {
        if (allLocations.length > 0) {
            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase();
                const filtered = allLocations.filter((location: StockLocationItem) => {
                    return location.location_name.toLowerCase().includes(searchLower);
                });
                setLocations(filtered);
            } else {
                setLocations(allLocations);
            }
        }
    }, [searchQuery, allLocations]);

    // Load more locations
    const loadMoreLocations = async () => {
        if (!orgId || !itemId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getOrgItemStocks(orgId, itemId, searchQuery || undefined, nextPageToken);
            if (response.success && response.success.stocks) {
                const newAllLocations = [...allLocations, ...response.success.stocks];
                setAllLocations(newAllLocations);

                // Apply search filter if there's a search query
                if (searchQuery) {
                    const searchLower = searchQuery.toLowerCase();
                    const filtered = newAllLocations.filter((location: StockLocationItem) => {
                        return location.location_name.toLowerCase().includes(searchLower);
                    });
                    setLocations(filtered);
                } else {
                    setLocations(prev => [...prev, ...response.success.stocks]);
                }
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("items.stock.errorFetchingLocations", "Error fetching stock locations"));
            }
        } catch (error) {
            toast.error(t("items.stock.errorFetchingLocations", "Error fetching stock locations"));
        } finally {
            setLoadingMore(false);
        }
    };

    const handleSelectLocation = (location: StockLocationItem) => {
        if (selectedLocation?.location_id === location.location_id) {
            setSelectedLocation(null);
        } else {
            setSelectedLocation(location);
        }
    };

    return (
        <Card className="w-full shadow-none">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-between">
                    {t('items.stock.locations', 'Stock Locations')}
                    <Tag text={`Total: ${item.total_stock || 0} ${formatMeasure(item.measure)}`} color={'gray'} />
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Search Bar */}
                <SearchBar
                    value={searchQuery}
                    className="w-full"
                    isLoading={isSearching}
                    onChange={(query) => setSearchQuery(query)}
                    onSearch={() => { }}
                    placeholder={t("items.stock.searchLocations", "Search locations...")}
                />

                {/* Locations List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : locations.length === 0 ? (
                    <div className="text-center py-4">
                        <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <h3 className="text-md font-medium text-muted-foreground">
                            {t('items.stock.noLocations', 'No stock locations')
                            }
                        </h3>
                        <p className="text-muted-foreground mb-4 text-xs">
                            {t('items.stock.noLocationsDescription', 'No stock found for this item')
                            }
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {locations.map((location) => (
                            <Button key={location.location_id} variant="ghost"
                                className={cn("w-full justify-start", selectedLocation?.location_id === location.location_id && "bg-muted")}
                                onClick={() => handleSelectLocation(location)}>
                                <div className="flex gap-1 justify-between items-center w-full">
                                    <p className="text-sm font-medium max-w-[200px] truncate">{location.location_name}</p>
                                    <p className="text-sm font-semibold text-right">{location.quantity}</p>
                                </div>
                            </Button>
                        ))}
                    </div>
                )}

                {/* Load More Button */}
                {nextPageToken && (
                    <div className="flex justify-center mt-4">
                        <Button
                            variant="outline"
                            onClick={loadMoreLocations}
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
            </CardContent>
        </Card>
    );
};

export default ItemStockLocationCard;