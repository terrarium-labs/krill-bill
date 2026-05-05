import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import SearchBar from "@/app/components/search-bar";
import { toast } from "sonner";
import { CommutingRate } from "@/types/general/commuting-rates";
import { getOrgCommutingRates, deleteOrgCommutingRate } from "@/api/orgs/commuting-rates/commuting-rates";
import CommutingRatesTable from "./components/commuting-rates-table";
import CommutingRateEditModal from "./components/commuting-rate-edit-modal";
import CommutingRateDeleteModal from "./components/commuting-rate-delete-modal";
import { useCommutingRatesTablePreferences } from "@/hooks/use-commuting-rates-table-preferences";
import { CommutingRateColumnSelector } from "./components/commuting-rate-column-selector";

const CommutingRatesPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();

    const [commutingRates, setCommutingRates] = useState<CommutingRate[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    const [newModalOpen, setNewModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [rateToEdit, setRateToEdit] = useState<CommutingRate | null>(null);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [rateToDelete, setRateToDelete] = useState<CommutingRate | null>(null);
    const [deletingRate, setDeletingRate] = useState(false);

    // Column preferences persisted in localStorage
    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = useCommutingRatesTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) =>
            setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback(
        (order: string[]) => setColumnOrder(order),
        [setColumnOrder],
    );

    // ─── Fetch ────────────────────────────────────────────────────────────────

    const fetchCommutingRates = async (query: string = "") => {
        if (!orgId) return;
        query ? setIsSearching(true) : setIsLoading(true);
        try {
            const response = await getOrgCommutingRates(orgId, query || undefined);
            if (response.success?.commuting_rates) {
                setCommutingRates(response.success.commuting_rates);
                setNextPageToken(response.success.next_page_token ?? null);
            } else {
                toast.error(t("commutingRates.errorFetching", "Error fetching commuting rates"));
            }
        } catch {
            toast.error(t("commutingRates.errorFetching", "Error fetching commuting rates"));
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCommutingRates();
    }, []);

    const loadMoreRates = async () => {
        if (!orgId || !nextPageToken || loadingMore || isLoading) return;
        setLoadingMore(true);
        try {
            const response = await getOrgCommutingRates(orgId, searchQuery || undefined, nextPageToken);
            if (response.success?.commuting_rates) {
                setCommutingRates((prev) => [...prev, ...response.success.commuting_rates]);
                setNextPageToken(response.success.next_page_token ?? null);
            }
        } catch {
            toast.error(t("commutingRates.errorFetching", "Error fetching commuting rates"));
        } finally {
            setLoadingMore(false);
        }
    };

    // ─── Delete ───────────────────────────────────────────────────────────────

    const handleDeleteConfirm = (rate: CommutingRate) => {
        setRateToDelete(rate);
        setDeleteModalOpen(true);
    };

    const handleDeleteRate = async () => {
        if (!rateToDelete || !orgId) return;
        setDeletingRate(true);
        try {
            const response = await deleteOrgCommutingRate(orgId, rateToDelete.id);
            if (response.success !== undefined) {
                toast.success(t("commutingRates.deleted", "Commuting rate deleted"));
                setCommutingRates((prev) => prev.filter((r) => r.id !== rateToDelete.id));
            } else {
                toast.error(t("commutingRates.deleteError", "Error deleting commuting rate"));
            }
        } catch {
            toast.error(t("commutingRates.deleteError", "Error deleting commuting rate"));
        } finally {
            setDeletingRate(false);
            setDeleteModalOpen(false);
            setRateToDelete(null);
        }
    };

    // ─── Navigation ───────────────────────────────────────────────────────────

    const handleViewRate = (id: string) => {
        navigate(`/${orgId}/commuting-rates/${id}`);
    };

    // ─── Row actions ──────────────────────────────────────────────────────────

    const renderActions = (rate: CommutingRate) => (
        <CustomActionsDropdown
            items={[
                {
                    label: t("common.edit", "Edit"),
                    icon: "edit",
                    onClick: () => {
                        setRateToEdit(rate);
                        setEditModalOpen(true);
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

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <>
            <div className="flex items-center gap-2 mt-4">
                <SearchBar
                    value={searchQuery}
                    isLoading={isSearching}
                    onChange={(query: string) => setSearchQuery(query)}
                    onSearch={fetchCommutingRates}
                    className="w-full"
                    placeholder={t("commutingRates.searchPlaceholder", "Search commuting rates...")}
                />
                <CommutingRateColumnSelector
                    columnVisibility={columnVisibility}
                    columnOrder={columnOrder}
                    onColumnVisibilityChange={handleColumnVisibilityChange}
                    onColumnOrderChange={handleColumnOrderChange}
                    onReset={resetPreferences}
                />
                <Button onClick={() => setNewModalOpen(true)}>
                    <Plus className="h-4 w-4" />
                    {t("commutingRates.addRate", "Add Commuting Rate")}
                </Button>
            </div>

            <CommutingRatesTable
                commutingRates={commutingRates}
                isLoading={isLoading}
                searchQuery={searchQuery}
                onViewCommutingRate={handleViewRate}
                onAddCommutingRate={() => setNewModalOpen(true)}
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

            <CommutingRateEditModal
                open={newModalOpen}
                onOpenChange={setNewModalOpen}
                onSuccess={fetchCommutingRates}
            />

            <CommutingRateEditModal
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
                onSuccess={fetchCommutingRates}
                commutingRate={rateToEdit}
                mode="update"
            />

            <CommutingRateDeleteModal
                open={deleteModalOpen}
                onOpenChange={(open) => {
                    setDeleteModalOpen(open);
                    if (!open) setRateToDelete(null);
                }}
                commutingRate={rateToDelete}
                onConfirm={handleDeleteRate}
                isDeleting={deletingRate}
            />
        </>
    );
};

export default CommutingRatesPage;
