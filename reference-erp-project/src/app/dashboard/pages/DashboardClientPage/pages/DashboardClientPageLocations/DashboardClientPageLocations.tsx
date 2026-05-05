import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { Location } from "@/types/general/location";
import SearchBar from "@/app/components/search-bar";
import { getClientLocations, deleteClientLocation } from "@/api/clients/locations/locations";
import { toast } from "sonner";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import NewLocationModal from "./components/new-location-modal";
import ClientLocationsTable from "./components/client-locations-table";
import ClientLocationDeleteModal from "./components/client-location-delete-modal";
import { useClient } from "@/app/dashboard/contexts/DashboardClientContext";

const DashboardClientPageLocations = () => {
  const { t } = useTranslation();
  const { orgId } = useParams<{ orgId: string }>();
  const { client } = useClient();
  const clientId = client?.id ?? "";
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Location[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [deletingLocation, setDeletingLocation] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newLocationModalOpen, setNewLocationModalOpen] = useState(false);

  const fetchLocations = async (query: string = "") => {
    if (query) {
      setIsSearching(true);
    } else {
      setIsLoading(true);
    }
    if (!orgId || !clientId) return;

    try {
      const response = await getClientLocations(orgId, clientId, query, null);
      if (response.success && response.success.locations) {
        setLocations(response.success.locations);
        setNextPageToken(response.success.next_page_token || null);
      } else {
        toast.error(t("locations.errorFetchingLocations") || "Error fetching locations");
      }
    } catch (error) {
      toast.error(t("locations.errorFetchingLocations") || "Error fetching locations");
    } finally {
      setIsSearching(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orgId && clientId) {
      fetchLocations();
    }
  }, [orgId, clientId]);

  const loadMoreLocations = async () => {
    if (!orgId || !clientId || !nextPageToken || loadingMore || isLoading) return;

    setLoadingMore(true);
    try {
      const response = await getClientLocations(orgId, clientId, searchQuery, nextPageToken);
      if (response.success && response.success.locations) {
        setLocations((prev) => [...prev, ...response.success.locations]);
        setNextPageToken(response.success.next_page_token || null);
      } else {
        toast.error(t("locations.errorFetchingLocations") || "Error fetching locations");
      }
    } catch (error) {
      toast.error(t("locations.errorFetchingLocations") || "Error fetching locations");
    } finally {
      setLoadingMore(false);
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = (location: Location) => {
    setLocationToDelete(location);
    setDeleteModalOpen(true);
  };

  const handleDeleteLocation = async () => {
    if (!locationToDelete || !orgId || !clientId) return;

    setDeletingLocation(true);
    try {
      const response = await deleteClientLocation(orgId, clientId, locationToDelete.id);
      if (response.success) {
        toast.success(t("locations.locationDeleted", "Location deleted successfully"));
        setLocations((prev) => prev.filter((l) => l.id !== locationToDelete.id));
      } else {
        toast.error(t("locations.errorDeletingLocation", "Error deleting location"));
      }
    } catch (error) {
      toast.error(t("locations.errorDeletingLocation", "Error deleting location"));
    } finally {
      setDeletingLocation(false);
      setDeleteModalOpen(false);
      setLocationToDelete(null);
    }
  };

  const handleViewLocation = (location: Location) => {
    navigate(`/${orgId}/clients/${clientId}/locations/${location.id}`);
  };

  const renderActions = (location: Location) => (
    <CustomActionsDropdown
      items={[
        {
          label: t("common.delete", "Delete"),
          icon: "trash-2",
          onClick: () => handleDeleteConfirm(location),
          variant: "destructive",
        },
      ]}
    />
  );

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between mb-4 gap-4">
        <SearchBar
          value={searchQuery}
          className="w-full"
          isLoading={isSearching}
          onChange={(query) => setSearchQuery(query)}
          onSearch={fetchLocations}
          placeholder={t("locations.searchPlaceholder", "Search locations...")}
        />
        <Button onClick={() => setNewLocationModalOpen(true)}>
          <Plus className="h-4 w-4" />
          {t("locations.addLocation", "Add Location")}
        </Button>
      </div>

      <ClientLocationsTable
        locations={locations}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onAddLocation={() => setNewLocationModalOpen(true)}
        onViewLocation={handleViewLocation}
        renderActions={renderActions}
      />

      {nextPageToken && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={loadMoreLocations}
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

      <NewLocationModal
        open={newLocationModalOpen}
        onOpenChange={setNewLocationModalOpen}
        onLocationCreated={fetchLocations}
      />

      <ClientLocationDeleteModal
        open={deleteModalOpen}
        onOpenChange={(open) => {
          setDeleteModalOpen(open);
          if (!open) {
            setLocationToDelete(null);
          }
        }}
        location={locationToDelete}
        onConfirm={handleDeleteLocation}
        isDeleting={deletingLocation}
      />
    </div>
  );
};

export default DashboardClientPageLocations;
