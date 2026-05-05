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
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  List,
} from "lucide-react";
import { useParams } from "react-router";
import { postMeAbsenceCancel } from "@/api/employees/absences/absences";
import { Absence } from "@/types/employees/absences";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import AbsenceEditModal from "@/app/absences/components/modals/absence-edit-modal";
import AbsenceViewModal from "@/app/absences/components/modals/absence-view-modal";
import AbsencesCalendar from "@/app/absences/components/absences-calendar";
import AbsencesTable from "@/app/absences/components/absences-table";
import CountersSummaryCard from "@/app/employees/EmployeeDetailPage/pages/EmployeeDetailPageTime/pages/EmployeeDetailPageTimeAbsences/components/counters-summary-card";
import SickLeavesCard, {
  type SickLeavesCardHandle,
} from "@/app/employees/EmployeeDetailPage/pages/EmployeeDetailPageTime/pages/EmployeeDetailPageTimeAbsences/components/sick-leaves-card";
import HolidaysCard from "@/app/employees/EmployeeDetailPage/pages/EmployeeDetailPageTime/pages/EmployeeDetailPageTimeAbsences/components/holidays-card";
import { useEmployee } from "@/app/dashboard/contexts/DashboardEmployeeContext";
import { IconLabel } from "@/app/components/custom-labels";
import { cn } from "@/lib/utils";

const DashboardEmployeePageTimeAbsences = () => {
  const { t } = useTranslation();
  const { selectedYear, setSelectedYear, holidays, sickLeaves, refreshHolidaysAndSickLeaves, absences, absenceTracker, absenceTypesList, refreshAbsences } = useEmployee();
  const sickLeavesCardRef = useRef<SickLeavesCardHandle>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [isLoading, setIsLoading] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewAbsence, setViewAbsence] = useState<Absence | null>(null);
  const [preSelectedDate, setPreSelectedDate] = useState<Date | null>(null);
  const [showTableView, setShowTableView] = useState(false);

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

  const handleToggleView = () => {
    setShowTableView(!showTableView);
  };
  const { orgId } = useParams<{ orgId: string }>();

  const cancelAbsence = async (absenceId: string) => {
    if (!orgId) return;
    try {
      setIsLoading(true);
      const response = await postMeAbsenceCancel(orgId, absenceId);
      if (response.success) {
        toast.success(t("absences.canceled", "Absence canceled successfully"));
        refreshAbsences();
      } else {
        toast.error(t("absences.errorCanceling", "Error canceling absence"));
      }
    } catch (error) {
      console.error("Error canceling absence:", error);
    } finally {
      setIsLoading(false);
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
  const handleViewAbsence = (absence: Absence) => {
    setViewAbsence(absence);
    setIsViewModalOpen(true);
  };

  const handleEditAbsence = (absence: Absence) => {
    setSelectedAbsence(absence);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCancelAbsence = (absenceId: string) => {
    cancelAbsence(absenceId);
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

  // Common action items for both table and calendar
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
      {
        showOption: status === "pending",
        label: t("common.cancel", "Cancel"),
        icon: "ban",
        variant: "destructive" as const,
        onClick: () => {
          handleCancelAbsence(absence.id);
          closePopover?.();
        },
      },
    ];
  };

  // Custom render function for table actions
  const renderTableActions = (absence: Absence) => {
    return (
      <div className="flex items-center gap-2 justify-end">
        <CustomActionsDropdown items={getAbsenceActionItems(absence)} />
      </div>
    );
  };

  // Render function for modal header actions (excludes View option)
  const renderModalActions = (absence: Absence) => {
    const status = absence.status;
    const items = [
      ...(status === "pending"
        ? [
          {
            label: t("common.cancel", "Cancel"),
            icon: "ban",
            variant: "destructive" as const,
            onClick: () => handleCancelAbsence(absence.id),
          },
        ]
        : []),
    ];

    // Only render dropdown if there are actions available
    if (items.length === 0) return null;
    return <CustomActionsDropdown items={items} />;
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

  return (
    <>
      {/* Header */}
      <div className="space-y-4">
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
                <CountersSummaryCard tracker={absenceTracker} />
              )}
              <SickLeavesCard
                ref={sickLeavesCardRef}
                selectedYear={selectedYear}
                employeeId="me"
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
                          text={t("absences.legendSickLeaves", "Sick Leaves")}
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
      </div>


      {/* Absence Modal */}
      {orgId && (
        <AbsenceEditModal
          open={isModalOpen}
          onOpenChange={handleModalClose}
          onAbsenceCreatedOrUpdated={handleAbsenceCreatedOrUpdated}
          orgId={orgId}
          employeeId="me"
          absence={selectedAbsence}
          mode={modalMode}
          preSelectedDate={preSelectedDate}
          renderActions={
            selectedAbsence?.status === "pending"
              ? (absence, closeModal) => (
                <CustomActionsDropdown
                  items={[
                    {
                      label: t("common.cancel", "Cancel"),
                      icon: "ban",
                      onClick: () => {
                        closeModal();
                        handleCancelAbsence(absence.id);
                      },
                      variant: "destructive",
                    },
                  ]}
                />
              )
              : undefined
          }
        />
      )}

      {/* View Absence Modal */}
      {orgId && (
        <AbsenceViewModal
          open={isViewModalOpen}
          onOpenChange={setIsViewModalOpen}
          orgId={orgId}
          employeeId="me"
          absenceId={viewAbsence?.id || null}
          renderActions={renderModalActions}
        />
      )}
    </>
  );
};

export default DashboardEmployeePageTimeAbsences;
