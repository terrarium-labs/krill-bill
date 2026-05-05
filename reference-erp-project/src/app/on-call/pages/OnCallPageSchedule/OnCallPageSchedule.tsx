import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrgOnCallShifts, deleteOrgOnCallShift } from "@/api/field-service/on-call/on-call-shifts";
import type { OnCallGroup } from "@/types/field-service/on-call/groups";
import { OnCallShift } from "@/types/field-service/on-call/on-call-shifts";
import { toast } from "sonner";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/shadcn-io/tabs";
import {
  formatDateForAPI,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  isCurrentMonth,
} from "@/utils/miscelanea";
import SearchBar from "@/app/components/search-bar";
import OnCallCalendar from "./components/on-call-calendar";
import OnCallYearCalendar from "./components/on-call-year-calendar";
import OnCallPrintShiftsButton from "./components/on-call-print-shifts-button";
import OnCallShiftEditModal from "./components/on-call-shift-edit-modal";
import OnCallShiftDeleteModal from "./components/on-call-shift-delete-modal";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { cn } from "@/lib/utils";

const OnCallPageSchedule = () => {
  const { t } = useTranslation();
  const { orgId } = useParams<{ orgId: string }>();

  const [shifts, setShifts] = useState<OnCallShift[]>([]);
  const [isLoadingShifts, setIsLoadingShifts] = useState(true);
  const [showMonthView, setShowMonthView] = useState(true);
  const [currentMonthStart, setCurrentMonthStart] = useState<Date>(() =>
    getFirstDayOfMonth(new Date())
  );
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState("");
  const [addShiftModalOpen, setAddShiftModalOpen] = useState(false);
  const [shiftToEdit, setShiftToEdit] = useState<OnCallShift | null>(null);
  const [shiftToDelete, setShiftToDelete] = useState<OnCallShift | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const periodRange = useMemo(() => {
    if (showMonthView) {
      const first = getFirstDayOfMonth(currentMonthStart);
      const last = getLastDayOfMonth(currentMonthStart);
      return {
        fromDate: formatDateForAPI(first),
        toDate: formatDateForAPI(last),
      };
    }
    return {
      fromDate: `${selectedYear}-01-01`,
      toDate: `${selectedYear}-12-31`,
    };
  }, [showMonthView, currentMonthStart, selectedYear]);

  const fetchShifts = useCallback(async () => {
    if (!orgId) return;
    setIsLoadingShifts(true);
    try {
      const response = await getOrgOnCallShifts(
        orgId,
        periodRange.fromDate,
        periodRange.toDate
      );
      if (response.success && response.success.on_call_shifts) {
        setShifts(response.success.on_call_shifts as OnCallShift[]);
      } else {
        setShifts([]);
      }
    } catch (error) {
      console.error("Error fetching on call shifts:", error);
      toast.error(t("on-call.errorLoadingShifts", "Error loading shifts"));
      setShifts([]);
    } finally {
      setIsLoadingShifts(false);
    }
  }, [orgId, periodRange.fromDate, periodRange.toDate]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const handlePrevPeriod = () => {
    if (showMonthView) {
      const prev = new Date(currentMonthStart);
      prev.setMonth(prev.getMonth() - 1);
      setCurrentMonthStart(prev);
    } else {
      setSelectedYear((y) => y - 1);
    }
  };

  const handleNextPeriod = () => {
    if (showMonthView) {
      const next = new Date(currentMonthStart);
      next.setMonth(next.getMonth() + 1);
      setCurrentMonthStart(next);
    } else {
      setSelectedYear((y) => y + 1);
    }
  };

  const handleCurrentPeriod = () => {
    if (showMonthView) {
      setCurrentMonthStart(getFirstDayOfMonth(new Date()));
    } else {
      setSelectedYear(new Date().getFullYear());
    }
  };

  const isCurrentPeriod = () => {
    if (showMonthView) return isCurrentMonth(currentMonthStart);
    return selectedYear === new Date().getFullYear();
  };

  const getPeriodRangeText = () => {
    if (showMonthView) {
      return format(currentMonthStart, "MMMM yyyy");
    }
    return String(selectedYear);
  };

  const handleEditShift = useCallback((shift: OnCallShift) => {
    setShiftToEdit(shift);
  }, []);

  const handleDeleteShift = useCallback((shift: OnCallShift) => {
    setShiftToDelete(shift);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!orgId || !shiftToDelete) return;
    setIsDeleting(true);
    try {
      const response = await deleteOrgOnCallShift(orgId, shiftToDelete.id);
      if (response.success) {
        toast.success(t("on-call.shifts.deleted", "Shift deleted"));
        setShiftToDelete(null);
        fetchShifts();
      } else {
        toast.error(t("on-call.shifts.errorDeleting", "Error deleting shift"));
      }
    } catch (error) {
      console.error("Error deleting shift:", error);
      toast.error(t("on-call.shifts.errorDeleting", "Error deleting shift"));
    } finally {
      setIsDeleting(false);
    }
  }, [orgId, shiftToDelete, fetchShifts, t]);

  const groupsMap = useMemo(() => {
    const map = new Map<string, OnCallGroup>();
    for (const shift of shifts) {
      if (!map.has(shift.group.id)) {
        map.set(shift.group.id, shift.group);
      }
    }
    return map;
  }, [shifts]);

  const filteredShifts = useMemo(() => {
    if (!searchQuery.trim()) return shifts;
    const q = searchQuery.toLowerCase();
    return shifts.filter((s) => {
      const groupName = groupsMap.get(s.group.id)?.name ?? s.group.name ?? "";
      return groupName.toLowerCase().includes(q);
    });
  }, [shifts, groupsMap, searchQuery]);

  return (
    <>
      <div className="flex items-center gap-2 mb-0">
        <SearchBar
          value={searchQuery}
          onChange={(query) => setSearchQuery(query)}
          placeholder={t("on-call.searchPlaceholder", "Search for groups or employees...")}
          className="flex-1"
        />
        <div className="flex items-center gap-4 shrink-0">
          {!isCurrentPeriod() && (
            <Button variant="outline" size="sm" onClick={handleCurrentPeriod}>
              {showMonthView
                ? t("on-call.currentMonth", "Current Month")
                : t("on-call.currentYear", "Current Year")}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handlePrevPeriod}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className={cn("text-sm font-semibold text-center", showMonthView ? "min-w-[150px]" : "min-w-[80px]")}>
            {getPeriodRangeText()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPeriod}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Tabs
            value={showMonthView ? "month" : "year"}
            onValueChange={(v) => setShowMonthView(v === "month")}
          >
            <TabsList
              className="flex items-center gap-2 border-none rounded-md"
              activeClassName="border-none rounded-md"
            >
              <TabsTrigger className="py-0" value="month">
                {t("on-call.month", "Month")}
              </TabsTrigger>
              <TabsTrigger className="py-0" value="year">
                {t("on-call.year", "Year")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <OnCallPrintShiftsButton
            shifts={filteredShifts}
            groupsMap={groupsMap}
            showMonthView={showMonthView}
            currentMonthStart={currentMonthStart}
            selectedYear={selectedYear}
          />
          <Button
            size="sm"
            onClick={() => {
              setShiftToEdit(null);
              setAddShiftModalOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("on-call.shifts.addShift", "Add shift")}
          </Button>
          
        </div>
      </div>

      <OnCallShiftEditModal
        open={addShiftModalOpen || !!shiftToEdit}
        onOpenChange={(open) => {
          if (!open) {
            setAddShiftModalOpen(false);
            setShiftToEdit(null);
          }
        }}
        shift={shiftToEdit}
        initialPayload={{
          start_date: showMonthView
            ? getFirstDayOfMonth(currentMonthStart).toISOString()
            : new Date(selectedYear, 0, 1).toISOString(),
          end_date: showMonthView
            ? getFirstDayOfMonth(currentMonthStart).toISOString()
            : new Date(selectedYear, 0, 1).toISOString(),
        }}
        onSuccess={() => {
          fetchShifts();
          setShiftToEdit(null);
        }}
        renderActions={(shift, closeModal) => (
          <CustomActionsDropdown
            items={[
              {
                label: t("common.delete", "Delete"),
                icon: "trash-2",
                variant: "destructive",
                onClick: () => {
                  closeModal();
                  setShiftToDelete(shift);
                },
              },
            ]}
          />
        )}
      />

      <OnCallShiftDeleteModal
        isOpen={!!shiftToDelete}
        onClose={() => setShiftToDelete(null)}
        shift={shiftToDelete}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

      <div className="flex flex-col gap-4">
        {showMonthView ? (
          <OnCallCalendar
            monthStart={currentMonthStart}
            shifts={filteredShifts}
            employees={[]}
            groupsMap={groupsMap}
            isLoading={isLoadingShifts}
            triggerMode="hover"
            onEditShift={handleEditShift}
            onDeleteShift={handleDeleteShift}
            onEmployeesAdded={fetchShifts}
          />
        ) : (
          <OnCallYearCalendar
            selectedYear={selectedYear}
            shifts={filteredShifts}
            employees={[]}
            groupsMap={groupsMap}
            isLoading={isLoadingShifts}
            triggerMode="hover"
            onEditShift={handleEditShift}
            onDeleteShift={handleDeleteShift}
            onEmployeesAdded={fetchShifts}
          />
        )}
      </div>
    </>
  );
};

export default OnCallPageSchedule;
