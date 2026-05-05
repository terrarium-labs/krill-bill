import { useState, useRef } from "react";
import PageHeader from "@/app/components/page-header";
import IdBadge from "@/app/components/id-badge";
import { LocationInfoCard } from "@/app/clients/ClientDetailPage/pages/ClientDetailPageLocations/components/location-info-card";
import { DynamicIcon } from "lucide-react/dynamic";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { deleteClientLocation } from "@/api/clients/locations/locations";
import NewLocationModal from "../components/new-location-modal";
import InventoryItemEditModal from "../components/inventory-item-edit-modal";
import InventoryItemCreateModal from "../components/inventory-item-create-modal";
import { useLocation } from "../contexts/LocationContext";
import Tag from "@/app/components/tag/tag";
import ClientDetailPageLocationsInventory, { ClientLocationInventoryRef } from "./ClientDetailPageLocationsInventory";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import ClientLocationDeleteModal from "../components/client-location-delete-modal";

const ClientDetailPageLocationsDetail = () => {
    const { location, refreshLocation } = useLocation();
    const { t } = useTranslation();
    const { orgId, clientId } = useParams();
    const navigate = useNavigate();
    const inventoryRef = useRef<ClientLocationInventoryRef>(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCreateInventoryModalOpen, setIsCreateInventoryModalOpen] = useState(false);
    const [inventoryToEdit, setInventoryToEdit] = useState<any>(null);
    const [isEditInventoryModalOpen, setIsEditInventoryModalOpen] = useState(false);

    const handleEdit = () => {
        setIsEditModalOpen(true);
    };

    const handleDelete = () => {
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!location || !orgId || !clientId) return;

        setIsDeleting(true);
        try {
            const response = await deleteClientLocation(orgId, clientId, location.id);
            if (response.success) {
                toast.success(t("locations.deletedSuccess", "Location deleted successfully"));
                navigate(`/${orgId}/clients/${clientId}/locations`);
            } else {
                toast.error(
                    response?.error || t("locations.deleteError", "Failed to delete location")
                );
            }
        } catch (error) {
            console.error("Error deleting location:", error);
            toast.error(t("locations.deleteError", "Failed to delete location"));
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
        }
    };

    const handleLocationUpdated = () => {
        refreshLocation();
    };

    const handleInventorySaved = async () => {
        // Refresh inventory data
        inventoryRef.current?.refreshInventory();
    };

    const handleEditInventory = (inventory: any) => {
        setInventoryToEdit(inventory);
        setIsEditInventoryModalOpen(true);
    };

    const formatAddress = () => {
        return [
            location?.address_line_1 || "",
            location?.address_line_2 || "",
            location?.city || "",
            location?.state_province || "",
            location?.postal_code || "",
        ].filter(Boolean).join(", ");
    };

    return (
        <>
            <PageHeader
                beforeTextChildren={
                    location?.icon_url ? (
                        <div className="flex items-center gap-2 bg-muted rounded-md min-h-14 min-w-14 justify-center">
                            <DynamicIcon
                                name={location?.icon_url as any}
                                className="h-6 w-6"
                            />
                        </div>
                    ) : null
                }
                title={location?.name || ""}
                action={
                    <div className="flex items-center gap-2">
                        <Tag text={location?.status || ""} className="capitalize" />
                        <IdBadge id={location?.id || ""} />
                        <Button onClick={() => setIsCreateInventoryModalOpen(true)}>
                            <Plus className="h-4 w-4" />
                            {t("inventory.addInventory", "Add Item")}
                        </Button>
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t('common.actions.edit', 'Edit'),
                                    icon: "edit",
                                    onClick: handleEdit,
                                },
                                {
                                    label: t('common.actions.delete', 'Delete'),
                                    icon: "trash-2",
                                    onClick: handleDelete,
                                    variant: "destructive",
                                },
                            ]}
                        />
                    </div>
                }
                description={formatAddress()}
                showBackButton={true}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <LocationInfoCard location={location} onEdit={handleEdit} />
                </div>
                <div className="lg:col-span-2">
                    <ClientDetailPageLocationsInventory
                        ref={inventoryRef}
                        onAddInventoryClick={() => setIsCreateInventoryModalOpen(true)}
                        onEditInventory={handleEditInventory}
                    />
                </div>
            </div>

            {/* Edit Modal */}
            {orgId && clientId && (
                <NewLocationModal
                    open={isEditModalOpen}
                    onOpenChange={setIsEditModalOpen}
                    onLocationCreated={handleLocationUpdated}
                    location={location}
                    mode="update"
                />
            )}

            {/* New Inventory Modal */}
            {orgId && clientId && location && (
                <InventoryItemCreateModal
                    open={isCreateInventoryModalOpen}
                    onOpenChange={setIsCreateInventoryModalOpen}
                    onInventorySaved={handleInventorySaved}
                    locationId={location.id}
                />
            )}

            {/* Edit Inventory Modal */}
            {orgId && clientId && location && (
                <InventoryItemEditModal
                    open={isEditInventoryModalOpen}
                    onOpenChange={setIsEditInventoryModalOpen}
                    onInventorySaved={handleInventorySaved}
                    inventory={inventoryToEdit}
                    locationId={location.id}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <ClientLocationDeleteModal
                open={isDeleteModalOpen}
                onOpenChange={setIsDeleteModalOpen}
                location={location}
                onConfirm={handleDeleteConfirm}
                isDeleting={isDeleting}
            />
        </>
    );
};

export default ClientDetailPageLocationsDetail;
