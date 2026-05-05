import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Truck, Car, Bike, Bus } from "lucide-react";
import PageHeader from "@/app/components/page-header";
import { useVehicle } from "../contexts/VehicleContext";
import IdBadge from "@/app/components/id-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/shadcn-io/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { deleteOrgVehicle } from "@/api/orgs/vehicles/vehicles";
import FilesSection from "@/app/components/files/files-section";
import Tag from "@/app/components/tag/tag";
import VehicleDetailPageSummary from "./pages/VehicleDetailPageSummary/VehicleDetailPageSummary";
import VehicleDetailPageDrivers from "./pages/VehicleDetailPageDrivers/VehicleDetailPageDrivers";
import VehicleDetailPageMaintenance from "./pages/VehicleDetailPageMaintenance/VehicleDetailPageMaintenance";
import VehicleEditModal from "../components/vehicle-edit-modal";
import { cn } from "@/lib/utils";
import { getColorClasses } from "@/utils/miscelanea";
import { getTagColorFromString } from "@/app/components/tag/utils";

const VehicleDetailPage = () => {
    const { t } = useTranslation();
    const { vehicle, refreshVehicle } = useVehicle();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingVehicle, setDeletingVehicle] = useState(false);

    const vehicleTypeIcon = {
        truck: Truck,
        van: Bus,
        car: Car,
        motorcycle: Bike,
    }[vehicle.vehicle_type] ?? Truck;
    const VehicleIcon = vehicleTypeIcon;

    const validTabs = ["summary", "drivers", "maintenance", "files"];
    const currentTab = searchParams.get("tab") || "summary";
    const activeTab = validTabs.includes(currentTab) ? currentTab : "summary";

    const handleTabChange = (value: string) => {
        if (validTabs.includes(value)) {
            setSearchParams({ tab: value });
        }
    };

    const handleDeleteVehicle = async () => {
        if (!vehicle?.id || !orgId) return;
        setDeletingVehicle(true);
        try {
            const response = await deleteOrgVehicle(orgId, vehicle.id);
            if (response.success) {
                toast.success(t("vehicles.vehicleDeleted", "Vehicle deleted successfully"));
                navigate(`/${orgId}/vehicles`);
            } else {
                toast.error(t("vehicles.errorDeletingVehicle", "Error deleting vehicle"));
            }
        } catch {
            toast.error(t("vehicles.errorDeletingVehicle", "Error deleting vehicle"));
        } finally {
            setDeletingVehicle(false);
            setDeleteModalOpen(false);
        }
    };

    return (
        <>
            <PageHeader
                beforeTextChildren={
                    <div className={
                        cn("flex items-center justify-center w-10 h-10 rounded-full bg-muted shrink-0",
                            getColorClasses(getTagColorFromString(vehicle.vehicle_type))
                        )}>
                        <VehicleIcon className="h-5 w-5" />
                    </div>
                }
                title={vehicle.name || vehicle.plate_number}
                description={
                    <div className="flex items-center gap-2">
                        <IdBadge id={vehicle.plate_number} />
                    </div>
                }
                showBackButton={true}
                action={
                    <div className="flex items-center gap-2">
                        <Tag text={vehicle.status} className="capitalize" />
                        <IdBadge id={vehicle.id} className="h-6 px-4 text-xs" />
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("common.edit", "Edit"),
                                    icon: "edit",
                                    onClick: () => setEditModalOpen(true),
                                },
                                {
                                    label: t("common.delete", "Delete"),
                                    icon: "trash-2",
                                    onClick: () => setDeleteModalOpen(true),
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
                    activeClassName="border-b-2 border-primary -mb-1.5"
                >
                    <TabsTrigger className="py-0" value="summary">{t("vehiclesDetail.summary", "Summary")}</TabsTrigger>
                    <TabsTrigger className="py-0" value="drivers">{t("vehiclesDetail.drivers", "Drivers")}</TabsTrigger>
                    <TabsTrigger className="py-0" value="maintenance">{t("vehiclesDetail.maintenance", "Maintenance")}</TabsTrigger>
                    <TabsTrigger className="py-0" value="files">{t("vehiclesDetail.files", "Files")}</TabsTrigger>
                </TabsList>

                <TabsContents transition={{ duration: 0 }}>
                    <TabsContent value="summary" transition={{ duration: 0 }}>
                        <VehicleDetailPageSummary />
                    </TabsContent>
                    <TabsContent value="drivers" transition={{ duration: 0 }}>
                        <VehicleDetailPageDrivers />
                    </TabsContent>
                    <TabsContent value="maintenance" transition={{ duration: 0 }}>
                        <VehicleDetailPageMaintenance />
                    </TabsContent>
                    <TabsContent value="files" transition={{ duration: 0 }}>
                        <FilesSection key={`vehicle-files-${vehicle.id}`} entity_id={vehicle.id} />
                    </TabsContent>
                </TabsContents>
            </Tabs>

            <VehicleEditModal
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
                vehicle={vehicle}
                onSuccess={refreshVehicle}
                renderActions={
                    <CustomActionsDropdown
                        items={[
                            {
                                label: t("common.delete", "Delete"),
                                icon: "trash-2",
                                onClick: () => {
                                    setEditModalOpen(false);
                                    setDeleteModalOpen(true);
                                },
                                variant: "destructive",
                            },
                        ]}
                    />
                }
            />

            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle>{t("vehicles.deleteVehicle", "Delete Vehicle")}</DialogTitle>
                        <DialogDescription>
                            {t("vehicles.deleteVehicleConfirmation", "Are you sure you want to delete this vehicle? This action cannot be undone.")}
                            {vehicle && (
                                <div className="mt-2 p-2 bg-muted rounded">
                                    <strong>{vehicle.name || vehicle.plate_number}</strong>
                                    {vehicle.name && <span className="text-muted-foreground ml-1">({vehicle.plate_number})</span>}
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deletingVehicle}>
                            {t("common.cancel", "Cancel")}
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteVehicle} disabled={deletingVehicle}>
                            {deletingVehicle ? (
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
        </>
    );
};

export default VehicleDetailPage;
