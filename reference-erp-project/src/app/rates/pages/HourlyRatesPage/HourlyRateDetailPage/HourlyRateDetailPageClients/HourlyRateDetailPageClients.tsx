import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SearchBar from "@/app/components/search-bar";
import { getOrgHourlyRateClients, deleteOrgHourlyRateClient } from '@/api/orgs/hourly-rates/clients/clients';
import { RateClient } from "@/types/general/rates";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import HourlyRateClientsTable from "./components/hourly-rate-clients-table";
import HourlyRateClientDeleteModal from "./components/hourly-rate-client-delete-modal";

interface HourlyRateDetailPageClientsProps {
    onAddClientClick?: () => void;
}

export interface HourlyRateDetailPageClientsRef {
    refreshClients: () => void;
}

const HourlyRateDetailPageClients = forwardRef<HourlyRateDetailPageClientsRef, HourlyRateDetailPageClientsProps>(({ onAddClientClick }, ref) => {
    const { t } = useTranslation();
    const { orgId, hourlyRateId } = useParams();
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
        if (!orgId || !hourlyRateId) return;

        query ? setIsSearching(true) : setIsLoading(true);

        try {
            const response = await getOrgHourlyRateClients(orgId, hourlyRateId, query || undefined);

            if (response.success) {
                setClients(response.success.clients || []);
                setNextPageToken(response.success.next_page_token ?? null);
            } else {
                toast.error(
                    t(
                        "hourlyRates.clients.error",
                        "Error fetching hourly rate clients"
                    )
                );
                setClients([]);
            }
        } catch (error) {
            console.error("Error fetching hourly rate clients:", error);
            toast.error(
                t(
                    "hourlyRates.clients.error",
                    "Error fetching hourly rate clients"
                )
            );
            setClients([]);
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    const loadMoreClients = async () => {
        if (!orgId || !hourlyRateId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getOrgHourlyRateClients(orgId, hourlyRateId, searchQuery || undefined, nextPageToken);
            if (response.success) {
                setClients((prev) => [...prev, ...(response.success.clients || [])]);
                setNextPageToken(response.success.next_page_token ?? null);
            } else {
                toast.error(t("hourlyRates.clients.error", "Error fetching hourly rate clients"));
            }
        } catch (error) {
            console.error("Error loading more hourly rate clients:", error);
            toast.error(t("hourlyRates.clients.error", "Error fetching hourly rate clients"));
        } finally {
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        if (orgId && hourlyRateId) {
            fetchClients("");
        }
    }, [orgId, hourlyRateId]);

    // Expose refresh function to parent component
    useImperativeHandle(ref, () => ({
        refreshClients: () => fetchClients("")
    }));

    // Handle delete confirmation
    const handleDeleteConfirm = (client: RateClient) => {
        setClientToDelete(client);
        setDeleteModalOpen(true);
    };

    // Handle delete execution
    const handleDeleteClient = async () => {
        if (!clientToDelete || !orgId || !hourlyRateId) return;

        setDeletingClient(true);
        try {
            const response = await deleteOrgHourlyRateClient(orgId, hourlyRateId, clientToDelete.id);
            if (response?.success) {
                toast.success(t("hourlyRates.clients.clientDeleted", "Client removed from hourly rate successfully"));
                setClients(prev => prev.filter(c => c.id !== clientToDelete.id));
            } else {
                toast.error(t("hourlyRates.clients.errorDeletingClient", "Error removing client from hourly rate"));
            }
        } catch (error) {
            toast.error(t("hourlyRates.clients.errorDeletingClient", "Error removing client from hourly rate"));
        } finally {
            setDeletingClient(false);
            setDeleteModalOpen(false);
            setClientToDelete(null);
        }
    };

    const renderActions = (client: RateClient) => (
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
                        "hourlyRates.clients.searchPlaceholder",
                        "Search clients in this hourly rate..."
                    )}
                    className="w-full"
                />
                <Button onClick={onAddClientClick}>
                    <Plus className="h-4 w-4" />
                    {t("hourlyRates.clients.addClient", "Add client")}
                </Button>
            </div>

            <HourlyRateClientsTable
                clients={clients}
                isLoading={isLoading}
                searchQuery={searchQuery}
                onAddClient={onAddClientClick}
                renderActions={renderActions}
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

            <HourlyRateClientDeleteModal
                open={deleteModalOpen}
                onOpenChange={(open) => {
                    setDeleteModalOpen(open);
                    if (!open) {
                        setClientToDelete(null);
                    }
                }}
                client={clientToDelete}
                onConfirm={handleDeleteClient}
                isDeleting={deletingClient}
            />
        </div>
    );
});

export default HourlyRateDetailPageClients;

