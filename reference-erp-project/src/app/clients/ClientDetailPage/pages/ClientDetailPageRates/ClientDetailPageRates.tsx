import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SearchBar from "@/app/components/search-bar";
import { getClientRates, deleteClientRate } from '@/api/clients/rates/rates';
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import ClientRatesTable from "./components/client-rates-table";
import ClientRateDeleteModal from "./components/client-rate-delete-modal";

interface ClientRate {
    id: string;
    name: string;
    status: string;
    valid_from?: string;
    due_date?: string
}

interface ClientDetailPageRatesProps {
    onAddRateClick?: () => void;
}

export interface ClientDetailPageRatesRef {
    refreshRates: () => void;
}

const ClientDetailPageRates = forwardRef<ClientDetailPageRatesRef, ClientDetailPageRatesProps>(({ onAddRateClick }, ref) => {
    const { t } = useTranslation();
    const { orgId, clientId } = useParams();
    const [rates, setRates] = useState<ClientRate[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [rateToDelete, setRateToDelete] = useState<ClientRate | null>(null);
    const [deletingRate, setDeletingRate] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const navigate = useNavigate();

    const fetchRates = async (query: string = "") => {
        if (!orgId || !clientId) return;

        // Set loading state for search
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }

        try {
            const response = await getClientRates(orgId, clientId, query || null, null);

            if (response.success) {
                const fetchedRates = response.success.rates || [];
                setRates(fetchedRates);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(
                    t(
                        "clients.rates.error",
                        "Error fetching client rates"
                    )
                );
                setRates([]);
            }
        } catch (error) {
            console.error("Error fetching client rates:", error);
            toast.error(
                t(
                    "clients.rates.error",
                    "Error fetching client rates"
                )
            );
            setRates([]);
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    // Load more rates
    const loadMoreRates = async () => {
        if (!orgId || !clientId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getClientRates(orgId, clientId, searchQuery || null, nextPageToken);
            if (response.success) {
                const fetchedRates = response.success.rates || [];
                setRates(prev => [...prev, ...fetchedRates]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(
                    t(
                        "clients.rates.error",
                        "Error fetching client rates"
                    )
                );
            }
        } catch (error) {
            console.error("Error loading more rates:", error);
            toast.error(
                t(
                    "clients.rates.error",
                    "Error fetching client rates"
                )
            );
        } finally {
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        if (orgId && clientId) {
            fetchRates("");
        }
    }, [orgId, clientId]);

    // Expose refresh function to parent component
    useImperativeHandle(ref, () => ({
        refreshRates: () => fetchRates("")
    }));

    // Handle delete confirmation
    const handleDeleteConfirm = (rate: ClientRate) => {
        setRateToDelete(rate);
        setDeleteModalOpen(true);
    };

    // Handle delete execution
    const handleDeleteRate = async () => {
        if (!rateToDelete || !orgId || !clientId) return;

        setDeletingRate(true);
        try {
            const response = await deleteClientRate(orgId, clientId, rateToDelete.id);
            if (response?.success) {
                toast.success(t("clients.rates.rateDeleted", "Rate removed from client successfully"));
                // Remove from local state
                setRates(prev => prev.filter(r => r.id !== rateToDelete.id));
            } else {
                toast.error(t("clients.rates.errorDeletingRate", "Error removing client from rate"));
            }
        } catch (error) {
            toast.error(t("clients.rates.errorDeletingRate", "Error removing client from rate"));
        } finally {
            setDeletingRate(false);
            setDeleteModalOpen(false);
            setRateToDelete(null);
        }
    };

    const handleNavigateToRate = (rateId: string) => {
        navigate(`/${orgId}/rates/${rateId}`);
    };

    const renderActions = (rate: ClientRate) => (
        <CustomActionsDropdown
            items={[
                {
                    label: t("common.view", "View"),
                    icon: "external-link",
                    onClick: () => handleNavigateToRate(rate.id),
                },
                {
                    label: t("common.delete", "Delete"),
                    icon: "trash-2",
                    onClick: () => handleDeleteConfirm(rate),
                    variant: "destructive",
                },
            ]}
        />
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="flex gap-4 w-full">
                <SearchBar
                    value={searchQuery}
                    isLoading={isSearching}
                    onChange={(query) => setSearchQuery(query)}
                    onSearch={(query) => fetchRates(query)}
                    placeholder={t(
                        "clients.rates.searchPlaceholder",
                        "Search rates for this client..."
                    )}
                    className="w-full"
                />
                <Button onClick={onAddRateClick}>
                    <Plus className="h-4 w-4" />
                    {t("clients.rates.addRate", "Add rate")}
                </Button>
            </div>

            <ClientRatesTable
                rates={rates}
                isLoading={isLoading}
                searchQuery={searchQuery}
                onAddRate={onAddRateClick}
                onNavigateToRate={handleNavigateToRate}
                renderActions={renderActions}
            />

            {/* Load More Button */}
            {nextPageToken && (
                <div className="flex justify-center mt-6">
                    <Button
                        variant="outline"
                        onClick={loadMoreRates}
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

            <ClientRateDeleteModal
                open={deleteModalOpen}
                onOpenChange={(open) => {
                    setDeleteModalOpen(open);
                    if (!open) {
                        setRateToDelete(null);
                    }
                }}
                rate={rateToDelete}
                onConfirm={handleDeleteRate}
                isDeleting={deletingRate}
            />
        </div>
    );
});

export default ClientDetailPageRates;

