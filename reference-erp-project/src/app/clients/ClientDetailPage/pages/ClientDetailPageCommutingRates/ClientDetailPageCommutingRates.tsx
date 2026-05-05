import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SearchBar from "@/app/components/search-bar";
import { getClientCommutingRates, deleteClientCommutingRate } from "@/api/clients/commuting-rates/commuting-rates";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import ClientCommutingRatesTable from "./components/client-commuting-rates-table";
import ClientCommutingRateDeleteModal from "./components/client-commuting-rate-delete-modal";
import ClientCommutingRateViewModal, { ClientCommutingRateViewModalRef } from "./components/client-commuting-rate-view-modal";
import type { CommutingRate } from "@/types/general/commuting-rates";

interface ClientDetailPageCommutingRatesProps {
    onAddCommutingRateClick?: () => void;
}

export interface ClientDetailPageCommutingRatesRef {
    refreshCommutingRates: () => void;
}

const ClientDetailPageCommutingRates = forwardRef<
    ClientDetailPageCommutingRatesRef,
    ClientDetailPageCommutingRatesProps
>(({ onAddCommutingRateClick }, ref) => {
    const { t } = useTranslation();
    const { orgId, clientId } = useParams();
    const [commutingRates, setCommutingRates] = useState<CommutingRate[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [commutingRateToDelete, setCommutingRateToDelete] = useState<CommutingRate | null>(null);
    const [deletingCommutingRate, setDeletingCommutingRate] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedCommutingRate, setSelectedCommutingRate] = useState<CommutingRate | null>(null);
    const viewModalRef = useRef<ClientCommutingRateViewModalRef>(null);
    const navigate = useNavigate();

    const fetchCommutingRates = async (query: string = "") => {
        if (!orgId || !clientId) return;

        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }

        try {
            const response = await getClientCommutingRates(orgId, clientId, query || null, null);

            if (response.success) {
                const fetchedRates = response.success.commuting_rates || [];
                setCommutingRates(fetchedRates);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(
                    t(
                        "clients.commutingRates.error",
                        "Error fetching client commuting rates"
                    )
                );
                setCommutingRates([]);
            }
        } catch (error) {
            console.error("Error fetching client commuting rates:", error);
            toast.error(
                t(
                    "clients.commutingRates.error",
                    "Error fetching client commuting rates"
                )
            );
            setCommutingRates([]);
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    const loadMoreCommutingRates = async () => {
        if (!orgId || !clientId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getClientCommutingRates(orgId, clientId, searchQuery || null, nextPageToken);
            if (response.success) {
                const fetchedRates = response.success.commuting_rates || [];
                setCommutingRates((prev) => [...prev, ...fetchedRates]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(
                    t(
                        "clients.commutingRates.error",
                        "Error fetching client commuting rates"
                    )
                );
            }
        } catch (error) {
            console.error("Error loading more commuting rates:", error);
            toast.error(
                t(
                    "clients.commutingRates.error",
                    "Error fetching client commuting rates"
                )
            );
        } finally {
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        if (orgId && clientId) {
            fetchCommutingRates("");
        }
    }, [orgId, clientId]);

    useImperativeHandle(ref, () => ({
        refreshCommutingRates: () => fetchCommutingRates(""),
    }));

    const handleDeleteConfirm = (commutingRate: CommutingRate) => {
        setCommutingRateToDelete(commutingRate);
        setDeleteModalOpen(true);
    };

    const handleDeleteCommutingRate = async () => {
        if (!commutingRateToDelete || !orgId || !clientId) return;

        setDeletingCommutingRate(true);
        try {
            const response = await deleteClientCommutingRate(orgId, clientId, commutingRateToDelete.id);
            if (response?.success) {
                toast.success(
                    t(
                        "clients.commutingRates.commutingRateDeleted",
                        "Commuting rate removed from client successfully"
                    )
                );
                setCommutingRates((prev) => prev.filter((r) => r.id !== commutingRateToDelete.id));
            } else {
                toast.error(
                    t(
                        "clients.commutingRates.errorDeletingCommutingRate",
                        "Error removing commuting rate from client"
                    )
                );
            }
        } catch (error) {
            toast.error(
                t(
                    "clients.commutingRates.errorDeletingCommutingRate",
                    "Error removing commuting rate from client"
                )
            );
        } finally {
            setDeletingCommutingRate(false);
            setDeleteModalOpen(false);
            setCommutingRateToDelete(null);
        }
    };

    const handleNavigateToCommutingRate = (commutingRateId: string) => {
        navigate(`/${orgId}/commuting-rates/${commutingRateId}`);
    };

    const handleRowClick = (commutingRate: CommutingRate) => {
        setSelectedCommutingRate(commutingRate);
        setViewModalOpen(true);
    };

    const handleCommutingRateDeletedFromModal = () => {
        fetchCommutingRates(searchQuery);
    };

    const renderActions = (commutingRate: CommutingRate) => {
        return (
            <CustomActionsDropdown
                items={[
                    {
                        label: t("common.view", "View"),
                        icon: "external-link",
                        onClick: () => handleNavigateToCommutingRate(commutingRate.id),
                    },
                    {
                        label: t("common.delete", "Delete"),
                        icon: "trash-2",
                        onClick: () => handleDeleteConfirm(commutingRate),
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
                    onSearch={(query) => fetchCommutingRates(query)}
                    placeholder={t(
                        "clients.commutingRates.searchPlaceholder",
                        "Search commuting rates for this client..."
                    )}
                    className="w-full"
                />
                <Button onClick={onAddCommutingRateClick}>
                    <Plus className="h-4 w-4" />
                    {t("clients.commutingRates.addCommutingRate", "Add commuting rate")}
                </Button>
            </div>

            <ClientCommutingRatesTable
                commutingRates={commutingRates}
                isLoading={isLoading}
                searchQuery={searchQuery}
                onAddCommutingRate={onAddCommutingRateClick}
                onNavigateToCommutingRate={handleNavigateToCommutingRate}
                onRowClick={handleRowClick}
                renderActions={renderActions}
            />

            {nextPageToken && (
                <div className="flex justify-center mt-6">
                    <Button
                        variant="outline"
                        onClick={loadMoreCommutingRates}
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

            <ClientCommutingRateDeleteModal
                open={deleteModalOpen}
                onOpenChange={(open) => {
                    setDeleteModalOpen(open);
                    if (!open) {
                        setCommutingRateToDelete(null);
                    }
                }}
                commutingRate={commutingRateToDelete ?? null}
                onConfirm={handleDeleteCommutingRate}
                isDeleting={deletingCommutingRate}
            />

            <ClientCommutingRateViewModal
                ref={viewModalRef}
                commutingRate={selectedCommutingRate ?? null}
                open={viewModalOpen}
                onOpenChange={(open) => {
                    setViewModalOpen(open);
                    if (!open) {
                        setSelectedCommutingRate(null);
                    }
                }}
                onNavigateToCommutingRate={handleNavigateToCommutingRate}
                onCommutingRateDeleted={handleCommutingRateDeletedFromModal}
            />
        </div>
    );
});

export default ClientDetailPageCommutingRates;
