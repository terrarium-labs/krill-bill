import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SearchBar from "@/app/components/search-bar";
import { getClientHourlyRates, deleteClientHourlyRate } from "@/api/clients/hourly-rates/hourly-rate";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import ClientHourlyRatesTable from "./components/client-hourly-rates-table";
import ClientHourlyRateDeleteModal from "./components/client-hourly-rate-delete-modal";
import { useClient } from "@/app/dashboard/contexts/DashboardClientContext";

interface ClientHourlyRate {
    id: string;
    hourly_rate_id: string;
    client_id: string;
    valid_from?: string;
    valid_to?: string;
    hourly_rate: {
        id: string;
        name: string;
        status: string;
        valid_from?: string;
        due_date?: string;
    };
}

interface DashboardClientPageRatesHourlyProps {
  onAddHourlyRateClick?: () => void;
}

export interface DashboardClientPageRatesHourlyRef {
  refreshHourlyRates: () => void;
}

const DashboardClientPageRatesHourly = forwardRef<
  DashboardClientPageRatesHourlyRef,
  DashboardClientPageRatesHourlyProps
>(({ onAddHourlyRateClick }, ref) => {
  const { t } = useTranslation();
  const { orgId } = useParams<{ orgId: string }>();
  const { client } = useClient();
  const clientId = client?.id ?? "";
    const [hourlyRates, setHourlyRates] = useState<ClientHourlyRate[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [hourlyRateToDelete, setHourlyRateToDelete] = useState<ClientHourlyRate | null>(null);
    const [deletingHourlyRate, setDeletingHourlyRate] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const navigate = useNavigate();

    const fetchHourlyRates = async (query: string = "") => {
        if (!orgId || !clientId) return;

        // Set loading state for search
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }

        try {
            const response = await getClientHourlyRates(orgId, clientId, query || null, null);

            if (response.success) {
                const fetchedHourlyRates = response.success.hourly_rates || [];
                setHourlyRates(fetchedHourlyRates);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(
                    t(
                        "clients.hourlyRates.error",
                        "Error fetching client hourly rates"
                    )
                );
                setHourlyRates([]);
            }
        } catch (error) {
            console.error("Error fetching client hourly rates:", error);
            toast.error(
                t(
                    "clients.hourlyRates.error",
                    "Error fetching client hourly rates"
                )
            );
            setHourlyRates([]);
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    // Load more hourly rates
    const loadMoreHourlyRates = async () => {
        if (!orgId || !clientId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getClientHourlyRates(orgId, clientId, searchQuery || null, nextPageToken);
            if (response.success) {
                const fetchedHourlyRates = response.success.hourly_rates || [];
                setHourlyRates(prev => [...prev, ...fetchedHourlyRates]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(
                    t(
                        "clients.hourlyRates.error",
                        "Error fetching client hourly rates"
                    )
                );
            }
        } catch (error) {
            console.error("Error loading more hourly rates:", error);
            toast.error(
                t(
                    "clients.hourlyRates.error",
                    "Error fetching client hourly rates"
                )
            );
        } finally {
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        if (orgId && clientId) {
            fetchHourlyRates("");
        }
    }, [orgId, clientId]);

    // Expose refresh function to parent component
    useImperativeHandle(ref, () => ({
        refreshHourlyRates: () => fetchHourlyRates("")
    }));

    // Handle delete confirmation
    const handleDeleteConfirm = (hourlyRate: ClientHourlyRate) => {
        setHourlyRateToDelete(hourlyRate);
        setDeleteModalOpen(true);
    };

    // Handle delete execution
    const handleDeleteHourlyRate = async () => {
        if (!hourlyRateToDelete || !orgId || !clientId) return;

        setDeletingHourlyRate(true);
        try {
            const response = await deleteClientHourlyRate(orgId, clientId, hourlyRateToDelete.hourly_rate.id);
            if (response?.success) {
                toast.success(t("clients.hourlyRates.hourlyRateDeleted", "Client removed from hourly rate successfully"));
                // Remove from local state
                setHourlyRates(prev => prev.filter(r => r.hourly_rate.id !== hourlyRateToDelete.hourly_rate.id));
            } else {
                toast.error(t("clients.hourlyRates.errorDeletingHourlyRate", "Error removing client from hourly rate"));
            }
        } catch (error) {
            toast.error(t("clients.hourlyRates.errorDeletingHourlyRate", "Error removing client from hourly rate"));
        } finally {
            setDeletingHourlyRate(false);
            setDeleteModalOpen(false);
            setHourlyRateToDelete(null);
        }
    };

    // Handle navigation to hourly rate
    const handleNavigateToHourlyRate = (hourlyRateId: string) => {
        navigate(`/${orgId}/hourly-rates/${hourlyRateId}`);
    };

    // Render actions for each hourly rate
    const renderActions = (hourlyRate: ClientHourlyRate) => {
        return (
            <CustomActionsDropdown
                items={[
                    {
                        label: t("common.view", "View"),
                        icon: "external-link",
                        onClick: () => handleNavigateToHourlyRate(hourlyRate.hourly_rate.id),
                    },
                    {
                        label: t("common.delete", "Delete"),
                        icon: "trash-2",
                        onClick: () => handleDeleteConfirm(hourlyRate),
                        variant: "destructive",
                    },
                ]}
            />
        );
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex gap-4 w-full">
                <SearchBar
                    value={searchQuery}
                    isLoading={isSearching}
                    onChange={(query) => setSearchQuery(query)}
                    onSearch={(query) => fetchHourlyRates(query)}
                    placeholder={t(
                        "clients.hourlyRates.searchPlaceholder",
                        "Search hourly rates for this client..."
                    )}
                    className="w-full"
                />
                <Button onClick={onAddHourlyRateClick}>
                    <Plus className="h-4 w-4" />
                    {t("clients.hourlyRates.addHourlyRate", "Add hourly rate")}
                </Button>
            </div>

            {/* Hourly Rates Table */}
            <ClientHourlyRatesTable
                hourlyRates={hourlyRates}
                isLoading={isLoading}
                searchQuery={searchQuery}
                onAddHourlyRate={onAddHourlyRateClick}
                onNavigateToHourlyRate={handleNavigateToHourlyRate}
                renderActions={renderActions}
            />

            {/* Load More Button */}
            {nextPageToken && (
                <div className="flex justify-center mt-6">
                    <Button
                        variant="outline"
                        onClick={loadMoreHourlyRates}
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

            {/* Delete Confirmation Dialog */}
            <ClientHourlyRateDeleteModal
                open={deleteModalOpen}
                onOpenChange={(open) => {
                    setDeleteModalOpen(open);
                    if (!open) {
                        setHourlyRateToDelete(null);
                    }
                }}
                hourlyRate={hourlyRateToDelete}
                onConfirm={handleDeleteHourlyRate}
                isDeleting={deletingHourlyRate}
            />
        </div>
    );
});

export default DashboardClientPageRatesHourly;

