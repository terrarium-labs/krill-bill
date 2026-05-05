import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import PageHeader from "@/app/components/page-header";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import SearchBar from "../components/search-bar";
import { getOrgVehicles, deleteOrgVehicle } from "@/api/orgs/vehicles/vehicles";
import { toast } from "sonner";
import VehicleCreateModal from "./components/vehicle-create-modal";
import VehicleEditModal from "./components/vehicle-edit-modal";
import TableFiltersRow from "../components/table-filters/table-filters";
import VehiclesTable from "./components/vehicles-table";
import VehicleDeleteModal from "./components/vehicle-delete-modal";
import { useTableFilters } from "@/hooks/use-table-filters";
import { Vehicle } from "@/types/general/vehicles";
import { useVehiclesTablePreferences } from "@/hooks/use-vehicles-table-preferences";
import { VehicleColumnSelector } from "./components/vehicle-column-selector";

const VehiclesPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(
        null
    );
    const [isDeleting, setIsDeleting] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [newVehicleModalOpen, setNewVehicleModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);

    // Use the table filters hook with session storage and default filters
    const {
        tableFilters,
        setTableFilters,
        hasInitializedFilters,
        setHasInitializedFilters
    } = useTableFilters({
        defaultFilters: "vehicles"
    });

    // Column preferences persisted in localStorage
    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = useVehiclesTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) =>
            setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback(
        (order: string[]) => setColumnOrder(order),
        [setColumnOrder],
    );

    // Fetch vehicles function
    const fetchVehicles = async (query: string = "") => {
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        if (!orgId) return;

        try {
            const response = await getOrgVehicles(
                orgId,
                query || undefined,
                undefined,
                tableFilters || undefined
            );
            if (response.success && response.success.vehicles) {
                setVehicles(response.success.vehicles);
                setNextPageToken(response.success.next_page_token || null);
                // Initialize filters from API response only once, merging with default filters
                if (!hasInitializedFilters && response.success.params) {
                    setTableFilters({
                        ...response.success.params,
                        // Preserve the default filters if they exist
                        filters: tableFilters?.filters || response.success.params.filters,
                    });
                    // Set flag after state update to prevent onFilter from being called during initialization
                    setHasInitializedFilters(true);
                }
            } else {
                toast.error(
                    t("vehicles.errorFetchingVehicles") || "Error fetching vehicles"
                );
            }
        } catch (error) {
            toast.error(
                t("vehicles.errorFetchingVehicles") || "Error fetching vehicles"
            );
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (orgId) {
            fetchVehicles();
        }
    }, [orgId]);


    // Load more vehicles
    const loadMoreVehicles = async () => {
        if (!orgId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getOrgVehicles(
                orgId,
                searchQuery || undefined,
                nextPageToken,
                tableFilters || undefined
            );
            if (response.success && response.success.vehicles) {
                setVehicles((prev) => [...prev, ...response.success.vehicles]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(
                    t("vehicles.errorFetchingVehicles") || "Error fetching vehicles"
                );
            }
        } catch (error) {
            console.error(error);
            toast.error(
                t("vehicles.errorFetchingVehicles") || "Error fetching vehicles"
            );
        } finally {
            setLoadingMore(false);
            setIsLoading(false);
        }
    };

    // Handle delete confirmation
    const handleDeleteConfirm = (vehicle: Vehicle) => {
        setVehicleToDelete(vehicle);
        setDeleteModalOpen(true);
    };

    // Handle delete execution
    const handleDeleteVehicle = async () => {
        if (!vehicleToDelete || !orgId) return;

        setIsDeleting(true);
        try {
            const response = await deleteOrgVehicle(orgId, vehicleToDelete.id);
            if (response.success) {
                toast.success(
                    t("vehicles.vehicleDeleted", "Vehicle deleted successfully")
                );
                // Remove from local state
                setVehicles((prev) =>
                    prev.filter((v) => v.id !== vehicleToDelete.id)
                );
                handleCloseDeleteModal();
            } else {
                toast.error(
                    t("vehicles.errorDeletingVehicle", "Error deleting vehicle")
                );
            }
        } catch (error) {
            toast.error(
                t("vehicles.errorDeletingVehicle", "Error deleting vehicle")
            );
        } finally {
            setIsDeleting(false);
        }
    };

    // Close delete modal
    const handleCloseDeleteModal = () => {
        setDeleteModalOpen(false);
        setVehicleToDelete(null);
    };

    // Navigate to vehicle detail
    const handleViewVehicle = (vehicleId: string) => {
        navigate(`/${orgId}/vehicles/${vehicleId}`);
    };

    const handleEditVehicle = (vehicle: Vehicle) => {
        setVehicleToEdit(vehicle);
        setEditModalOpen(true);
    };

    // Render actions for table
    const renderTableActions = (vehicle: Vehicle) => {
        return (
            <div className="flex justify-center items-center">
                <CustomActionsDropdown
                    items={[
                        {
                            label: t("common.view", "View"),
                            icon: "eye",
                            onClick: () => handleViewVehicle(vehicle.id),
                        },
                        {
                            label: t("common.edit", "Edit"),
                            icon: "edit",
                            onClick: () => handleEditVehicle(vehicle),
                        },
                        {
                            label: t("common.delete", "Delete"),
                            icon: "trash-2",
                            onClick: () => handleDeleteConfirm(vehicle),
                            variant: "destructive",
                        },
                    ]}
                />
            </div>
        );
    };

    return (
        <>
            {/* Header */}
            <PageHeader
                title={t("vehicles.title", "Vehicles")}
                description={t(
                    "vehicles.description",
                    "Manage your organization's vehicles"
                )}
                showBackButton={false}
                action={
                    <div className="flex items-center gap-2">
                        <Button onClick={() => setNewVehicleModalOpen(true)}>
                            <Plus className="h-4 w-4" />
                            {t("vehicles.addVehicle", "Add Vehicle")}
                        </Button>
                    </div>
                }
            />

            <SearchBar
                value={searchQuery}
                isLoading={isSearching}
                onChange={(query) => setSearchQuery(query)}
                onSearch={fetchVehicles}
                placeholder={t("vehicles.searchPlaceholder", "Search vehicles...")}
            />

            {tableFilters && (
                <TableFiltersRow
                    value={tableFilters}
                    onChange={(filters) => setTableFilters(filters)}
                    onFilter={hasInitializedFilters ? (_) => fetchVehicles(searchQuery) : undefined}
                    endSlot={
                        <VehicleColumnSelector
                            columnVisibility={columnVisibility}
                            columnOrder={columnOrder}
                            onColumnVisibilityChange={handleColumnVisibilityChange}
                            onColumnOrderChange={handleColumnOrderChange}
                            onReset={resetPreferences}
                        />
                    }
                />
            )}

            <VehiclesTable
                vehicles={vehicles}
                isLoading={isLoading}
                renderActions={renderTableActions}
                onRowClick={(vehicle) => handleViewVehicle(vehicle.id)}
                clickableRows={true}
                searchQuery={searchQuery}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                columnOrder={columnOrder}
                onColumnOrderChange={setColumnOrder}
                columnSizing={columnSizing}
                onColumnSizingChange={setColumnSizing}
                emptyStateTitle={
                    searchQuery
                        ? t("vehicles.noResultsFound", "No vehicles found")
                        : t("vehicles.noVehiclesTitle", "No vehicles yet")
                }
                emptyStateDescription={
                    searchQuery
                        ? t(
                              "vehicles.noResultsDescription",
                              "No vehicles match your search for '{{searchQuery}}'",
                              { searchQuery }
                          )
                        : t(
                              "vehicles.noVehiclesDescription",
                              "Start by adding your first vehicle"
                          )
                }
                onEmptyStateAction={() => setNewVehicleModalOpen(true)}
                emptyStateActionLabel={t("vehicles.addVehicle", "Add Vehicle")}
            />

            {nextPageToken && (
                <div className="flex justify-center mt-6">
                    <Button
                        variant="outline"
                        onClick={loadMoreVehicles}
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

            <VehicleCreateModal
                open={newVehicleModalOpen}
                onOpenChange={setNewVehicleModalOpen}
                onVehicleCreated={fetchVehicles}
            />

            <VehicleEditModal
                open={editModalOpen}
                onOpenChange={(open) => {
                    setEditModalOpen(open);
                    if (!open) setVehicleToEdit(null);
                }}
                vehicle={vehicleToEdit}
                onSuccess={() => fetchVehicles(searchQuery)}
                renderActions={
                    vehicleToEdit && (
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("common.delete", "Delete"),
                                    icon: "trash-2",
                                    onClick: () => {
                                        setEditModalOpen(false);
                                        setVehicleToDelete(vehicleToEdit);
                                        setVehicleToEdit(null);
                                        setDeleteModalOpen(true);
                                    },
                                    variant: "destructive",
                                },
                            ]}
                        />
                    )
                }
            />

            <VehicleDeleteModal
                isOpen={deleteModalOpen}
                onClose={handleCloseDeleteModal}
                vehicle={vehicleToDelete}
                onConfirm={handleDeleteVehicle}
                isDeleting={isDeleting}
            />
        </>
    );
};

export default VehiclesPage;
