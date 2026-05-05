import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { HourlyRate } from "@/types/general/hourly-rates";
import SearchBar from "@/app/components/search-bar";
import { getOrgHourlyRates, deleteOrgHourlyRate } from "@/api/orgs/hourly-rates/hourly-rates";
import HourlyRateEditModal from "./components/hourly-rate-edit-modal";
import { toast } from "sonner";
import HourlyRatesTable from "./components/hourly-rates-table";
import HourlyRateDeleteModal from "./components/hourly-rate-delete-modal";
import { useHourlyRatesTablePreferences } from "@/hooks/use-hourly-rates-table-preferences";
import { HourlyRateColumnSelector } from "./components/hourly-rate-column-selector";

const HourlyRatesPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const [hourlyRates, setHourlyRates] = useState<HourlyRate[]>([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [hourlyRateToDelete, setHourlyRateToDelete] = useState<HourlyRate | null>(null);
    const [deletingHourlyRate, setDeletingHourlyRate] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [newHourlyRateModalOpen, setNewHourlyRateModalOpen] = useState(false);
    const [editHourlyRateModalOpen, setEditHourlyRateModalOpen] = useState(false);
    const [hourlyRateToEdit, setHourlyRateToEdit] = useState<HourlyRate | null>(null);

    // Column preferences persisted in localStorage
    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = useHourlyRatesTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) =>
            setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback(
        (order: string[]) => setColumnOrder(order),
        [setColumnOrder],
    );

    // Fetch hourly rates function
    const fetchHourlyRates = async (query: string = "") => {
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        if (!orgId) return;

        try {
            const response = await getOrgHourlyRates(orgId, query, null);
            if (response.success && response.success.hourly_rates) {
                setHourlyRates(response.success.hourly_rates);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("hourlyRates.errorFetchingHourlyRates") || "Error fetching hourly rates");
            }
        } catch (error) {
            toast.error(t("hourlyRates.errorFetchingHourlyRates") || "Error fetching hourly rates");
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchHourlyRates();
    }, []);

    // Load more hourly rates
    const loadMoreHourlyRates = async () => {
        if (!orgId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getOrgHourlyRates(orgId, searchQuery, nextPageToken);
            if (response.success && response.success.hourly_rates) {
                setHourlyRates(prev => [...prev, ...response.success.hourly_rates]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("hourlyRates.errorFetchingHourlyRates") || "Error fetching hourly rates");
            }
        } catch (error) {
            toast.error(t("hourlyRates.errorFetchingHourlyRates") || "Error fetching hourly rates");
        } finally {
            setLoadingMore(false);
            setIsLoading(false);
        }
    };

    // Handle delete confirmation
    const handleDeleteConfirm = (hourlyRate: HourlyRate) => {
        setHourlyRateToDelete(hourlyRate);
        setDeleteModalOpen(true);
    };

    // Handle delete execution
    const handleDeleteHourlyRate = async () => {
        if (!hourlyRateToDelete || !orgId) return;

        setDeletingHourlyRate(true);
        try {
            const response = await deleteOrgHourlyRate(orgId, hourlyRateToDelete.id);
            if (response.success) {
                toast.success(t("hourlyRates.hourlyRateDeleted", "Hourly rate deleted successfully"));
                // Remove from local state
                setHourlyRates(prev => prev.filter(r => r.id !== hourlyRateToDelete.id));
            } else {
                toast.error(t("hourlyRates.errorDeletingHourlyRate", "Error deleting hourly rate"));
            }
        } catch (error) {
            toast.error(t("hourlyRates.errorDeletingHourlyRate", "Error deleting hourly rate"));
        } finally {
            setDeletingHourlyRate(false);
            setDeleteModalOpen(false);
            setHourlyRateToDelete(null);
        }
    };

    // Navigate to hourly rate detail
    const handleViewHourlyRate = (hourlyRateId: string) => {
        navigate(`/${orgId}/hourly-rates/${hourlyRateId}`);
    };

    const renderActions = (hourlyRate: HourlyRate) => (
        <CustomActionsDropdown
            items={[
                {
                    label: t("common.edit", "Edit"),
                    icon: "edit",
                    onClick: () => {
                        setHourlyRateToEdit(hourlyRate);
                        setEditHourlyRateModalOpen(true);
                    },
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

    return (
        <>
            <div className="flex items-center gap-2 mt-4">
                <SearchBar
                    value={searchQuery}
                    isLoading={isSearching}
                    onChange={(query: string) => setSearchQuery(query)}
                    onSearch={fetchHourlyRates}
                    className="w-full"
                    placeholder={t("hourlyRates.searchPlaceholder", "Search hourly rates...")}
                />
                <HourlyRateColumnSelector
                    columnVisibility={columnVisibility}
                    columnOrder={columnOrder}
                    onColumnVisibilityChange={handleColumnVisibilityChange}
                    onColumnOrderChange={handleColumnOrderChange}
                    onReset={resetPreferences}
                />
                <Button onClick={() => setNewHourlyRateModalOpen(true)}>
                    <Plus className=" h-4 w-4" />
                    {t("hourlyRates.addHourlyRate", "Add Hourly Rate")}
                </Button>
            </div>

            <HourlyRatesTable
                hourlyRates={hourlyRates}
                isLoading={isLoading}
                searchQuery={searchQuery}
                onViewHourlyRate={handleViewHourlyRate}
                onAddHourlyRate={() => setNewHourlyRateModalOpen(true)}
                renderActions={renderActions}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                columnOrder={columnOrder}
                onColumnOrderChange={setColumnOrder}
                columnSizing={columnSizing}
                onColumnSizingChange={setColumnSizing}
            />

            {nextPageToken && (
                <div className="flex justify-center mt-6">
                    <Button
                        variant="outline"
                        onClick={loadMoreHourlyRates}
                        disabled={loadingMore || isLoading}
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

            {/* New Hourly Rate Modal */}
            <HourlyRateEditModal
                open={newHourlyRateModalOpen}
                onOpenChange={setNewHourlyRateModalOpen}
                onHourlyRateCreated={fetchHourlyRates}
            />

            {/* Edit Hourly Rate Modal */}
            <HourlyRateEditModal
                open={editHourlyRateModalOpen}
                onOpenChange={setEditHourlyRateModalOpen}
                onHourlyRateCreated={fetchHourlyRates}
                hourlyRate={hourlyRateToEdit}
                mode="update"
            />

            <HourlyRateDeleteModal
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
        </>
    );
};

export default HourlyRatesPage;

