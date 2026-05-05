import { StockLocationHistoryItem } from "@/types/items/stock";
import { getLocationHistory } from "@/api/orgs/locations/locations";
import { useParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Loader2, CalendarIcon, FilterX } from "lucide-react";
import SearchBar from "@/app/components/search-bar";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { formatDateForAPI } from "@/utils/miscelanea";
import { useLocation } from "@/app/warehouses/contexts/LocationContext";
import WarehouseHistoryTable from "./components/warehouse-history-table";

const WarehouseDetailPageHistory = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const { location } = useLocation();
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState<StockLocationHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    const fetchHistory = async (query: string = "", page_token: string | null = null) => {
        if (!orgId || !location?.id) return;

        // Set loading state
        if (query && !page_token) {
            setIsSearching(true);
        } else if (!page_token) {
            setIsLoading(true);
        }

        try {
            const response = await getLocationHistory(
                orgId,
                location.id,
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
    }, [location, dateRange]);

    // Navigate to item detail
    const handleViewItem = (itemId: string) => {
        navigate(`/${orgId}/items/${itemId}`);
    };

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
            <WarehouseHistoryTable
                transactions={transactions}
                isLoading={isLoading}
                searchQuery={searchQuery}
                onViewItem={handleViewItem}
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
        </div>
    )
}

export default WarehouseDetailPageHistory;

