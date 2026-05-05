import { useCommutingRate } from "@/app/rates/contexts/CommutingRateContext";
import PageHeader from "@/app/components/page-header";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import IdBadge from "@/app/components/id-badge";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import Tag from "@/app/components/tag/tag";
import SearchBar from "@/app/components/search-bar";
import { formatDate } from "@/utils/miscelanea";
import { deleteOrgCommutingRate } from "@/api/orgs/commuting-rates/commuting-rates";
import {
    getOrgCommutingRateClients,
    deleteOrgCommutingRateClient,
} from "@/api/orgs/commuting-rates/clients/clients";
import { CommutingRateClient } from "@/types/general/commuting-rates";
import CommutingRateEditModal from "../components/commuting-rate-edit-modal";
import CommutingRateInfoCard from "./components/commuting-rate-info-card";
import CommutingRateClientsTable from "./components/commuting-rate-clients-table";
import CommutingRateClientsAddModal from "./components/commuting-rate-clients-add-modal";
import CommutingRateClientDeleteModal from "./components/commuting-rate-client-delete-modal";
import { useEffect } from "react";

const CommutingRateDetailPage = () => {
    const { commutingRate, refreshCommutingRate } = useCommutingRate();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingRate, setDeletingRate] = useState(false);
    const [addClientsModalOpen, setAddClientsModalOpen] = useState(false);

    const [clients, setClients] = useState<CommutingRateClient[]>([]);
    const [isLoadingClients, setIsLoadingClients] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);

    const [clientDeleteModalOpen, setClientDeleteModalOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<CommutingRateClient | null>(null);
    const [deletingClient, setDeletingClient] = useState(false);

    const fetchClients = async (query: string = "") => {
        if (!orgId || !commutingRate.id) return;

        query ? setIsSearching(true) : setIsLoadingClients(true);
        try {
            const response = await getOrgCommutingRateClients(
                orgId,
                commutingRate.id,
                query || undefined
            );
            if (response.success) {
                setClients(response.success.clients || []);
                setNextPageToken(response.success.next_page_token ?? null);
            } else {
                toast.error(
                    t("commutingRates.clients.error", "Error fetching clients")
                );
                setClients([]);
            }
        } catch (error) {
            console.error("Error fetching commuting rate clients:", error);
            toast.error(
                t("commutingRates.clients.error", "Error fetching clients")
            );
            setClients([]);
        } finally {
            setIsSearching(false);
            setIsLoadingClients(false);
        }
    };

    useEffect(() => {
        if (orgId && commutingRate.id) {
            fetchClients("");
        }
    }, [orgId, commutingRate.id]);

    const handleDeleteRateConfirm = () => {
        setDeleteModalOpen(true);
    };

    const handleDeleteRate = async () => {
        if (!commutingRate?.id || !orgId) return;

        setDeletingRate(true);
        try {
            const response = await deleteOrgCommutingRate(orgId, commutingRate.id);
            if (response.success !== undefined) {
                toast.success(
                    t("commutingRates.deleted", "Commuting rate deleted")
                );
                navigate(`/${orgId}/rates`);
            } else {
                toast.error(
                    t("commutingRates.deleteError", "Error deleting commuting rate")
                );
            }
        } catch {
            toast.error(
                t("commutingRates.deleteError", "Error deleting commuting rate")
            );
        } finally {
            setDeletingRate(false);
            setDeleteModalOpen(false);
        }
    };

    const handleRateUpdated = () => {
        refreshCommutingRate();
    };

    const handleDeleteClientConfirm = (client: CommutingRateClient) => {
        setClientToDelete(client);
        setClientDeleteModalOpen(true);
    };

    const handleDeleteClient = async () => {
        if (!clientToDelete || !orgId || !commutingRate.id) return;

        setDeletingClient(true);
        try {
            const response = await deleteOrgCommutingRateClient(
                orgId,
                commutingRate.id,
                { client_ids: [clientToDelete.client.id] }
            );
            if (response?.success !== undefined) {
                toast.success(
                    t(
                        "commutingRates.clients.clientDeleted",
                        "Client removed from commuting rate"
                    )
                );
                setClients((prev) =>
                    prev.filter((c) => c.client.id !== clientToDelete.client.id)
                );
            } else {
                toast.error(
                    t(
                        "commutingRates.clients.errorDeletingClient",
                        "Error removing client"
                    )
                );
            }
        } catch {
            toast.error(
                t(
                    "commutingRates.clients.errorDeletingClient",
                    "Error removing client"
                )
            );
        } finally {
            setDeletingClient(false);
            setClientDeleteModalOpen(false);
            setClientToDelete(null);
        }
    };

    const renderClientActions = (client: CommutingRateClient) => (
        <CustomActionsDropdown
            items={[
                {
                    label: t("common.delete", "Delete"),
                    icon: "trash-2",
                    onClick: () => handleDeleteClientConfirm(client),
                    variant: "destructive",
                },
            ]}
        />
    );

    return (
        <>
            <PageHeader
                title={commutingRate.name}
                description={
                    (commutingRate.valid_from
                        ? t("commutingRates.validFrom", "Valid From") +
                          ": " +
                          formatDate(commutingRate.valid_from)
                        : "") +
                    (commutingRate.due_date
                        ? " — " +
                          t("commutingRates.validTo", "Valid To") +
                          ": " +
                          formatDate(commutingRate.due_date)
                        : "")
                }
                showBackButton={true}
                action={
                    <div className="flex items-center gap-2">
                        <Tag
                            text={commutingRate.status}
                            className="capitalize"
                        />
                        <IdBadge
                            id={commutingRate.id}
                            className="h-6 px-4 text-xs"
                        />
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("common.actions.edit", "Edit"),
                                    icon: "edit",
                                    onClick: () => setEditModalOpen(true),
                                },
                                {
                                    label: t("common.actions.delete", "Delete"),
                                    icon: "trash-2",
                                    onClick: handleDeleteRateConfirm,
                                    variant: "destructive",
                                },
                            ]}
                        />
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 flex flex-col gap-4">
                    <CommutingRateInfoCard onEdit={() => setEditModalOpen(true)} />
                </div>
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="flex gap-4 w-full">
                        <SearchBar
                            isLoading={isSearching}
                            onChange={(query) => setSearchQuery(query)}
                            onSearch={(query) => fetchClients(query)}
                            placeholder={t(
                                "commutingRates.clients.searchPlaceholder",
                                "Search clients..."
                            )}
                            className="w-full"
                        />
                        <Button onClick={() => setAddClientsModalOpen(true)}>
                            <Plus className="h-4 w-4" />
                            {t("commutingRates.clients.addClient", "Add client")}
                        </Button>
                    </div>

                    <CommutingRateClientsTable
                        clients={clients}
                        isLoading={isLoadingClients}
                        searchQuery={searchQuery}
                        onAddClient={() => setAddClientsModalOpen(true)}
                        renderActions={renderClientActions}
                    />

                    {nextPageToken && (
                        <div className="flex justify-center">
                            <Button
                                variant="outline"
                                onClick={async () => {
                                    if (!orgId || !commutingRate.id || !nextPageToken) return;
                                    try {
                                        const response = await getOrgCommutingRateClients(
                                            orgId,
                                            commutingRate.id,
                                            searchQuery || undefined,
                                            nextPageToken
                                        );
                                        if (response.success) {
                                            setClients((prev) => [
                                                ...prev,
                                                ...(response.success.clients || []),
                                            ]);
                                            setNextPageToken(
                                                response.success.next_page_token ?? null
                                            );
                                        }
                                    } catch {
                                        toast.error(
                                            t(
                                                "commutingRates.clients.error",
                                                "Error fetching clients"
                                            )
                                        );
                                    }
                                }}
                                className="min-w-32"
                            >
                                {t("common.loadMore", "Load More")}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <CommutingRateEditModal
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
                onSuccess={handleRateUpdated}
                commutingRate={commutingRate}
                mode="update"
            />

            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent showCloseButton={false}                                                                                                                                      >
                    <DialogHeader>
                        <DialogTitle>
                            {t("commutingRates.deleteRate", "Delete Commuting Rate")}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                "commutingRates.deleteRateDescription",
                                'Are you sure you want to delete "{{name}}"? This action cannot be undone.',
                                { name: commutingRate.name }
                            )}
                            <div className="mt-2 p-2 bg-muted rounded">
                                <strong>{commutingRate.name}</strong>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteModalOpen(false)}
                            disabled={deletingRate}
                        >
                            {t("common.cancel", "Cancel")}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteRate}
                            disabled={deletingRate}
                        >
                            {deletingRate ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {t("common.deleting", "Deleting...")}
                                </>
                            ) : (
                                t("common.delete", "Delete")
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {orgId && commutingRate.id && (
                <CommutingRateClientsAddModal
                    open={addClientsModalOpen}
                    onOpenChange={setAddClientsModalOpen}
                    onClientsAdded={() => fetchClients(searchQuery)}
                    orgId={orgId}
                    commutingRateId={commutingRate.id}
                />
            )}

            <CommutingRateClientDeleteModal
                open={clientDeleteModalOpen}
                onOpenChange={(open) => {
                    setClientDeleteModalOpen(open);
                    if (!open) setClientToDelete(null);
                }}
                client={clientToDelete}
                onConfirm={handleDeleteClient}
                isDeleting={deletingClient}
            />
        </>
    );
};

export default CommutingRateDetailPage;
