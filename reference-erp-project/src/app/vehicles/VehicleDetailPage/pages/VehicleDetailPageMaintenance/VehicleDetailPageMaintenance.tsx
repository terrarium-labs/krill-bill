import { useState, useMemo, useEffect, Activity } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus, ChevronLeft, ChevronRight, CalendarDays, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/shadcn-io/tabs";
import PageHeader from "@/app/components/page-header";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import {
    getVehicleMaintenances,
    deleteVehicleMaintenance,
} from "@/api/orgs/vehicles/maintenances/maintenances";
import { VehicleMaintenance } from "@/types/general/vehicles";
import MaintenanceCalendar from "./components/maintenance-calendar";
import MaintenancesTable from "./components/maintenances-table";
import MaintenancesCard from "./components/maintenances-card";
import MaintenancesSummaryCard from "./components/maintenances-summary-card";
import MaintenanceViewModal from "./components/maintenance-view-modal";
import MaintenanceEditModal from "./components/maintenance-edit-modal";
import { formatDate } from "@/utils/miscelanea";

const VehicleDetailPageMaintenance = () => {
    const { t } = useTranslation();
    const { orgId, vehicleId } = useParams<{ orgId: string; vehicleId: string }>();

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [maintenances, setMaintenances] = useState<VehicleMaintenance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showTableView, setShowTableView] = useState(false);

    // Create / edit modal
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editMode, setEditMode] = useState<"create" | "edit">("create");
    const [selectedMaintenance, setSelectedMaintenance] = useState<VehicleMaintenance | null>(null);

    // View modal
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewMaintenance, setViewMaintenance] = useState<VehicleMaintenance | null>(null);

    // Delete modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingMaintenance, setDeletingMaintenance] = useState<VehicleMaintenance | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const availableYears = useMemo(() => {
        const current = new Date().getFullYear();
        const years: number[] = [];
        for (let y = current - 5; y <= current + 5; y++) years.push(y);
        return years;
    }, []);

    const fetchMaintenances = async () => {
        if (!orgId || !vehicleId) return;
        setIsLoading(true);
        try {
            const response = await getVehicleMaintenances(orgId, vehicleId, selectedYear);
            if (response.success) {
                setMaintenances(response.success.maintenances ?? []);
            }
        } catch {
            toast.error(t("maintenance.errorFetching", "Error loading maintenance records"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMaintenances();
    }, [orgId, vehicleId, selectedYear]);

    const handleToggleView = () => {
        setShowTableView(!showTableView);
    };

    // Handlers
    const handleNewMaintenance = () => {
        setSelectedMaintenance(null);
        setEditMode("create");
        setEditModalOpen(true);
    };

    const handleAddForDate = (_date: Date | null) => {
        setSelectedMaintenance(null);
        setEditMode("create");
        setEditModalOpen(true);
    };

    const handleEditMaintenance = (maintenance: VehicleMaintenance) => {
        setSelectedMaintenance(maintenance);
        setEditMode("edit");
        setEditModalOpen(true);
    };

    const handleViewMaintenance = (maintenance: VehicleMaintenance) => {
        setViewMaintenance(maintenance);
        setViewModalOpen(true);
    };

    const handleOpenDeleteModal = (maintenance: VehicleMaintenance) => {
        setDeletingMaintenance(maintenance);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!orgId || !vehicleId || !deletingMaintenance) return;
        setIsDeleting(true);
        try {
            const response = await deleteVehicleMaintenance(orgId, vehicleId, deletingMaintenance.id);
            if (response.success) {
                toast.success(t("maintenance.deleteSuccess", "Maintenance deleted successfully"));
                setDeleteModalOpen(false);
                setDeletingMaintenance(null);
                fetchMaintenances();
            } else {
                toast.error(t("maintenance.deleteError", "Error deleting maintenance"));
            }
        } catch {
            toast.error(t("maintenance.deleteError", "Error deleting maintenance"));
        } finally {
            setIsDeleting(false);
        }
    };

    const getActionItems = (maintenance: VehicleMaintenance, closePopover?: () => void) => [
        {
            label: t("common.view", "View"),
            icon: "eye" as const,
            onClick: () => {
                handleViewMaintenance(maintenance);
                closePopover?.();
            },
        },
        {
            label: t("common.edit", "Edit"),
            icon: "edit" as const,
            onClick: () => {
                handleEditMaintenance(maintenance);
                closePopover?.();
            },
        },
        {
            label: t("common.delete", "Delete"),
            icon: "trash-2" as const,
            onClick: () => {
                handleOpenDeleteModal(maintenance);
                closePopover?.();
            },
            variant: "destructive" as const,
        },
    ];

    const renderCalendarActions = (
        maintenance: VehicleMaintenance,
        closePopover: () => void
    ) => <CustomActionsDropdown items={getActionItems(maintenance, closePopover)} />;

    const renderTableActions = (maintenance: VehicleMaintenance) => (
        <div className="flex justify-end">
            <CustomActionsDropdown items={getActionItems(maintenance)} />
        </div>
    );

    const renderViewModalActions = (maintenance: VehicleMaintenance) => (
        <CustomActionsDropdown
            items={[
                {
                    label: t("common.edit", "Edit"),
                    icon: "edit",
                    onClick: () => {
                        setViewModalOpen(false);
                        handleEditMaintenance(maintenance);
                    },
                },
                {
                    label: t("common.delete", "Delete"),
                    icon: "trash-2",
                    onClick: () => handleOpenDeleteModal(maintenance),
                    variant: "destructive" as const,
                },
            ]}
        />
    );

    return (
        <>
            {/* Header */}
            <div className="flex items-center gap-2">
                <div className="flex-1">
                    <PageHeader
                        title={
                            <span className="text-[16px] font-semibold">
                                {t("maintenance.pageTitle", "Maintenances Annual View")}
                            </span>
                        }
                        showBackButton={false}
                        action={
                            <div className="flex items-center gap-2">
                                {selectedYear !== new Date().getFullYear() && (
                                    <Button
                                        variant="outline"
                                        size="default"
                                        onClick={() => setSelectedYear(new Date().getFullYear())}
                                        disabled={isLoading}
                                    >
                                        {t("common.currentYear", "Current Year")}
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="default"
                                    onClick={() => setSelectedYear((y) => y - 1)}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Select
                                    value={selectedYear.toString()}
                                    onValueChange={(v) => setSelectedYear(parseInt(v))}
                                >
                                    <SelectTrigger className="w-[fit]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableYears.map((y) => (
                                            <SelectItem key={y} value={y.toString()}>
                                                {y}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="outline"
                                    size="default"
                                    onClick={() => setSelectedYear((y) => y + 1)}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Tabs
                                    value={showTableView ? "table" : "calendar"}
                                    onValueChange={handleToggleView}
                                >
                                    <TabsList
                                        className="flex items-center gap-2 border-none rounded-md"
                                        activeClassName="border-none rounded-md"
                                    >
                                        <TabsTrigger className="py-0" value="calendar">
                                            <CalendarDays className="h-4 w-4" />
                                        </TabsTrigger>
                                        <TabsTrigger className="py-0" value="table">
                                            <List className="h-4 w-4" />
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                <Button onClick={handleNewMaintenance}>
                                    <Plus className="h-4 w-4" />
                                    {t("maintenance.addMaintenance", "Add Maintenance")}
                                </Button>
                            </div>
                        }
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left sidebar: summary + list (only in calendar view) */}
                <Activity mode={!showTableView ? "visible" : "hidden"}>
                    <div className="lg:col-span-1 flex flex-col gap-4">
                        <MaintenancesSummaryCard maintenances={maintenances} />
                        <MaintenancesCard
                            maintenances={maintenances}
                            isLoading={isLoading}
                            onAdd={handleNewMaintenance}
                            onView={handleViewMaintenance}
                        />
                    </div>
                </Activity>

                {/* Right: calendar or table */}
                <div className={!showTableView ? "lg:col-span-2 min-w-0" : "lg:col-span-3 min-w-0"}>
                    <Activity mode={!showTableView ? "visible" : "hidden"}>
                        <MaintenanceCalendar
                            selectedYear={selectedYear}
                            maintenances={maintenances}
                            onAddMaintenance={handleAddForDate}
                            onViewMaintenance={handleViewMaintenance}
                            renderActions={renderCalendarActions}
                        />
                    </Activity>

                    <Activity mode={showTableView ? "visible" : "hidden"}>
                        <MaintenancesTable
                            maintenances={maintenances}
                            isLoading={isLoading}
                            renderActions={renderTableActions}
                            onRowClick={handleViewMaintenance}
                            clickableRows
                        />
                    </Activity>
                </div>
            </div>

            {/* View modal */}
            <MaintenanceViewModal
                open={viewModalOpen}
                onOpenChange={setViewModalOpen}
                maintenance={viewMaintenance}
                renderActions={renderViewModalActions}
            />

            {/* Edit / Create modal */}
            {orgId && vehicleId && (
                <MaintenanceEditModal
                    open={editModalOpen}
                    onOpenChange={setEditModalOpen}
                    onMaintenanceCreatedOrUpdated={fetchMaintenances}
                    orgId={orgId}
                    vehicleId={vehicleId}
                    maintenance={selectedMaintenance}
                    mode={editMode}
                    renderActions={(maintenance: VehicleMaintenance, closeModal: () => void) => (
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("common.delete", "Delete"),
                                    icon: "trash-2",
                                    onClick: () => {
                                        closeModal();
                                        handleOpenDeleteModal(maintenance);
                                    },
                                    variant: "destructive" as const,
                                },
                            ]}
                        />
                    )}
                />
            )}

            {/* Delete modal */}
            <DeleteModal
                open={deleteModalOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteModalOpen(false);
                        setDeletingMaintenance(null);
                    }
                }}
                title={t("maintenance.deleteMaintenance", "Delete Maintenance")}
                description={t(
                    "maintenance.deleteMaintenanceDescription",
                    "Are you sure you want to delete this maintenance record? This action cannot be undone."
                )}
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleting}
                contentClassName="max-w-md"
            >
                {deletingMaintenance && (
                    <div className="space-y-2 p-3 rounded-md bg-muted/50 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{t("maintenance.period", "Period")}:</span>
                            <span className="font-medium">
                                {formatDate(new Date(deletingMaintenance.from_date), { showTime: false, showYear: true, useUTC: true })}
                                {" – "}
                                {formatDate(new Date(deletingMaintenance.to_date), { showTime: false, showYear: true, useUTC: true })}
                            </span>
                        </div>
                        {deletingMaintenance.notes && (
                            <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">{t("maintenance.notes", "Notes")}:</span>
                                <span className="truncate">{deletingMaintenance.notes}</span>
                            </div>
                        )}
                    </div>
                )}
            </DeleteModal>
        </>
    );
};

export default VehicleDetailPageMaintenance;
