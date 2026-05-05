import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, Plus, Users } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import SearchBar from "@/app/components/search-bar";
import { Badge } from "@/components/ui/badge";
import { getOrgVehicleEmployees, deleteOrgVehicleEmployee } from "@/api/orgs/vehicles/employees/employees";
import VehicleDriverAddModal from "./vehicle-driver-add-modal";
import VehicleDriverEditModal from "./vehicle-driver-edit-modal";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/miscelanea";
import { VehicleEmployeeRecord } from "@/types/general/vehicles";

interface VehicleDriversModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string;
    vehicleId: string;
    onSuccess?: () => void;
}

const VehicleDriversModal: React.FC<VehicleDriversModalProps> = ({
    open,
    onOpenChange,
    orgId,
    vehicleId,
    onSuccess,
}) => {
    const { t } = useTranslation();

    const [vehicleEmployees, setVehicleEmployees] = useState<VehicleEmployeeRecord[]>([]);
    const [filteredEmployees, setFilteredEmployees] = useState<VehicleEmployeeRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editingVehicleEmployee, setEditingVehicleEmployee] = useState<VehicleEmployeeRecord | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);

    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchVehicleEmployees = useCallback(async () => {
        if (!orgId || !vehicleId) return;
        setIsLoading(true);
        try {
            const response = await getOrgVehicleEmployees(orgId, vehicleId);
            if (response.success) {
                const employees: VehicleEmployeeRecord[] =
                    response.success.vehicle_employees ?? response.success.employees ?? [];
                setVehicleEmployees(employees);
                setFilteredEmployees(employees);
            }
        } catch {
            toast.error(t("vehicles.errorFetchingDrivers", "Error loading drivers"));
        } finally {
            setIsLoading(false);
        }
    }, [orgId, vehicleId]);

    useEffect(() => {
        if (open) {
            setSearchQuery("");
            fetchVehicleEmployees();
        }
    }, [open, fetchVehicleEmployees]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setFilteredEmployees(vehicleEmployees);
            return;
        }
        const q = query.toLowerCase();
        setFilteredEmployees(
            vehicleEmployees.filter((ve) => {
                const name = `${ve.employee?.first_name ?? ""} ${ve.employee?.last_name ?? ""}`.toLowerCase();
                const email = ve.employee?.email?.toLowerCase() ?? "";
                return name.includes(q) || email.includes(q);
            })
        );
    };

    const handleDeleteDriver = async (ve: VehicleEmployeeRecord) => {
        if (!orgId || !vehicleId) return;
        setDeletingId(ve.id);
        try {
            const response = await deleteOrgVehicleEmployee(orgId, vehicleId, ve.id);
            if (response.success) {
                toast.success(t("vehicles.driverRemoved", "Driver removed successfully"));
                await fetchVehicleEmployees();
                onSuccess?.();
            } else {
                toast.error(t("vehicles.errorRemovingDriver", "Error removing driver"));
            }
        } catch {
            toast.error(t("vehicles.errorRemovingDriver", "Error removing driver"));
        } finally {
            setDeletingId(null);
        }
    };

    const handleEditOpen = (ve: VehicleEmployeeRecord) => {
        setEditingVehicleEmployee(ve);
        setEditModalOpen(true);
    };

    const handleEditModalClose = (open: boolean) => {
        setEditModalOpen(open);
        if (!open) setEditingVehicleEmployee(null);
    };

    const handleAddSuccess = async () => {
        await fetchVehicleEmployees();
        onSuccess?.();
    };

    const handleEditSuccess = async () => {
        await fetchVehicleEmployees();
        onSuccess?.();
    };

    const formatValidDate = (dateStr: string | null) => {
        if (!dateStr) return null;
        return formatDate(dateStr, { showTime: false });
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent showCloseButton={false} className="max-w-lg max-h-[85vh] flex flex-col gap-4 p-4">
                    <DialogHeader className="flex flex-row items-center justify-between space-y-0 gap-2">
                        <DialogTitle className="text-lg flex items-center gap-2">
                            {t("vehicles.drivers", "Drivers")}
                            {vehicleEmployees.length > 0 && (
                                <Badge variant="secondary">{vehicleEmployees.length}</Badge>
                            )}
                        </DialogTitle>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setAddModalOpen(true)}
                        >
                            <Plus className="h-4 w-4" />
                            {t("vehicles.addDriver", "Add")}
                        </Button>
                    </DialogHeader>

                    <SearchBar
                        value={searchQuery}
                        isLoading={false}
                        onChange={handleSearch}
                        placeholder={t("vehicles.searchDrivers", "Search drivers...")}
                    />

                    <div className="flex-1 min-h-0 overflow-y-auto -mx-2 px-2 space-y-1">
                        {isLoading ? (
                            <div className="flex items-center justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredEmployees.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                                <Users className="h-8 w-8 opacity-40" />
                                <p className="text-sm">
                                    {searchQuery
                                        ? t("vehicles.noDriversFound", "No drivers found")
                                        : t("vehicles.noDriversAssigned", "No drivers assigned yet")}
                                </p>
                                {!searchQuery && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setAddModalOpen(true)}
                                        className="mt-1 gap-1.5"
                                    >
                                        <Plus className="h-4 w-4" />
                                        {t("vehicles.addDriver", "Add Driver")}
                                    </Button>
                                )}
                            </div>
                        ) : (
                            filteredEmployees.map((ve) => (
                                <div
                                    key={ve.id}
                                    onClick={() => handleEditOpen(ve)}
                                    className={cn(
                                        "flex items-center justify-between text-sm py-2 px-2 rounded transition-colors cursor-pointer hover:bg-muted/50"
                                    )}
                                >
                                    <div className="flex-1 min-w-0">
                                        <EmployeeAvatar
                                            employee={ve.employee}
                                            showName
                                            showJobTitle
                                        />
                                        {(ve.valid_from || ve.valid_to) && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 pl-1">
                                                {ve.valid_from && (
                                                    <span>{t("vehicles.from", "From")}: {formatValidDate(ve.valid_from)}</span>
                                                )}
                                                {ve.valid_to && (
                                                    <span>{t("vehicles.to", "To")}: {formatValidDate(ve.valid_to)}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div onClick={(e) => e.stopPropagation()}>
                                        {deletingId === ve.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        ) : (
                                            <CustomActionsDropdown
                                                items={[
                                                    {
                                                        label: t("common.edit", "Edit"),
                                                        icon: "edit",
                                                        onClick: () => handleEditOpen(ve),
                                                    },
                                                    {
                                                        label: t("common.remove", "Remove"),
                                                        icon: "user-round-x",
                                                        onClick: () => handleDeleteDriver(ve),
                                                        variant: "destructive",
                                                    },
                                                ]}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <VehicleDriverAddModal
                open={addModalOpen}
                onOpenChange={setAddModalOpen}
                orgId={orgId}
                vehicleId={vehicleId}
                existingDriverIds={vehicleEmployees.map((ve) => ve.employee?.id).filter(Boolean)}
                onSuccess={handleAddSuccess}
            />

            <VehicleDriverEditModal
                open={editModalOpen}
                onOpenChange={handleEditModalClose}
                orgId={orgId}
                vehicleId={vehicleId}
                vehicleEmployee={editingVehicleEmployee}
                onSuccess={handleEditSuccess}
                renderActions={
                    editingVehicleEmployee ? (
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("common.edit", "Edit"),
                                    icon: "edit",
                                    onClick: () => {},
                                    showOption: false,
                                },
                                {
                                    label: t("common.remove", "Remove"),
                                    icon: "user-round-x",
                                    onClick: () => {
                                        const ve = editingVehicleEmployee;
                                        setEditModalOpen(false);
                                        setEditingVehicleEmployee(null);
                                        handleDeleteDriver(ve);
                                    },
                                    variant: "destructive",
                                },
                            ]}
                        />
                    ) : undefined
                }
            />
        </>
    );
};

export default VehicleDriversModal;
