import { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { useParams } from "react-router-dom";
import { useClient } from "@/app/dashboard/contexts/DashboardClientContext";
import { toast } from "sonner";
import { Loader2, MapPin, Plus, Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Tag from "@/app/components/tag/tag";
import IdBadge from "@/app/components/id-badge";
import SearchBar from "@/app/components/search-bar";
import CurrencyLabel from "@/app/components/labels/currency-label";
import PageHeader from "@/app/components/page-header";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { getClientCommutingRateLocations } from "@/api/clients/commuting-rates/commuting-rates";
import { deleteClientCommutingRate } from "@/api/clients/commuting-rates/commuting-rates";
import { Location } from "@/types/general/location";
import type { CommutingRate } from "@/types/general/commuting-rates";
import { formatDate } from "@/utils/miscelanea";
import CommutingRateLocationsTable from "./client-commuting-rate-locations-table";
import ClientCommutingRatesAddModal from "./client-commuting-rates-add-modal";

interface ClientCommutingRateViewModalProps {
    commutingRate: CommutingRate | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onNavigateToCommutingRate?: (commutingRateId: string) => void;
    onCommutingRateDeleted?: () => void;
}

export interface ClientCommutingRateViewModalRef {
    refreshLocations: () => void;
}

const ClientCommutingRateViewModal = forwardRef<ClientCommutingRateViewModalRef, ClientCommutingRateViewModalProps>(({
    commutingRate,
    open,
    onOpenChange,
    onNavigateToCommutingRate,
    onCommutingRateDeleted,
}, ref) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const { client } = useClient();
    const clientId = client?.id ?? "";
    const [locations, setLocations] = useState<Location[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [addLocationModalOpen, setAddLocationModalOpen] = useState(false);

    const fetchLocations = useCallback(async (query: string = "") => {
        if (!orgId || !clientId || !commutingRate?.id) return;

        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }

        try {
            const response = await getClientCommutingRateLocations(
                orgId,
                clientId,
                commutingRate.id,
                query || null,
                null
            );

            if (response.success) {
                const fetchedLocations = response.success.locations || [];
                setLocations(fetchedLocations);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("clients.commutingRates.errorFetchingLocations", "Error fetching locations"));
            }
        } catch (error) {
            console.error("Error fetching commuting rate locations:", error);
            toast.error(t("clients.commutingRates.errorFetchingLocations", "Error fetching locations"));
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    }, [orgId, clientId, commutingRate?.id, t]);

    const loadMoreLocations = useCallback(async () => {
        if (!orgId || !clientId || !commutingRate?.id || !nextPageToken || isLoadingMore || isLoading) return;

        setIsLoadingMore(true);
        try {
            const response = await getClientCommutingRateLocations(
                orgId,
                clientId,
                commutingRate.id,
                searchQuery || null,
                nextPageToken
            );
            if (response.success && response.success.locations) {
                setLocations((prev) => [...prev, ...response.success.locations]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("clients.commutingRates.errorFetchingLocations", "Error fetching locations"));
            }
        } catch (error) {
            toast.error(t("clients.commutingRates.errorFetchingLocations", "Error fetching locations"));
        } finally {
            setIsLoadingMore(false);
        }
    }, [orgId, clientId, commutingRate?.id, nextPageToken, isLoadingMore, isLoading, searchQuery, t]);

    useEffect(() => {
        if (open && commutingRate?.id) {
            fetchLocations();
        } else {
            setLocations([]);
            setSearchQuery("");
            setNextPageToken(null);
        }
    }, [open, commutingRate?.id, fetchLocations]);

    useImperativeHandle(ref, () => ({
        refreshLocations: () => fetchLocations(searchQuery),
    }), [fetchLocations, searchQuery]);

    const handleDeleteCommutingRate = useCallback(async () => {
        if (!orgId || !clientId || !commutingRate?.id) return;

        try {
            const response = await deleteClientCommutingRate(orgId, clientId, commutingRate.id);
            if (response?.success) {
                toast.success(t("clients.commutingRates.commutingRateDeleted", "Commuting rate removed from client successfully"));
                onOpenChange(false);
                onCommutingRateDeleted?.();
            } else {
                toast.error(t("clients.commutingRates.errorDeletingCommutingRate", "Error removing commuting rate from client"));
            }
        } catch (error) {
            toast.error(t("clients.commutingRates.errorDeletingCommutingRate", "Error removing commuting rate from client"));
        }
    }, [orgId, clientId, commutingRate?.id, t, onOpenChange, onCommutingRateDeleted]);

    const renderLocationActions = useCallback((location: Location) => {
        return (
            <CustomActionsDropdown
                items={[
                    {
                        label: t("common.delete", "Delete"),
                        icon: "trash-2",
                        onClick: () => {
                            if (!orgId || !clientId || !commutingRate?.id) return;
                            deleteClientCommutingRate(orgId, clientId, commutingRate.id, {
                                location_ids: [location.id],
                            }).then((response) => {
                                if (response?.success) {
                                    toast.success(t("clients.commutingRates.locationRemoved", "Location removed from commuting rate"));
                                    setLocations((prev) => prev.filter((l) => l.id !== location.id));
                                } else {
                                    toast.error(t("clients.commutingRates.errorRemovingLocation", "Error removing location"));
                                }
                            }).catch(() => {
                                toast.error(t("clients.commutingRates.errorRemovingLocation", "Error removing location"));
                            });
                        },
                        variant: "destructive",
                    },
                ]}
            />
        );
    }, [orgId, clientId, commutingRate?.id, t]);

    if (!commutingRate) return null;

    return (
    <>
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="min-h-[70vh] max-h-[70vh] w-full md:max-w-5xl flex flex-col" showCloseButton={false}>
                <DialogHeader>
                    <div className="flex items-start gap-2">
                        <DialogTitle className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-2">
                                {commutingRate.name}
                            </div>
                            {commutingRate.description && (
                                <p className="text-sm text-muted-foreground font-normal">
                                    {commutingRate.description}
                                </p>
                            )}
                        </DialogTitle>
                        <div className="flex items-center gap-2 ml-auto">
                            <Tag text={commutingRate.status} className="capitalize" />
                            <IdBadge id={commutingRate.id} />
                        </div>
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("common.view", "View"),
                                    icon: "external-link",
                                    onClick: () => {
                                        onNavigateToCommutingRate?.(commutingRate.id);
                                        onOpenChange(false);
                                    },
                                },
                                {
                                    label: t("common.delete", "Delete"),
                                    icon: "trash-2",
                                    onClick: handleDeleteCommutingRate,
                                    variant: "destructive",
                                },
                            ]}
                        />
                    </div>
                </DialogHeader>

                <div className="space-y-4 overflow-y-auto max-h-[70vh] px-2 scrollbar-hide">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <h4 className="font-medium text-sm">{t("commutingRates.validFrom", "Valid From")}</h4>
                            <p className="text-sm text-muted-foreground">
                                {commutingRate.valid_from
                                    ? formatDate(commutingRate.valid_from, { showTime: true, showSeconds: false })
                                    : "-"}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-medium text-sm">{t("commutingRates.dueDate", "Due Date")}</h4>
                            <p className="text-sm text-muted-foreground">
                                {commutingRate.due_date
                                    ? formatDate(commutingRate.due_date, { showTime: true, showSeconds: false })
                                    : "-"}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-medium text-sm">{t("commutingRates.fixedPrice", "Fixed Price")}</h4>
                            {commutingRate.is_fixed_price ? (
                                <CurrencyLabel data={commutingRate.fixed_price ?? 0} />
                            ) : (
                                <span className="text-sm text-muted-foreground">{t("common.disabled", "Disabled")}</span>
                            )}
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-medium text-sm">{t("commutingRates.pricePerKm", "Price / km")}</h4>
                            {commutingRate.is_price_per_km ? (
                                <div className="flex items-center gap-1.5 text-sm">
                                    <CurrencyLabel data={commutingRate.price_per_km ?? 0} />
                                    <span className="text-muted-foreground">/km</span>
                                    {commutingRate.min_price != null && commutingRate.min_price > 0 && (
                                        <span className="text-muted-foreground">
                                            (min. <CurrencyLabel data={commutingRate.min_price} />)
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <span className="text-sm text-muted-foreground">{t("common.disabled", "Disabled")}</span>
                            )}
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-medium text-sm">{t("commutingRates.travelTimeBillable", "Travel Time")}</h4>
                            <div className="flex items-center gap-1.5 text-sm">
                                {commutingRate.is_travel_time_billable ? (
                                    <>
                                        <Check className="h-3.5 w-3.5 text-green-500" />
                                        <span>{t("commutingRates.billable", "Billable")}</span>
                                    </>
                                ) : (
                                    <>
                                        <X className="h-3.5 w-3.5 text-red-500" />
                                        <span>{t("common.disabled", "Disabled")}</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-medium text-sm">{t("commutingRates.numberOfLocations", "Locations")}</h4>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span className="text-sm">{commutingRate.number_of_locations}</span>
                            </div>
                        </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-4">
                        <PageHeader
                            title={t("clients.commutingRates.locations", "Locations")}
                            showBackButton={false}
                            action={
                                <Button onClick={() => setAddLocationModalOpen(true)} size="sm">
                                    <Plus className="h-4 w-4" />
                                    {t("clients.commutingRates.addLocations", "Add Locations")}
                                </Button>
                            }
                        />

                        <SearchBar
                            value={searchQuery}
                            isLoading={isSearching}
                            onChange={(query) => setSearchQuery(query)}
                            onSearch={fetchLocations}
                            placeholder={t("clients.commutingRates.searchLocationsPlaceholder", "Search locations...")}
                            className="w-full"
                        />

                        <CommutingRateLocationsTable
                            locations={locations}
                            isLoading={isLoading}
                            searchQuery={searchQuery}
                            renderActions={renderLocationActions}
                            onAddLocation={() => setAddLocationModalOpen(true)}
                        />

                        {nextPageToken && (
                            <div className="flex justify-center mt-4">
                                <Button
                                    variant="outline"
                                    onClick={loadMoreLocations}
                                    disabled={isLoadingMore}
                                    size="sm"
                                >
                                    {isLoadingMore ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {t("common.loading", "Loading...")}
                                        </>
                                    ) : (
                                        t("common.loadMore", "Load more")
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        {orgId && clientId && commutingRate && (
            <ClientCommutingRatesAddModal
                open={addLocationModalOpen}
                onOpenChange={setAddLocationModalOpen}
                onCommutingRatesAdded={() => fetchLocations(searchQuery)}
                orgId={orgId}
                clientId={clientId}
                preselectedCommutingRate={{ id: commutingRate.id, name: commutingRate.name }}
            />
        )}
    </>
    );
});

ClientCommutingRateViewModal.displayName = "ClientCommutingRateViewModal";

export default ClientCommutingRateViewModal;
