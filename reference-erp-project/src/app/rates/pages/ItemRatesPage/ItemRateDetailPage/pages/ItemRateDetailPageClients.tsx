import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SearchBar from "@/app/components/search-bar";
import { getOrgRateClients, deleteOrgRateClient } from "@/api/orgs/rates/clients/clients";
import { RateClient } from "@/types/general/rates";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import ItemRateClientsTable from "../components/item-rate-clients-table";
import ItemRateClientDeleteModal from "../components/item-rate-client-delete-modal";

interface ItemRateDetailPageClientsProps {
    onAddClientClick?: () => void;
}

export interface ItemRateDetailPageClientsRef {
    refreshClients: () => void;
}

const ItemRateDetailPageClients = forwardRef<ItemRateDetailPageClientsRef, ItemRateDetailPageClientsProps>(
    ({ onAddClientClick }, ref) => {
        const { t } = useTranslation();
        const { orgId, rateId } = useParams();
        const [clients, setClients] = useState<RateClient[]>([]);
        const [searchQuery, setSearchQuery] = useState("");
        const [isLoading, setIsLoading] = useState(false);
        const [isSearching, setIsSearching] = useState(false);
        const [deleteModalOpen, setDeleteModalOpen] = useState(false);
        const [clientToDelete, setClientToDelete] = useState<RateClient | null>(null);
        const [deletingClient, setDeletingClient] = useState(false);
        const [nextPageToken, setNextPageToken] = useState<string | null>(null);
        const [loadingMore, setLoadingMore] = useState(false);

        const fetchClients = async (query: string = "") => {
            if (!orgId || !rateId) return;

            query ? setIsSearching(true) : setIsLoading(true);

            try {
                const response = await getOrgRateClients(orgId, rateId, query || undefined);

                if (response.success) {
                    setClients(response.success.clients || []);
                    setNextPageToken(response.success.next_page_token ?? null);
                } else {
                    toast.error(t("rates.clients.error", "Error fetching rate clients"));
                    setClients([]);
                }
            } catch (error) {
                console.error("Error fetching rate clients:", error);
                toast.error(t("rates.clients.error", "Error fetching rate clients"));
                setClients([]);
            } finally {
                setIsSearching(false);
                setIsLoading(false);
            }
        };

        const loadMoreClients = async () => {
            if (!orgId || !rateId || !nextPageToken || loadingMore || isLoading) return;

            setLoadingMore(true);
            try {
                const response = await getOrgRateClients(
                    orgId,
                    rateId,
                    searchQuery || undefined,
                    nextPageToken
                );
                if (response.success) {
                    setClients((prev) => [...prev, ...(response.success.clients || [])]);
                    setNextPageToken(response.success.next_page_token ?? null);
                } else {
                    toast.error(t("rates.clients.error", "Error fetching rate clients"));
                }
            } catch (error) {
                console.error("Error loading more rate clients:", error);
                toast.error(t("rates.clients.error", "Error fetching rate clients"));
            } finally {
                setLoadingMore(false);
            }
        };

        useEffect(() => {
            if (orgId && rateId) {
                fetchClients("");
            }
        }, [orgId, rateId]);

        useImperativeHandle(ref, () => ({
            refreshClients: () => fetchClients(""),
        }));

        const handleDeleteConfirm = (client: RateClient) => {
            setClientToDelete(client);
            setDeleteModalOpen(true);
        };

        const handleDeleteClient = async () => {
            if (!clientToDelete || !orgId || !rateId) return;

            setDeletingClient(true);
            try {
                const response = await deleteOrgRateClient(orgId, rateId, clientToDelete.id);
                if (response?.success) {
                    toast.success(t("rates.clients.clientDeleted", "Client removed from rate successfully"));
                    setClients((prev) =>
                        prev.filter((c) => c.id !== clientToDelete.id)
                    );
                } else {
                    toast.error(
                        t("rates.clients.errorDeletingClient", "Error removing client from rate")
                    );
                }
            } catch (error) {
                toast.error(
                    t("rates.clients.errorDeletingClient", "Error removing client from rate")
                );
            } finally {
                setDeletingClient(false);
                setDeleteModalOpen(false);
                setClientToDelete(null);
            }
        };

        const renderTableActions = (client: RateClient) => (
            <CustomActionsDropdown
                items={[
                    {
                        label: t("common.delete", "Delete"),
                        icon: "trash-2",
                        onClick: () => handleDeleteConfirm(client),
                        variant: "destructive",
                    },
                ]}
            />
        );

        return (
            <div className="flex flex-col gap-6">
                <div className="flex gap-4 w-full">
                    <SearchBar
                        isLoading={isSearching}
                        onChange={(query) => setSearchQuery(query)}
                        onSearch={(query) => fetchClients(query)}
                        placeholder={t(
                            "rates.clients.searchPlaceholder",
                            "Search clients in this rate..."
                        )}
                        className="w-full"
                    />
                    <Button onClick={onAddClientClick}>
                        <Plus className="h-4 w-4" />
                        {t("rates.clients.addClient", "Add client")}
                    </Button>
                </div>

                <ItemRateClientsTable
                    clients={clients}
                    isLoading={isLoading}
                    searchQuery={searchQuery}
                    onAddClient={onAddClientClick}
                    renderActions={renderTableActions}
                />

                {nextPageToken && (
                    <div className="flex justify-center">
                        <Button
                            variant="outline"
                            onClick={loadMoreClients}
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

                <ItemRateClientDeleteModal
                    open={deleteModalOpen}
                    onOpenChange={(open) => {
                        setDeleteModalOpen(open);
                        if (!open) setClientToDelete(null);
                    }}
                    client={clientToDelete}
                    onConfirm={handleDeleteClient}
                    isDeleting={deletingClient}
                />
            </div>
        );
    }
);

export default ItemRateDetailPageClients;
