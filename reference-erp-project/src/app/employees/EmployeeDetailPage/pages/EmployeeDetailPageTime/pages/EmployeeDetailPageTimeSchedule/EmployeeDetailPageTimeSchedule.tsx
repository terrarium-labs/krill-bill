import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEmployeeOnCallShifts } from "@/api/employees/on-call-shifts/on-call-shifts";
import type { OnCallGroup } from "@/types/field-service/on-call/groups";
import { OnCallShift } from "@/types/field-service/on-call/on-call-shifts";
import type { TimePolicy } from "@/types/general/time-policies";
import { toast } from "sonner";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/shadcn-io/tabs";
import {
  formatDateForAPI,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  isCurrentMonth,
} from "@/utils/miscelanea";
import PageHeader from "@/app/components/page-header";
import OnCallCalendar from "../../components/employee-schedule-calendar/on-call-calendar";
import OnCallYearCalendar from "../../components/employee-schedule-calendar/on-call-year-calendar";
import type { YearCalendarCellVariant } from "../../components/employee-schedule-calendar/year-calendar-day-visual";
import OnCallPrintShiftsButton from "../../components/employee-schedule-calendar/on-call-print-shifts-button";
import { EmployeeScheduleCalendarLegend } from "../../components/employee-schedule-calendar/employee-schedule-calendar-legend";
import { cn } from "@/lib/utils";
import {
  eachCalendarDateInMonthView,
  eachCalendarDateInYear,
  getEffectivePolicyTimeSlotsForCalendarDisplay,
} from "../../utils/effective-policy-time-slots";
import {
  toPolicyDayDisplayInfo,
  type PolicyDayDisplayInfo,
} from "../../utils/policy-day-display";

const EmployeeDetailPageTimeSchedule = ({
  employeeId,
  timePolicy,
  yearCalendarVariant = "type",
}: {
  employeeId: string;
  timePolicy: TimePolicy | null;
  /** Year grid cell paint: `type` = green/orange/purple by category (default for employee schedule). */
  yearCalendarVariant?: YearCalendarCellVariant;
}) => {
  const { t } = useTranslation();
  const { orgId } = useParams<{ orgId: string }>();

  const [shifts, setShifts] = useState<OnCallShift[]>([]);
  const [isLoadingShifts, setIsLoadingShifts] = useState(true);
  const [showMonthView, setShowMonthView] = useState(true);
  const [currentMonthStart, setCurrentMonthStart] = useState<Date>(() =>
    getFirstDayOfMonth(new Date())
  );
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

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
    if (!orgId || !employeeId) return;
    setIsLoadingShifts(true);
    try {
      const response = await getEmployeeOnCallShifts(
        orgId,
        employeeId,
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
  }, [orgId, employeeId, periodRange.fromDate, periodRange.toDate, t]);

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

  const groupsMap = useMemo(() => {
    const map = new Map<string, OnCallGroup>();
    for (const shift of shifts) {
      if (!map.has(shift.group.id)) {
        map.set(shift.group.id, shift.group);
      }
    }
    return map;
  }, [shifts]);

  const filteredShifts = shifts;

  const policyDayInfoByDateKey = useMemo(() => {
    const map = new Map<string, PolicyDayDisplayInfo>();
    if (!timePolicy) return map;

    const dates = showMonthView
      ? eachCalendarDateInMonthView(currentMonthStart)
      : eachCalendarDateInYear(selectedYear);

    for (const d of dates) {
      const effective = getEffectivePolicyTimeSlotsForCalendarDisplay(
        d,
        timePolicy,
        false,
        filteredShifts
      );
      if (!effective) continue;
      map.set(
        format(d, "yyyy-MM-dd"),
        toPolicyDayDisplayInfo(effective, t, format(d, "yyyy-MM-dd"), {
          scheduleTileVariant: yearCalendarVariant === "type" ? "type" : "default",
        })
      );
    }
    return map;
  }, [
    timePolicy,
    showMonthView,
    currentMonthStart,
    selectedYear,
    t,
    filteredShifts,
    yearCalendarVariant,
  ]);

  const headerAction = (
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
      <span
        className={cn(
          "text-sm font-semibold text-center",
          showMonthView ? "min-w-[150px]" : "min-w-[80px]"
        )}
      >
        {getPeriodRangeText()}
      </span>
      <Button variant="outline" size="sm" onClick={handleNextPeriod}>
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
        timePolicy={timePolicy}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title={
          <span className="text-[16px] font-semibold">
            {t("employeesDetail.scheduleCalendarView", "Schedule Calendar View")}
          </span>
        }
        showBackButton={false}
        action={headerAction}
      />

      {!timePolicy && (
        <p className="text-sm text-muted-foreground">
          {t(
            "employeesDetail.noTimePolicyScheduleHint",
            "No time policy is assigned — only assigned on-call shifts are shown below."
          )}
        </p>
      )}

      <div className="flex flex-col gap-4">
        {showMonthView ? (
          <div className="flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground">
            <OnCallCalendar
              monthStart={currentMonthStart}
              shifts={filteredShifts}
              employees={[]}
              groupsMap={groupsMap}
              isLoading={isLoadingShifts}
              triggerMode="hover"
              policyDayInfo={policyDayInfoByDateKey}
              tileSize="sm"
              calendarVariant={yearCalendarVariant}
              embedInCard
            />
            <EmployeeScheduleCalendarLegend hasTimePolicy={!!timePolicy} />
          </div>
        ) : (
          <OnCallYearCalendar
            selectedYear={selectedYear}
            shifts={filteredShifts}
            employees={[]}
            groupsMap={groupsMap}
            isLoading={isLoadingShifts}
            triggerMode="hover"
            policyDayInfo={policyDayInfoByDateKey}
            calendarVariant={yearCalendarVariant}
          />
        )}
      </div>
    </div>
  );
};

export default EmployeeDetailPageTimeSchedule;
