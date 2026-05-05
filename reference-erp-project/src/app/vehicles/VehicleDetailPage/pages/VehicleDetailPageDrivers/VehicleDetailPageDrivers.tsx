import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVehicle } from "@/app/vehicles/contexts/VehicleContext";
import { getOrgVehicleEmployees, deleteOrgVehicleEmployee } from "@/api/orgs/vehicles/employees/employees";
import SearchBar from "@/app/components/search-bar";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import VehicleDriverAddModal from "@/app/vehicles/components/vehicle-driver-add-modal";
import VehicleDriverEditModal from "@/app/vehicles/components/vehicle-driver-edit-modal";
import DriversHistoryTable from "./components/vehicle-drivers-table";
import { Driver } from "@/types/general/vehicles";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";
import { Loader2 } from "lucide-react";

const VehicleDetailPageDrivers = () => {
    const { t } = useTranslation();
    const { orgId, vehicleId } = useParams<{ orgId: string; vehicleId: string }>();
    const { refreshVehicle } = useVehicle();

    const [vehicleEmployees, setVehicleEmployees] = useState<Driver[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const [addModalOpen, setAddModalOpen] = useState(false);

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedVehicleEmployee, setSelectedVehicleEmployee] = useState<Driver | null>(null);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchVehicleEmployees = useCallback(async (query: string = "") => {
        if (!orgId || !vehicleId) return;
        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }
        try {
            const response = await getOrgVehicleEmployees(orgId, vehicleId, query || undefined);
            if (response.success) {
                const employees: Driver[] = response.success.employees ?? [];
                setVehicleEmployees(employees);
                setNextPageToken(response.success.next_page_token ?? null);
            }
        } catch {
            toast.error(t("vehiclesDetail.errorFetchingDrivers", "Error fetching drivers"));
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    }, [orgId, vehicleId, t]);

    const loadMore = useCallback(async () => {
        if (!orgId || !vehicleId || !nextPageToken || isLoadingMore) return;
        setIsLoadingMore(true);
        try {
            const response = await getOrgVehicleEmployees(orgId, vehicleId, searchQuery || undefined, nextPageToken);
            if (response.success) {
                const moreEmployees: Driver[] = response.success.employees ?? [];
                setVehicleEmployees((prev) => [...prev, ...moreEmployees]);
                setNextPageToken(response.success.next_page_token ?? null);
            }
        } catch {
            toast.error(t("vehiclesDetail.errorFetchingDrivers", "Error fetching drivers"));
        } finally {
            setIsLoadingMore(false);
        }
    }, [orgId, vehicleId, nextPageToken, isLoadingMore, searchQuery, t]);

    useEffect(() => {
        fetchVehicleEmployees();
    }, [fetchVehicleEmployees]);

    const handleRefresh = () => {
        fetchVehicleEmployees(searchQuery);
        refreshVehicle();
    };

    const handleDeleteDriver = async () => {
        if (!orgId || !vehicleId || !deleteTarget) return;
        setIsDeleting(true);
        try {
            const response = await deleteOrgVehicleEmployee(orgId, vehicleId, deleteTarget.id);
            if (response.success) {
                toast.success(t("vehiclesDetail.driverRemoved", "Driver removed successfully"));
                setDeleteModalOpen(false);
                setDeleteTarget(null);
                handleRefresh();
            } else {
                toast.error(t("vehiclesDetail.errorRemovingDriver", "Error removing driver"));
            }
        } catch {
            toast.error(t("vehiclesDetail.errorRemovingDriver", "Error removing driver"));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <SearchBar
                            value={searchQuery}
                            isLoading={isSearching}
                            onChange={(query) => setSearchQuery(query)}
                            onSearch={fetchVehicleEmployees}
                            placeholder={t("vehiclesDetail.searchDrivers", "Search drivers...")}
                        />
                    </div>
                    <Button onClick={() => setAddModalOpen(true)}>
                        <Plus className="h-4 w-4" />
                        {t("vehiclesDetail.addDriver", "Add Driver")}
                    </Button>
                </div>

                <DriversHistoryTable
                    vehicleEmployees={vehicleEmployees}
                    isLoading={isLoading}
                    searchQuery={searchQuery}
                    onAddDriver={() => setAddModalOpen(true)}
                    hasMore={!!nextPageToken}
                    isLoadingMore={isLoadingMore}
                    onLoadMore={loadMore}
                    renderActions={(ve) => (
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("common.edit", "Edit"),
                                    icon: "pencil",
                                    onClick: () => {
                                        setSelectedVehicleEmployee(ve);
                                        setEditModalOpen(true);
                                    },
                                },
                                {
                                    label: t("common.delete", "Delete"),
                                    icon: "trash-2",
                                    onClick: () => {
                                        setDeleteTarget(ve);
                                        setDeleteModalOpen(true);
                                    },
                                    variant: "destructive",
                                },
                            ]}
                        />
                    )}
                />
            </div>

            {orgId && vehicleId && (
                <VehicleDriverAddModal
                    open={addModalOpen}
                    onOpenChange={setAddModalOpen}
                    orgId={orgId}
                    vehicleId={vehicleId}
                    onSuccess={handleRefresh}
                />
            )}

            {orgId && vehicleId && (
                <VehicleDriverEditModal
                    open={editModalOpen}
                    onOpenChange={setEditModalOpen}
                    orgId={orgId}
                    vehicleId={vehicleId}
                    vehicleEmployee={selectedVehicleEmployee}
                    onSuccess={handleRefresh}
                    renderActions={
                        selectedVehicleEmployee ? (
                            <CustomActionsDropdown
                                items={[
                                    {
                                        label: t("common.delete", "Delete"),
                                        icon: "trash-2",
                                        onClick: () => {
                                            const ve = selectedVehicleEmployee;
                                            setEditModalOpen(false);
                                            setSelectedVehicleEmployee(null);
                                            setDeleteTarget(ve);
                                            setDeleteModalOpen(true);
                                        },
                                        variant: "destructive",
                                    },
                                ]}
                            />
                        ) : undefined
                    }
                />
            )}

            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle>{t("vehiclesDetail.removeDriver", "Remove Driver")}</DialogTitle>
                        <DialogDescription>
                            {t("vehiclesDetail.removeDriverConfirmation", "Are you sure you want to remove this driver from the vehicle?")}
                        </DialogDescription>
                    </DialogHeader>
                    {deleteTarget?.employee && (
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                            <EmployeeAvatar employee={deleteTarget.employee} showName size="sm" />
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={isDeleting}>
                            {t("common.cancel", "Cancel")}
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteDriver} disabled={isDeleting}>
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {t("common.removing", "Removing...")}
                                </>
                            ) : (
                                t("common.remove", "Remove")
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default VehicleDetailPageDrivers;
