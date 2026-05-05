import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { Rate } from "@/types/general/rates";
import SearchBar from "../../../components/search-bar";
import { getOrgRates, deleteOrgRate } from "@/api/orgs/rates/rates";
import { toast } from "sonner";
import ItemRateEditModal from "./components/item-rate-edit-modal";
import ItemRateDeleteModal from "./components/item-rate-delete-modal";
import ItemRatesTable from "./components/item-rates-table";
import { useItemRatesTablePreferences } from "@/hooks/use-item-rates-table-preferences";
import { ItemRateColumnSelector } from "./components/item-rate-column-selector";

const ItemRatesPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const [rates, setRates] = useState<Rate[]>([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [rateToDelete, setRateToDelete] = useState<Rate | null>(null);
    const [deletingRate, setDeletingRate] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [newRateModalOpen, setNewRateModalOpen] = useState(false);
    const [editRateModalOpen, setEditRateModalOpen] = useState(false);
    const [rateToEdit, setRateToEdit] = useState<Rate | null>(null);

    // Column preferences persisted in localStorage
    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = useItemRatesTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) =>
            setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback(
        (order: string[]) => setColumnOrder(order),
        [setColumnOrder],
    );

    // Fetch rates function
    const fetchRates = async (query: string = "") => {
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        if (!orgId) return;

        try {
            const response = await getOrgRates(orgId, query, undefined);
            if (response.success && response.success.rates) {
                setRates(response.success.rates);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("rates.errorFetchingRates") || "Error fetching rates");
            }
        } catch (error) {
            toast.error(t("rates.errorFetchingRates") || "Error fetching rates");
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchRates();
    }, []);

    // Load more rates
    const loadMoreRates = async () => {
        if (!orgId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getOrgRates(orgId, searchQuery, nextPageToken);
            if (response.success && response.success.rates) {
                setRates(prev => [...prev, ...response.success.rates]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("rates.errorFetchingRates") || "Error fetching rates");
            }
        } catch (error) {
            toast.error(t("rates.errorFetchingRates") || "Error fetching rates");
        } finally {
            setLoadingMore(false);
            setIsLoading(false);
        }
    };

    // Handle delete confirmation
    const handleDeleteConfirm = (rate: Rate) => {
        setRateToDelete(rate);
        setDeleteModalOpen(true);
    };

    // Handle delete execution
    const handleDeleteRate = async () => {
        if (!rateToDelete || !orgId) return;

        setDeletingRate(true);
        try {
            const response = await deleteOrgRate(orgId, rateToDelete.id);
            if (response.success) {
                toast.success(t("rates.rateDeleted", "Rate deleted successfully"));
                // Remove from local state
                setRates(prev => prev.filter(r => r.id !== rateToDelete.id));
            } else {
                toast.error(t("rates.errorDeletingRate", "Error deleting rate"));
            }
        } catch (error) {
            toast.error(t("rates.errorDeletingRate", "Error deleting rate"));
        } finally {
            setDeletingRate(false);
            setDeleteModalOpen(false);
            setRateToDelete(null);
        }
    };

    // Navigate to rate detail
    const handleViewRate = (rateId: string) => {
        navigate(`/${orgId}/rates/${rateId}`);
    };

    const renderActions = (rate: Rate) => (
        <CustomActionsDropdown
            items={[
                {
                    label: t("common.edit", "Edit"),
                    icon: "edit",
                    onClick: () => {
                        setRateToEdit(rate);
                        setEditRateModalOpen(true);
                    },
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
        <>
            <div className="flex items-center gap-2 mt-4">
                <SearchBar
                    value={searchQuery}
                    isLoading={isSearching}
                    onChange={(query: string) => setSearchQuery(query)}
                    onSearch={fetchRates}
                    className="w-full"
                    placeholder={t("rates.searchPlaceholder", "Search rates...")}
                />
                <ItemRateColumnSelector
                    columnVisibility={columnVisibility}
                    columnOrder={columnOrder}
                    onColumnVisibilityChange={handleColumnVisibilityChange}
                    onColumnOrderChange={handleColumnOrderChange}
                    onReset={resetPreferences}
                />
                <Button onClick={() => setNewRateModalOpen(true)}>
                    <Plus className=" h-4 w-4" />
                    {t("rates.addRate", "Add Rate")}
                </Button>
            </div>

            <ItemRatesTable
                rates={rates}
                isLoading={isLoading}
                searchQuery={searchQuery}
                onViewRate={handleViewRate}
                onAddRate={() => setNewRateModalOpen(true)}
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
                        onClick={loadMoreRates}
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

            {/* TODO: Implement New Rate Modal form */}
            <ItemRateEditModal
                open={newRateModalOpen}
                onOpenChange={setNewRateModalOpen}
                onRateCreated={fetchRates}
            />

            {/* TODO: Implement Edit Rate Modal form */}
            <ItemRateEditModal
                open={editRateModalOpen}
                onOpenChange={setEditRateModalOpen}
                onRateCreated={fetchRates}
                rate={rateToEdit}
                mode="update"
                renderActions={
                    rateToEdit
                        ? () => (
                              <CustomActionsDropdown
                                  items={[
                                      {
                                          label: t("common.delete", "Delete"),
                                          icon: "trash-2",
                                          onClick: () => {
                                              setEditRateModalOpen(false);
                                              setRateToDelete(rateToEdit);
                                              setDeleteModalOpen(true);
                                          },
                                          variant: "destructive",
                                      },
                                  ]}
                              />
                          )
                        : undefined
                }
            />

            <ItemRateDeleteModal
                open={deleteModalOpen}
                onOpenChange={(open) => {
                    setDeleteModalOpen(open);
                    if (!open) setRateToDelete(null);
                }}
                rate={rateToDelete}
                onConfirm={handleDeleteRate}
                isDeleting={deletingRate}
            />
        </>
    );
};

export default ItemRatesPage;

