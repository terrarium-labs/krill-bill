import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import PageHeader from "@/app/components/page-header";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import SearchBar from "@/app/components/search-bar";
import { getLocations, deleteLocation } from "@/api/orgs/locations/locations";
import { toast } from "sonner";
import WarehouseEditModal from "@/app/warehouses/components/warehouse-edit-modal";
import WarehouseDeleteModal from "@/app/warehouses/components/warehouse-delete-modal";
import TableFiltersRow from "@/app/components/table-filters/table-filters";
import WarehousesTable from "@/app/warehouses/components/warehouses-table";
import { StockLocation } from "@/types/items/stock";
import { useTableFilters } from "@/hooks/use-table-filters";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { useWarehousesTablePreferences } from "@/hooks/use-warehouses-table-preferences";
import { WarehouseColumnSelector } from "@/app/warehouses/components/warehouse-column-selector";

const WarehousesPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const [locations, setLocations] = useState<StockLocation[]>([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [locationToDelete, setLocationToDelete] = useState<StockLocation | null>(null);
    const [deletingLocation, setDeletingLocation] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Use the table filters hook with session storage (no default filters)
    const { tableFilters, setTableFilters } = useTableFilters();

    // Column preferences persisted in localStorage
    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = useWarehousesTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) =>
            setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback(
        (order: string[]) => setColumnOrder(order),
        [setColumnOrder],
    );

    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<StockLocation | null>(null);
    const [locationModalMode, setLocationModalMode] = useState<'create' | 'update'>('create');

    // Fetch locations function
    const fetchLocations = async (query: string = "") => {
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        if (!orgId) return;

        try {
            const response = await getLocations(orgId, query || undefined, undefined, tableFilters || undefined);
            if (response.success && response.success.locations) {
                setLocations(response.success.locations);
                setNextPageToken(response.success.next_page_token || null);
                if (!tableFilters) {
                    setTableFilters(response.success.params);
                }
            } else {
                toast.error(t("warehouses.errorFetchingWarehouses") || "Error fetching warehouses");
            }
        } catch (error) {
            toast.error(t("warehouses.errorFetchingWarehouses") || "Error fetching warehouses");
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        if (orgId) {
            fetchLocations();
        }
    }, [orgId]);

    // Load more locations
    const loadMoreLocations = async () => {
        if (!orgId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getLocations(orgId, searchQuery || undefined, nextPageToken, tableFilters || undefined);
            if (response.success && response.success.locations) {
                setLocations(prev => [...prev, ...response.success.locations]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("warehouses.errorFetchingWarehouses") || "Error fetching warehouses");
            }
        } catch (error) {
            toast.error(t("warehouses.errorFetchingWarehouses") || "Error fetching warehouses");
        } finally {
            setLoadingMore(false);
            setIsLoading(false);
        }
    };

    // Handle delete confirmation
    const handleDeleteConfirm = (location: StockLocation) => {
        setLocationToDelete(location);
        setDeleteModalOpen(true);
    };

    // Handle delete execution
    const handleDeleteLocation = async () => {
        if (!locationToDelete || !orgId) return;

        setDeletingLocation(true);
        try {
            const response = await deleteLocation(orgId, locationToDelete.id);
            if (response.success) {
                toast.success(t("warehouses.warehouseDeleted", "Warehouse deleted successfully"));
                // Remove from local state
                setLocations(prev => prev.filter(l => l.id !== locationToDelete.id));
            } else {
                toast.error(t("warehouses.errorDeletingWarehouse", "Error deleting warehouse"));
            }
        } catch (error) {
            toast.error(t("warehouses.errorDeletingWarehouse", "Error deleting warehouse"));
        } finally {
            setDeletingLocation(false);
            setDeleteModalOpen(false);
            setLocationToDelete(null);
        }
    };

    // Navigate to location detail
    const handleViewLocation = (locationId: string) => {
        navigate(`/${orgId}/locations/${locationId}`);
    };

    const handleNewLocation = () => {
        setSelectedLocation(null);
        setLocationModalMode('create');
        setIsLocationModalOpen(true);
    };

    const handleEditLocation = (location: StockLocation) => {
        setSelectedLocation(location);
        setLocationModalMode('update');
        setIsLocationModalOpen(true);
    };

    const handleLocationModalOpenChange = (open: boolean) => {
        setIsLocationModalOpen(open);
        if (!open) {
            setSelectedLocation(null);
            setLocationModalMode('create');
        }
    };

    const handleLocationSaved = () => {
        fetchLocations(searchQuery);
    };

    const renderActions = (location: StockLocation) => (
        <div className="flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
            <CustomActionsDropdown
                items={[
                    {
                        label: t("common.edit", "Edit"),
                        icon: "edit",
                        onClick: () => handleEditLocation(location),
                    },
                    {
                        label: t("common.delete", "Delete"),
                        icon: "trash-2",
                        onClick: () => handleDeleteConfirm(location),
                        variant: "destructive",
                    },
                ]}
            />
        </div>
    );

    return (
        <>
            {/* Header */}
            <PageHeader
                title={t("warehouses.title", "Warehouses")}
                description={t("warehouses.description", "Manage your organization's warehouses and storage locations")}
                showBackButton={false}
                action={
                    <div className="flex items-center gap-2">
                        <Button onClick={handleNewLocation}>
                            <Plus className=" h-4 w-4" />
                            {t("warehouses.addWarehouse", "Add Warehouse")}
                        </Button>
                    </div>
                }
            />

            <SearchBar
                value={searchQuery}
                isLoading={isSearching}
                onChange={(query) => setSearchQuery(query)}
                onSearch={fetchLocations}
                placeholder={t("warehouses.searchPlaceholder", "Search warehouses...")}
            />

            {/* Filters */}
            {tableFilters && (
                <TableFiltersRow
                    value={tableFilters}
                    onChange={(filters) => setTableFilters(filters)}
                    onFilter={(_) => fetchLocations(searchQuery)}
                    endSlot={
                        <WarehouseColumnSelector
                            columnVisibility={columnVisibility}
                            columnOrder={columnOrder}
                            onColumnVisibilityChange={handleColumnVisibilityChange}
                            onColumnOrderChange={handleColumnOrderChange}
                            onReset={resetPreferences}
                        />
                    }
                />
            )}

            <WarehousesTable
                locations={locations}
                isLoading={isLoading}
                renderActions={renderActions}
                onRowClick={(location) => handleViewLocation(location.id)}
                clickableRows
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                columnOrder={columnOrder}
                onColumnOrderChange={setColumnOrder}
                columnSizing={columnSizing}
                onColumnSizingChange={setColumnSizing}
                emptyStateTitle={
                    searchQuery
                        ? t("warehouses.noResultsFound", "No warehouses found")
                        : t("warehouses.noWarehousesTitle", "No warehouses yet")
                }
                emptyStateDescription={
                    searchQuery
                        ? t("warehouses.noResultsDescription", "No warehouses match your search for '{{searchQuery}}'", { searchQuery })
                        : t("warehouses.noWarehousesDescription", "Start by adding your first warehouse or storage location")
                }
                onEmptyStateAction={handleNewLocation}
                emptyStateActionLabel={t("warehouses.addWarehouse", "Add Warehouse")}
            />

            {nextPageToken && (
                <div className="flex justify-center mt-6">
                    <Button
                        variant="outline"
                        onClick={loadMoreLocations}
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

            <WarehouseEditModal
                open={isLocationModalOpen}
                onOpenChange={handleLocationModalOpenChange}
                onLocationCreatedOrUpdated={handleLocationSaved}
                location={selectedLocation}
                mode={locationModalMode}
            />

            {/* Delete Confirmation Dialog */}
            <WarehouseDeleteModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                location={locationToDelete}
                onConfirm={handleDeleteLocation}
                isDeleting={deletingLocation}
            />
        </>
    );
};

export default WarehousesPage;

