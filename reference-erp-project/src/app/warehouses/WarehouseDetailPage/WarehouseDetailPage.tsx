import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import PageHeader from "@/app/components/page-header";
import { useLocation } from "@/app/warehouses/contexts/LocationContext";
import { Button } from "@/components/ui/button";
import IdBadge from "@/app/components/id-badge";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/shadcn-io/tabs";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import WarehouseDetailPageSummary from "./pages/WarehouseDetailPageSummary";
import WarehouseDetailPageHistory from "./pages/WarehouseDetailPageHistory/WarehouseDetailPageHistory";
import WarehouseEditModal from "@/app/warehouses/components/warehouse-edit-modal";
import WarehouseDeleteModal from "@/app/warehouses/components/warehouse-delete-modal";
import WarehouseStockAdjustmentModal from "@/app/warehouses/WarehouseDetailPage/components/warehouse-stock-adjustment-modal";
import { deleteLocation } from "@/api/orgs/locations/locations";
import Tag from "@/app/components/tag/tag";
import { DynamicIcon } from "lucide-react/dynamic";

const WarehouseDetailPage = () => {
    const { t } = useTranslation();
    const { location, refreshLocation } = useLocation();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isNewInventoryModalOpen, setIsNewInventoryModalOpen] = useState(false);
    // State for modals
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingLocation, setDeletingLocation] = useState(false);

    // Get current tab from URL or default to 'summary'
    const currentTab = searchParams.get('tab') || 'summary';

    // Valid tab values
    const validTabs = ['summary', 'history'];

    // Ensure current tab is valid, otherwise default to 'summary'
    const activeTab = validTabs.includes(currentTab) ? currentTab : 'summary';

    // Handle tab change
    const handleTabChange = (value: string) => {
        if (validTabs.includes(value)) {
            setSearchParams({ tab: value });
        }
    };

    // Handle edit location
    const handleEditLocation = () => {
        setEditModalOpen(true);
    };

    // Handle delete confirmation
    const handleDeleteConfirm = () => {
        setDeleteModalOpen(true);
    };

    // Handle delete execution
    const handleDeleteLocation = async () => {
        if (!location?.id || !orgId) return;

        setDeletingLocation(true);
        try {
            const response = await deleteLocation(orgId, location.id);
            if (response.success) {
                toast.success(t("warehouses.warehouseDeleted", "Warehouse deleted successfully"));
                // Navigate back to locations list
                navigate(`/${orgId}/locations`);
            } else {
                toast.error(t("warehouses.errorDeletingWarehouse", "Error deleting warehouse"));
            }
        } catch (error) {
            toast.error(t("warehouses.errorDeletingWarehouse", "Error deleting warehouse"));
        } finally {
            setDeletingLocation(false);
            setDeleteModalOpen(false);
        }
    };

    // Handle location updated
    const handleLocationUpdated = () => {
        refreshLocation();
    };

    return (
        <div className="space-y-6">
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
                title={location.name}
                description={`${location.city ? `${location.city}, ` : ''}${location.country || ''}`}
                showBackButton={true}
                action={
                    <div className="flex items-center gap-2">
                        <Tag text={location?.status || ""} className="capitalize" />
                        <IdBadge id={location.id || ""} className="h-6 px-4 text-xs" />
                        <Button onClick={() => setIsNewInventoryModalOpen(true)}>
                            <Plus className="h-4 w-4" />
                            {t("inventory.addInventory", "New Adjustment")}
                        </Button>
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t('common.actions.edit', 'Edit'),
                                    icon: "edit",
                                    onClick: handleEditLocation,
                                },
                                {
                                    label: t('common.actions.delete', 'Delete'),
                                    icon: "trash-2",
                                    onClick: handleDeleteConfirm,
                                    variant: "destructive",
                                },
                            ]}
                        />
                    </div>
                }
            />

            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList
                    className="w-full justify-start border-b-2 border-border bg-background mb-4"
                    activeClassName='border-b-2 border-primary -mb-1.5'
                >
                    <TabsTrigger className="py-0" value="summary">{t('warehouseDetail.summary', 'Summary')}</TabsTrigger>
                    <TabsTrigger className="py-0" value="history">{t('warehouseDetail.history', 'History')}</TabsTrigger>
                </TabsList>

                <TabsContents transition={{ duration: 0 }}>
                    <TabsContent value="summary" transition={{ duration: 0 }}>
                        <WarehouseDetailPageSummary onEdit={handleEditLocation} />
                    </TabsContent>
                    <TabsContent value="history" transition={{ duration: 0 }}>
                        <WarehouseDetailPageHistory />
                    </TabsContent>
                </TabsContents>
            </Tabs>

            {/* Edit Location Modal */}
            <WarehouseEditModal
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
                onLocationCreatedOrUpdated={handleLocationUpdated}
                location={location}
                mode="update"
            />

            {/* Delete Confirmation Dialog */}
            <WarehouseDeleteModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                location={location}
                onConfirm={handleDeleteLocation}
                isDeleting={deletingLocation}
            />

            {/* Stock Adjustment Modal */}
            <WarehouseStockAdjustmentModal
                open={isNewInventoryModalOpen}
                onOpenChange={setIsNewInventoryModalOpen}
                locationId={location?.id || ""}
                onAdjustmentSaved={refreshLocation}
            />
        </div>
    );
};

export default WarehouseDetailPage;

