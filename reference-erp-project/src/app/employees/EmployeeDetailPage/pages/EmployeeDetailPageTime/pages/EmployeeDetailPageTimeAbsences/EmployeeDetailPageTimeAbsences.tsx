import { useState, useMemo, useRef, Activity } from "react";
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
import { useTranslation } from "@/hooks/useTranslation";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  List,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useParams } from "react-router";
import { useEmployee } from "@/app/employees/contexts/EmployeeContext";
import { postEmployeeAbsence } from "@/api/employees/absences/absences";
import {
  deleteAbsence,
  postAbsenceStatus,
  patchAbsence,
} from "@/api/orgs/absences/absences";
import { Absence } from "@/types/employees/absences";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import AbsenceEditModal from "@/app/absences/components/modals/absence-edit-modal";
import AbsenceEditAdminModal from "@/app/absences/components/modals/absence-edit-admin-modal";
import AbsenceViewModal from "@/app/absences/components/modals/absence-view-modal";
import AbsenceVerificationModal from "@/app/absences/components/modals/absence-verification-modal";
import AbsencesCalendar from "@/app/absences/components/absences-calendar";
import AbsencesTable from "@/app/absences/components/absences-table";
import AbsenceDeleteModal from "@/app/absences/components/modals/absence-delete-modal";
import CountersSummaryCard from "./components/counters-summary-card";
import CounterAdjustmentModal from "./components/counter-adjustment-modal";
import SickLeavesCard, {
  type SickLeavesCardHandle,
} from "./components/sick-leaves-card";
import HolidaysCard from "./components/holidays-card";
import { postEmployeeAbsencesAdjustments, postEmployeeAbsencesModifyCounters } from "@/api/employees/absences/absences";
import { IconLabel } from "@/app/components/custom-labels";
import { cn } from "@/lib/utils";


const EmployeeDetailPageTimeAbsences = () => {
  const { t } = useTranslation();
  const { employee, selectedYear, setSelectedYear, holidays, sickLeaves, refreshHolidaysAndSickLeaves, absences, absenceTracker, absenceTypesList, refreshAbsences } = useEmployee();
  const sickLeavesCardRef = useRef<SickLeavesCardHandle>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [isLoading] = useState(false);
  const [preSelectedDate, setPreSelectedDate] = useState<Date | null>(null);
  const [showTableView, setShowTableView] = useState(false);

  const handleToggleView = () => {
    setShowTableView(!showTableView);
  };
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewAbsence, setViewAbsence] = useState<Absence | null>(null);
  const { orgId } = useParams<{ orgId: string }>();

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingAbsence, setDeletingAbsence] = useState<Absence | null>(null);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  // Verification modal state
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [verificationAbsence, setVerificationAbsence] =
    useState<Absence | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<
    "approved" | "rejected"
  >("approved");
  const [verificationReason, setVerificationReason] = useState("");
  const [isVerificationSubmitting, setIsVerificationSubmitting] =
    useState(false);

  // Counter edit modal state
  const [isCounterEditModalOpen, setIsCounterEditModalOpen] = useState(false);

  // Calendar legend: filter by absence type (null = "All types")
  const [selectedAbsenceTypeFilter, setSelectedAbsenceTypeFilter] = useState<string | null>(null);

  // Absences to show in calendar (filtered by type, excluding rejected)
  const absencesForCalendar = useMemo(() => {
    const nonRejected = absences.filter((a) => a.status !== "rejected");
    if (selectedAbsenceTypeFilter === "holidays" || selectedAbsenceTypeFilter === "sick_leave") {
      return [];
    }
    if (!selectedAbsenceTypeFilter || selectedAbsenceTypeFilter === "all") {
      return nonRejected;
    }
    return nonRejected.filter((a) => a.absence_type?.id === selectedAbsenceTypeFilter);
  }, [absences, selectedAbsenceTypeFilter]);

  const sickLeavesForCalendarYear = useMemo(() => {
    if (!sickLeaves?.length) return [];
    const yStart = new Date(selectedYear, 0, 1);
    const yEnd = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
    return sickLeaves.filter((sl) => {
      const start = new Date(sl.start_date);
      const end = new Date(sl.end_date);
      return start <= yEnd && end >= yStart;
    });
  }, [sickLeaves, selectedYear]);

  const holidaysForCalendar = useMemo(() => {
    if (selectedAbsenceTypeFilter === "sick_leave") return [];
    return holidays;
  }, [holidays, selectedAbsenceTypeFilter]);

  const sickLeavesForCalendarDisplay = useMemo(() => {
    if (selectedAbsenceTypeFilter === "holidays") return [];
    return sickLeavesForCalendarYear;
  }, [sickLeavesForCalendarYear, selectedAbsenceTypeFilter]);

  // Only show type filter buttons for types that have at least one absence
  const absenceTypesWithAbsences = useMemo(() => {
    const typeIdsPresent = new Set(absences.map((a) => a.absence_type?.id).filter(Boolean));
    return absenceTypesList.filter((t) => typeIdsPresent.has(t.id));
  }, [absenceTypesList, absences]);

  // Delete handlers
  const handleOpenDeleteModal = (absence: Absence) => {
    setDeletingAbsence(absence);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingAbsence(null);
    setIsDeleteSubmitting(false);
  };

  const handleConfirmDelete = async () => {
    if (!orgId || !deletingAbsence) return;

    setIsDeleteSubmitting(true);
    try {
      const response = await deleteAbsence(orgId, deletingAbsence.id);

      if (response.success) {
        toast.success(
          t("absences.deleteSuccess", "Absence deleted successfully")
        );
        refreshAbsences();
        handleCloseDeleteModal();
      } else {
        toast.error(
          response.error?.message ||
          t("absences.deleteError", "Error deleting absence")
        );
      }
    } catch (error) {
      toast.error(t("absences.deleteError", "Error deleting absence"));
      console.error("Error deleting absence:", error);
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  // Generate available years (current year ± 5 years)
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 5; year <= currentYear + 5; year++) {
      years.push(year);
    }
    return years;
  }, []);

  // Action handlers
  const handleEditAbsence = (absence: Absence) => {
    setSelectedAbsence(absence);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleViewAbsence = (absence: Absence | null) => {
    setViewAbsence(absence);
    setIsViewModalOpen(true);
  };

  // Verification modal handlers
  const handleOpenVerificationModal = (
    absence: Absence,
    status: "approved" | "rejected"
  ) => {
    setVerificationAbsence(absence);
    setVerificationStatus(status);
    setVerificationReason("");
    setIsVerificationModalOpen(true);
  };

  const handleCloseVerificationModal = () => {
    setIsVerificationModalOpen(false);
    setVerificationAbsence(null);
    setVerificationReason("");
    setIsVerificationSubmitting(false);
  };

  const handleSubmitVerification = async () => {
    if (!verificationAbsence || !orgId) return;

    setIsVerificationSubmitting(true);
    try {
      const response = await postAbsenceStatus(orgId, {
        absence_ids: [verificationAbsence.id],
        status: verificationStatus,
        reason: verificationReason || null,
      });
      if (response.success) {
        toast.success(
          t(
            "absences.verificationSuccess",
            "Absence status updated successfully"
          )
        );
        refreshAbsences();
        handleCloseVerificationModal();
      } else {
        toast.error(
          t("absences.verificationError", "Error updating absence status")
        );
      }
    } catch (error) {
      console.error("Error updating absence status:", error);
      toast.error(
        t("absences.verificationError", "Error updating absence status")
      );
    } finally {
      setIsVerificationSubmitting(false);
    }
  };

  const handleAddAbsence = (date: Date | null) => {
    setPreSelectedDate(date);
    setSelectedAbsence(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  // Modal handlers
  const handleNewAbsence = () => {
    setSelectedAbsence(null);
    setPreSelectedDate(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleAbsenceCreatedOrUpdated = () => {
    refreshAbsences();
    setPreSelectedDate(null);
  };

  const handleModalClose = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setPreSelectedDate(null);
    }
  };

  // Custom API functions for admin control over employee absences
  const handleCreateAbsence = async (data: {
    absence_type_id: string;
    absence_counter_id: string;
    start_date: string;
    end_date: string;
    notes: string | null;
  }) => {
    if (!orgId || !employee) return { error: "Missing orgId or employee" };
    return postEmployeeAbsence(orgId, employee.id, data);
  };

  // Custom update function for admin editing (when editing someone else's absence)
  const handleAdminUpdateAbsence = async (
    absenceId: string,
    data: {
      status: string;
      reason: string | null;
      start_date: string;
      end_date: string;
    }
  ) => {
    if (!orgId) return { error: "Missing orgId" };
    // Use org-level patchAbsence for admin control
    return patchAbsence(orgId, absenceId, data);
  };

  // Common action items for both table and calendar (admin view with approve/reject)
  const getAbsenceActionItems = (
    absence: Absence,
    closePopover?: () => void
  ) => {
    const status = absence.status;
    return [
      {
        label: t("common.view", "View"),
        icon: "eye",
        onClick: () => {
          handleViewAbsence(absence);
          closePopover?.();
        },
      },
      ...(status !== "approved" && status !== "pending"
        ? [
          {
            label: t("common.approve", "Approve"),
            icon: "check",
            onClick: () => {
              handleOpenVerificationModal(absence, "approved");
              closePopover?.();
            },
          },
        ]
        : []),
      ...(status !== "rejected" && status !== "pending"
        ? [
          {
            label: t("common.reject", "Reject"),
            icon: "x",
            onClick: () => {
              handleOpenVerificationModal(absence, "rejected");
              closePopover?.();
            },
          },
        ]
        : []),
      // Allow editing for pending, approved, or rejected absences (not cancelled)
      ...(status === "cancelled"
        ? [
          {
            label: t("common.edit", "Edit"),
            icon: "edit",
            onClick: () => {
              handleEditAbsence(absence);
              closePopover?.();
            },
          },
        ]
        : []),
      {
        label: t("common.delete", "Delete"),
        icon: "trash-2",
        onClick: () => {
          handleOpenDeleteModal(absence);
          closePopover?.();
        },
        variant: "destructive" as const,
      },
    ];
  };

  // Render approve/reject buttons for pending absences
  const renderApproveRejectButtons = (
    absence: Absence,
    onComplete?: () => void
  ) => {
    if (absence.status !== "pending") return null;

    return (
      <>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenVerificationModal(absence, "rejected");
            onComplete?.();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenVerificationModal(absence, "approved");
            onComplete?.();
          }}
        >
          <Check className="h-4 w-4" />
        </Button>
      </>
    );
  };

  // Custom render function for table actions (admin view with approve/reject buttons)
  const renderTableActions = (absence: Absence) => {
    return (
      <div className="flex items-center gap-2 justify-end">
        {/* Show approve/reject buttons for pending status */}
        {renderApproveRejectButtons(absence)}
        <CustomActionsDropdown items={getAbsenceActionItems(absence)} />
      </div>
    );
  };

  // Custom render function for calendar popover actions
  const renderCalendarActions = (
    absence: Absence,
    closePopover: () => void
  ) => {
    return (
      <CustomActionsDropdown
        items={getAbsenceActionItems(absence, closePopover)}
      />
    );
  };

  // Render function for modal header actions (excludes View option, includes approve/reject)
  const renderModalActions = (absence: Absence) => {
    const status = absence.status;
    const items = [
      // For approved, show reject option

      {
        showOption: status === "approved",
        label: t("absences.reject", "Reject"),
        icon: "x",
        onClick: () => {
          setIsViewModalOpen(false);
          handleOpenVerificationModal(absence, "rejected");
        },
      },

      {
        showOption: status === "rejected",
        label: t("absences.approve", "Approve"),
        icon: "check",
        onClick: () => {
          setIsViewModalOpen(false);
          handleOpenVerificationModal(absence, "approved");
        },
      },
      {
        showOption: status !== "cancelled",
        label: t("common.edit", "Edit"),
        icon: "edit",
        onClick: () => {
          setIsViewModalOpen(false);
          handleEditAbsence(absence);
        },
      },
      {
        label: t("common.delete", "Delete"),
        icon: "trash-2",
        onClick: () => handleOpenDeleteModal(absence),
        variant: "destructive" as const,
      },
    ];
    return <CustomActionsDropdown items={items} />;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
          <PageHeader
            title={
              <span className="text-[16px] font-semibold">
                {t(
                  "dashboard.absences.annualAbsencesView",
                  "Annual Absences View"
                )}
              </span>
            }
            showBackButton={false}
            action={
              <div className="flex items-center gap-2">
                {/* Year selectors / clear buttons */}
                {selectedYear !== new Date().getFullYear() && (
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => setSelectedYear(new Date().getFullYear())}
                    disabled={isLoading}
                  >
                    {t("dashboard.absences.currentYear", "Current Year")}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setSelectedYear(selectedYear - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                  <SelectTrigger className="w-[fit]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setSelectedYear(selectedYear + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {/* View Toggle Button */}
                <Tabs value={showTableView ? 'table' : 'calendar'} onValueChange={handleToggleView}>
                  <TabsList className="flex items-center gap-2 border-none rounded-md" activeClassName='border-none rounded-md'>
                    <TabsTrigger className="py-0" value="calendar"><CalendarDays className="h-4 w-4" /></TabsTrigger>
                    <TabsTrigger className="py-0" value="table"><List className="h-4 w-4" /></TabsTrigger>
                  </TabsList>
                </Tabs>
                {/* Add absence button */}
                <Button onClick={handleNewAbsence}>
                  <Plus className="h-4 w-4" />
                  {t("dashboard.absences.addAbsence", "Add Absence")}
                </Button>
              </div>
            }
          />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Legend and Statistics */}
        <div className="lg:col-span-1">
          <div className="flex flex-col gap-4">
            {absenceTracker && (
              <CountersSummaryCard
                tracker={absenceTracker}
                onEdit={() => setIsCounterEditModalOpen(true)}
                showEdit={true}
              />
            )}
            <SickLeavesCard
              ref={sickLeavesCardRef}
              selectedYear={selectedYear}
              employeeId={employee.id}
              sickLeaves={sickLeaves}
              onSickLeavesChange={refreshHolidaysAndSickLeaves}
            />
            <HolidaysCard holidays={holidays} />
          </div>
        </div>

        <div className="lg:col-span-2 min-w-0">
          {/* Calendar View */}
          <Activity mode={!showTableView ? "visible" : "hidden"}>
            <div className="space-y-0">
              <AbsencesCalendar
                selectedYear={selectedYear}
                absences={absencesForCalendar}
                sickLeaves={sickLeavesForCalendarDisplay}
                holidays={holidaysForCalendar}
                onAddAbsence={handleAddAbsence}
                onViewAbsence={handleViewAbsence}
                onViewSickLeave={(sl) => sickLeavesCardRef.current?.openView(sl)}
                renderActions={renderCalendarActions}
              />
              {/* Filterable legend by absence type */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedAbsenceTypeFilter(selectedAbsenceTypeFilter === "all" ? null : "all")}
                    className={cn(
                      "px-4 py-2 rounded-md border transition-colors flex items-center gap-2",
                      (!selectedAbsenceTypeFilter || selectedAbsenceTypeFilter === "all") && "bg-accent/50 ring-1 ring-border"
                    )}
                  >
                    <span className="text-sm font-semibold">
                      {t("absences.allTypes", "All Types")}
                    </span>
                  </button>
                  {holidays.length >= 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedAbsenceTypeFilter(
                          selectedAbsenceTypeFilter === "holidays" ? null : "holidays"
                        )
                      }
                      className={cn(
                        "px-4 py-2 rounded-md border transition-colors flex items-center gap-2",
                        selectedAbsenceTypeFilter === "holidays" && "bg-accent/50 ring-1 ring-border"
                      )}
                    >
                    <IconLabel
                      icon={null}
                      text={t("workplaces.holidays", "Holidays")}
                      color={"gray"}
                      size="sm"
                    />
                    </button>
                  )}
                  {sickLeavesForCalendarYear.length >= 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedAbsenceTypeFilter(
                          selectedAbsenceTypeFilter === "sick_leave" ? null : "sick_leave"
                        )
                      }
                      className={cn(
                        "px-4 py-2 rounded-md border transition-colors flex items-center gap-2",
                        selectedAbsenceTypeFilter === "sick_leave" && "bg-accent/50 ring-1 ring-border"
                      )}
                    >
                      <IconLabel
                        icon={null}
                        text={t("absences.legendSickLeave", "Sick Leave")}
                        color="red"
                        size="sm"
                      />
                    </button>
                  )}
                  {absenceTypesWithAbsences.map((absenceType) => (
                    <button
                      key={absenceType.id}
                      type="button"
                      onClick={() =>
                        setSelectedAbsenceTypeFilter(
                          selectedAbsenceTypeFilter === absenceType.id ? null : absenceType.id
                        )
                      }
                      className={cn(
                        "px-4 py-2 rounded-md border transition-colors flex items-center gap-2",
                        selectedAbsenceTypeFilter === absenceType.id && "bg-accent/50 ring-1 ring-border"
                      )}
                    >
                      <IconLabel
                        icon={absenceType.icon_url || null}
                        text={absenceType.name}
                        color={absenceType.color}
                        size="sm"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Activity>

          {/* Table View */}
          <Activity mode={showTableView ? "visible" : "hidden"}>
            <AbsencesTable
              absences={absences}
              isLoading={isLoading}
              hiddenColumns={["employee", "responded_by", "notes", "start_date", "end_date", "year"]}
              renderActions={renderTableActions}
              onRowClick={(absence) => handleViewAbsence(absence)}
              clickableRows
            />
          </Activity>
        </div>
      </div>

      {/* Create Absence Modal (Admin creating on behalf of employee) */}
      {orgId && employee && modalMode === "create" && (
        <AbsenceEditModal
          open={isModalOpen}
          onOpenChange={handleModalClose}
          onAbsenceCreatedOrUpdated={handleAbsenceCreatedOrUpdated}
          orgId={orgId}
          employeeId={employee.id}
          absence={null}
          mode="create"
          preSelectedDate={preSelectedDate}
          onCreateAbsence={handleCreateAbsence}
        />
      )}

      {/* Edit Absence Modal (Admin editing employee's absence) */}
      {orgId && employee && modalMode === "edit" && selectedAbsence && (
        <AbsenceEditAdminModal
          open={isModalOpen}
          onOpenChange={handleModalClose}
          onAbsenceUpdated={handleAbsenceCreatedOrUpdated}
          orgId={orgId}
          employeeId={selectedAbsence.employee.id}
          absence={selectedAbsence}
          onUpdateAbsence={handleAdminUpdateAbsence}
          renderActions={(absence, closeModal) => (
            <CustomActionsDropdown
              items={[
                {
                  label: t("common.delete", "Delete"),
                  icon: "trash-2",
                  onClick: () => {
                    closeModal();
                    handleOpenDeleteModal(absence);
                  },
                  variant: "destructive",
                },
              ]}
            />
          )}
        />
      )}

      {/* View Absence Modal */}
      {orgId && employee && (
        <AbsenceViewModal
          open={isViewModalOpen}
          onOpenChange={setIsViewModalOpen}
          orgId={orgId}
          employeeId={viewAbsence?.employee.id || employee.id || ""}
          absenceId={viewAbsence?.id || null}
          renderActions={renderModalActions}
          renderFooterActions={
            viewAbsence?.status === "pending"
              ? () => (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleOpenVerificationModal(viewAbsence, "rejected");
                    }}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4" />
                    {t("absences.reject", "Reject")}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleOpenVerificationModal(viewAbsence, "approved");
                    }}
                    disabled={isLoading}
                  >
                    <Check className="h-4 w-4" />
                    {t("common.accept", "Accept")}
                  </Button>
                </div>
              )
              : undefined
          }
        />
      )}

      {/* Delete Modal */}
      <AbsenceDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        absence={deletingAbsence}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleteSubmitting}
      />

      {/* Verification Modal */}
      <AbsenceVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={handleCloseVerificationModal}
        absence={verificationAbsence}
        verificationStatus={verificationStatus}
        verificationReason={verificationReason}
        onReasonChange={setVerificationReason}
        onSubmit={handleSubmitVerification}
        isSubmitting={isVerificationSubmitting}
      />

      {/* Counter Edit Modal */}
      {orgId && employee && (
        <CounterAdjustmentModal
          open={isCounterEditModalOpen}
          onOpenChange={setIsCounterEditModalOpen}
          orgId={orgId}
          employeeId={employee.id}
          onSuccess={() => {
            refreshAbsences();
          }}
          title={t("employees.absences.editCounter", "Edit Counter")}
          successMessage={t("employees.absences.counterModified", "Counter Modified")}
          errorMessage={t("employees.absences.errorModifyingCounter", "Error Modifying Counter")}
          submitAction={postEmployeeAbsencesAdjustments}
          adjustmentMode="adjustment"
          modifyCounterAction={postEmployeeAbsencesModifyCounters}
          adjustmentAction={postEmployeeAbsencesAdjustments}
        />
      )}
    </div>
  );
};

export default EmployeeDetailPageTimeAbsences;
