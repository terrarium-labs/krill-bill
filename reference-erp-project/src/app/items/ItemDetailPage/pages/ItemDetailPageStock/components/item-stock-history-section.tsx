import { StockLocationHistoryItem, StockLocationItem } from "@/types/items/stock";
import { getOrgItemStockHistory } from "@/api/items/stocks/stocks";
import { useParams } from "react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, CalendarIcon, FilterX } from "lucide-react";
import SearchBar from "@/app/components/search-bar";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { formatDateForAPI } from "@/utils/miscelanea";
import ItemStockAdjustmentModal from "@/app/items/ItemDetailPage/pages/ItemDetailPageStock/components/item-stock-adjustment-modal";
import ItemStockHistoryTable from "./item-stock-history-table";

const ItemStockHistorySection = ({ selectedLocation }: { selectedLocation: StockLocationItem | null }) => {
    const { t } = useTranslation();
    const { orgId, itemId } = useParams<{ orgId: string; itemId: string }>();
    const [transactions, setTransactions] = useState<StockLocationHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);

    const fetchHistory = async (query: string = "", page_token: string | null = null) => {
        if (!orgId || !itemId) return;

        // Set loading state
        if (query && !page_token) {
            setIsSearching(true);
        } else if (!page_token) {
            setIsLoading(true);
        }

        try {
            const response = await getOrgItemStockHistory(
                orgId,
                itemId,
                selectedLocation?.location_id,
                formatDateForAPI(dateRange?.from),
                formatDateForAPI(dateRange?.to),
                query || undefined,
                page_token || undefined
            );

            if (response.success) {
                const results = response.success.transactions || [];

                if (page_token) {
                    // Loading more results - append to existing
                    setTransactions((prev) => [...prev, ...results]);
                } else {
                    // New search or initial load - replace existing
                    setTransactions(results);
                }

                // Handle next page token
                if (response.success.next_page_token) {
                    setNextPageToken(response.success.next_page_token);
                } else {
                    setNextPageToken(null);
                }
            }
        } finally {
            setIsLoading(false);
            setIsSearching(false);
        }
    }

    const loadMore = async () => {
        if (!nextPageToken || isLoadingMore) return;

        setIsLoadingMore(true);
        try {
            await fetchHistory(searchQuery, nextPageToken);
        } finally {
            setIsLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchHistory(searchQuery);
    }, [selectedLocation, dateRange]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex gap-4 w-full">
                <SearchBar
                    value={searchQuery}
                    isLoading={isSearching}
                    onChange={(query) => setSearchQuery(query)}
                    onSearch={(query) => fetchHistory(query)}
                    placeholder={t("stock.searchPlaceholder", "Search transactions...")}
                    className="w-full"
                />

                <Button onClick={() => setAdjustmentModalOpen(true)}>
                    <Plus className="h-4 w-4" />
                    {t("stock.addTransaction", "New Adjustment")}
                </Button>
            </div>
            <div className="flex gap-2 items-center justify-start">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="min-w-[240px] justify-start shadow-none">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            {dateRange?.from && dateRange?.to
                                ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
                                : dateRange?.from
                                    ? dateRange.from.toLocaleDateString()
                                    : t("stock.selectDateRange", "Select date range")}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="end">
                        <Calendar
                            className="w-full"
                            captionLayout="dropdown"
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                            disabled={{
                                after: new Date(),
                            }}
                        />
                    </PopoverContent>
                </Popover>
                {dateRange && (
                    <Button
                        variant="outline"
                        size="default"
                        onClick={() => setDateRange(undefined)}
                        className="gap-2"
                    >
                        <FilterX className="h-4 w-4" />
                        {t("stock.clearFilters", "Clear Filters")}
                    </Button>
                )}
            </div>


            {/* Transactions Table */}
            <ItemStockHistoryTable
                transactions={transactions}
                isLoading={isLoading}
                searchQuery={searchQuery}
            />

            {/* Load More Button */}
            {nextPageToken && (
                <div className="flex justify-center mt-6">
                    <Button
                        variant="outline"
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        className="min-w-32"
                    >
                        {isLoadingMore ? (
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

            {/* Stock Adjustment Modal */}
            <ItemStockAdjustmentModal
                open={adjustmentModalOpen}
                onOpenChange={setAdjustmentModalOpen}
                onAdjustmentSaved={() => fetchHistory(searchQuery)}
                selectedLocation={selectedLocation}
            />
        </div>
    )
}

export default ItemStockHistorySection;