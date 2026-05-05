import { useState, useMemo, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Employee } from "@/types/employees/employees";
import type { OnCallGroup } from "@/types/field-service/on-call/groups";
import { OnCallShift } from "@/types/field-service/on-call/on-call-shifts";
import { eachCalendarDateInYear } from "@/app/employees/EmployeeDetailPage/pages/EmployeeDetailPageTime/utils/effective-policy-time-slots";
import OnCallYearCalendarDayPopover from "./on-call-year-calendar-day-popover";
import OnCallTilePopover from "./on-call-tile-popover";
import type { PopoverTriggerMode } from "./on-call-tile-popover";
import { eachMonthOfInterval, parseISO, endOfDay } from "date-fns";
import type { PolicyDayDisplayInfo } from "@/app/employees/EmployeeDetailPage/pages/EmployeeDetailPageTime/utils/policy-day-display";
import { PolicyPolicyPopoverBlock } from "./policy-policy-popover-block";
import {
  YearCalendarDayCell,
  type YearCalendarCellVariant,
} from "./year-calendar-day-visual";
import { IconLabel } from "@/app/components/custom-labels";

interface OnCallYearCalendarProps {
  selectedYear: number;
  shifts: OnCallShift[];
  employees: Employee[];
  groupsMap: Map<string, OnCallGroup>;
  isLoading?: boolean;
  /** "click" = open on click (default). "hover" = open on hover. */
  triggerMode?: PopoverTriggerMode;
  onEditShift?: (shift: OnCallShift) => void;
  onDeleteShift?: (shift: OnCallShift) => void;
  onEmployeesAdded?: () => void;
  /** Per-day time policy work hours (separate from assigned on-call shifts). */
  policyDayInfo?: Map<string, PolicyDayDisplayInfo>;
  /**
   * `default` = per-group / per-slot cell paint. `type` = one color per category (green default, orange on-call, purple special; diagonal if special + on-call shifts).
   */
  calendarVariant?: YearCalendarCellVariant;
}

interface DayShift {
  shift: OnCallShift;
  groupId: string;
  groupName: string;
}

/** Merged legend: work (default policy), on-call (shifts + on-call policy), special. */
export type YearLegendFilterKey = "work" | "oncall" | "special";

const YEAR_LEGEND_KEY_ORDER: YearLegendFilterKey[] = ["work", "oncall", "special"];

/** Matches {@link YearDayCellTypePainted} (green / orange / purple). */
const YEAR_LEGEND_ICON_COLOR: Record<YearLegendFilterKey, string> = {
  work: "green",
  oncall: "orange",
  special: "purple",
};

/**
 * Restricts policy/shift data to match the merged legend (work / on-call / special).
 */
function applyYearLegendFilter(
  filter: "all" | YearLegendFilterKey,
  policyInfo: PolicyDayDisplayInfo | undefined,
  dayShifts: DayShift[]
): { policyInfo: PolicyDayDisplayInfo | undefined; dayShifts: DayShift[] } {
  if (filter === "all") {
    return { policyInfo, dayShifts };
  }
  const src = policyInfo?.source;
  const hasShifts = dayShifts.length > 0;

  if (filter === "work") {
    if (src === "default" && !hasShifts) {
      return { policyInfo, dayShifts: [] };
    }
    return { policyInfo: undefined, dayShifts: [] };
  }

  if (filter === "oncall") {
    if (hasShifts || src === "on_call") {
      return { policyInfo, dayShifts };
    }
    return { policyInfo: undefined, dayShifts: [] };
  }

  if (filter === "special") {
    if (src === "special") {
      return { policyInfo, dayShifts };
    }
    return { policyInfo: undefined, dayShifts: [] };
  }

  return { policyInfo: undefined, dayShifts: [] };
}

/** Parse end_date, treating 23:59/23:59:00/23:59:59 as end of that calendar day (avoids timezone pushing to next day). */
function parseShiftEndDate(endDateStr: string): Date {
  if (/23:59/.test(endDateStr)) {
    const datePart = endDateStr.split("T")[0] ?? endDateStr.split(" ")[0];
    if (datePart) {
      const [y, m, d] = datePart.split("-").map(Number);
      return endOfDay(new Date(y ?? 0, (m ?? 1) - 1, d ?? 1));
    }
  }
  return parseISO(endDateStr);
}

/** For each date, get shifts that overlap that date. */
function getShiftsByDay(
  shifts: OnCallShift[],
  groupsMap: Map<string, OnCallGroup>
): Map<string, DayShift[]> {
  const result = new Map<string, DayShift[]>();

  for (const shift of shifts) {
    const groupId = shift.group.id;
    const groupName = groupsMap.get(groupId)?.name ?? shift.group.name;
    const start = parseISO(shift.start_date);
    const end = parseShiftEndDate(shift.end_date);

    const d = new Date(start);
    while (d <= end) {
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!result.has(dateKey)) result.set(dateKey, []);
      result.get(dateKey)!.push({ shift, groupId, groupName });
      d.setDate(d.getDate() + 1);
    }
  }

  return result;
}

const dateToKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function computeYearLegendKindsPresent(
  selectedYear: number,
  shiftsByDay: Map<string, DayShift[]>,
  policyDayInfo: Map<string, PolicyDayDisplayInfo> | undefined
): Set<YearLegendFilterKey> {
  const set = new Set<YearLegendFilterKey>();
  for (const d of eachCalendarDateInYear(selectedYear)) {
    const key = dateToKey(d);
    const dayShifts = shiftsByDay.get(key) ?? [];
    const policy = policyDayInfo?.get(key);
    const src = policy?.source;
    const hasShifts = dayShifts.length > 0;
    if (src === "default" && !hasShifts) set.add("work");
    if (hasShifts || src === "on_call") set.add("oncall");
    if (src === "special") set.add("special");
  }
  return set;
}

interface OnCallYearTilePopoverDayButtonProps {
  day: Date;
  dayShift: DayShift;
  groupsMap: Map<string, OnCallGroup>;
  className?: string;
  triggerMode?: PopoverTriggerMode;
  /** Time policy work hours (shown above shift details; includes on-call policy days). */
  policySection?: ReactNode;
  policyDayDisplayInfo?: PolicyDayDisplayInfo | null;
  onEditShift?: (shift: OnCallShift) => void;
  onDeleteShift?: (shift: OnCallShift) => void;
  onEmployeesAdded?: () => void;
  calendarVariant?: YearCalendarCellVariant;
}

const OnCallYearTilePopoverDayButton = ({
  day,
  dayShift,
  groupsMap,
  className,
  triggerMode = "click",
  policySection,
  policyDayDisplayInfo,
  onEditShift,
  onDeleteShift,
  onEmployeesAdded,
  calendarVariant = "default",
}: OnCallYearTilePopoverDayButtonProps) => {
  const [open, setOpen] = useState(false);
  const trigger = (
    <button
      type="button"
      className={cn(
        "min-h-6 min-w-6 max-h-6 max-w-6 p-0 text-xs font-normal flex items-center justify-center hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 relative overflow-hidden rounded-md",
        className
      )}
      onClick={
        triggerMode === "click"
          ? (e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen((o) => !o);
            }
          : undefined
      }
    >
      <div className="relative flex size-full min-h-6 min-w-6 items-center justify-center overflow-hidden rounded-md">
        <YearCalendarDayCell
          variant={calendarVariant}
          dayNum={day.getDate()}
          dayShifts={[dayShift]}
          policyInfo={policyDayDisplayInfo}
          groupsMap={groupsMap}
        />
      </div>
    </button>
  );
  return (
    <OnCallTilePopover
      trigger={trigger}
      groupName={dayShift.groupName}
      groupColor={groupsMap.get(dayShift.groupId)?.color}
      shift={dayShift.shift}
      segmentStart={day}
      segmentEnd={day}
      policySection={policySection}
      open={triggerMode === "click" ? open : undefined}
      onOpenChange={triggerMode === "click" ? setOpen : undefined}
      triggerMode={triggerMode}
      onEditShift={onEditShift}
      onDeleteShift={onDeleteShift}
      onEmployeesAdded={onEmployeesAdded}
    />
  );
};

const OnCallYearCalendar = ({
  selectedYear,
  shifts,
  groupsMap,
  isLoading,
  triggerMode = "click",
  onEditShift,
  onDeleteShift,
  onEmployeesAdded,
  policyDayInfo,
  calendarVariant = "default",
}: OnCallYearCalendarProps) => {
  const { t } = useTranslation();
  /** `null` = all types (same highlight semantics as absences calendar legend). */
  const [legendFilter, setLegendFilter] = useState<YearLegendFilterKey | null>(null);
  const effectiveLegendFilter: "all" | YearLegendFilterKey =
    legendFilter === null ? "all" : legendFilter;

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const shiftsToUse = useMemo(() => (isLoading ? [] : shifts), [isLoading, shifts]);

  const shiftsByDay = useMemo(
    () => getShiftsByDay(shiftsToUse, groupsMap),
    [shiftsToUse, groupsMap]
  );

  const legendKindsPresent = useMemo(
    () => computeYearLegendKindsPresent(selectedYear, shiftsByDay, policyDayInfo),
    [selectedYear, shiftsByDay, policyDayInfo]
  );

  const monthsInYear = useMemo(
    () =>
      eachMonthOfInterval({
        start: new Date(selectedYear, 0, 1),
        end: new Date(selectedYear, 11, 31),
      }),
    [selectedYear]
  );

  const getDayShifts = (date: Date) => {
    const key = dateToKey(date);
    return shiftsByDay.get(key) ?? [];
  };

  const OnCallYearCalendarDayButton = (
    props: React.ComponentProps<typeof CalendarDayButton>
  ) => {
    const dayDate = props.day.date;
    const dateKey = dateToKey(dayDate);
    const rawPolicyInfo = policyDayInfo?.get(dateKey);
    const dayShifts = getDayShifts(dayDate);

    const { policyInfo: filteredPolicy, dayShifts: filteredDayShifts } =
      applyYearLegendFilter(effectiveLegendFilter, rawPolicyInfo, dayShifts);
    const policySectionForPolicyOnlyDay = filteredPolicy ? (
      <PolicyPolicyPopoverBlock info={filteredPolicy} />
    ) : undefined;

    const policySectionForShiftPopover = filteredPolicy ? (
      <PolicyPolicyPopoverBlock info={filteredPolicy} />
    ) : undefined;

    const dayShiftsForPopover = filteredDayShifts.map((ds) => ({
      groupId: ds.groupId,
      groupName: ds.groupName,
      shift: ds.shift,
    }));

    if (filteredDayShifts.length === 0 && !policySectionForPolicyOnlyDay) {
      return <CalendarDayButton {...props} />;
    }

    if (filteredDayShifts.length === 0 && policySectionForPolicyOnlyDay) {
      return (
        <OnCallYearCalendarDayPopover
          {...props}
          className={cn(props.className, "font-normal")}
          dayShifts={[]}
          groupsMap={groupsMap}
          policyDayDisplayInfo={filteredPolicy}
          policySection={policySectionForPolicyOnlyDay}
          triggerMode={triggerMode}
          calendarVariant={calendarVariant}
        />
      );
    }

    if (filteredDayShifts.length === 1) {
      return (
        <OnCallYearTilePopoverDayButton
          day={dayDate}
          dayShift={dayShiftsForPopover[0]!}
          groupsMap={groupsMap}
          className={props.className}
          triggerMode={triggerMode}
          policySection={policySectionForShiftPopover}
          policyDayDisplayInfo={filteredPolicy}
          calendarVariant={calendarVariant}
          onEditShift={onEditShift}
          onDeleteShift={onDeleteShift}
          onEmployeesAdded={onEmployeesAdded}
        />
      );
    }

    return (
      <OnCallYearCalendarDayPopover
        {...props}
        className={cn(props.className, filteredDayShifts.length > 0 && "font-semibold")}
        dayShifts={dayShiftsForPopover}
        groupsMap={groupsMap}
        policyDayDisplayInfo={filteredPolicy}
        triggerMode={triggerMode}
        policySection={policySectionForShiftPopover}
        calendarVariant={calendarVariant}
        onEditShift={onEditShift}
        onDeleteShift={onDeleteShift}
        onEmployeesAdded={onEmployeesAdded}
      />
    );
  };

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
          <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {monthsInYear.map((month) => (
        <div key={month.getTime()} className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={month}
            showOutsideDays={false}
            weekStartsOn={1}
            className="p-0"
            classNames={{
              nav: "hidden",
              button_previous: "hidden",
              button_next: "hidden",
              caption:
                "flex justify-center pt-0 relative items-center w-full",
              caption_label: "text-xs font-medium",
              weekdays: "flex",
              weekday:
                "text-xs font-normal text-muted-foreground w-6 h-6 flex items-center justify-center p-0",
              week: "flex w-full mt-1",
              day: "min-h-6 min-w-6 max-h-6 max-w-6 text-xs p-0 font-normal aria-selected:opacity-100 flex items-center justify-center",
              day_button:
                "min-h-6 min-w-6 max-h-6 max-w-6 p-0 text-xs font-normal flex items-center justify-center hover:bg-accent hover:text-accent-foreground focus-visible:ring-1",
              month: "space-y-1 p-2",
            }}
            components={{
              DayButton: OnCallYearCalendarDayButton,
            }}
          />
        </div>
      ))}
      </div>
      {legendKindsPresent.size > 0 && (
        <div className="border-t border-border bg-card px-2 py-2">
          <p className="text-center text-[10px] font-medium text-muted-foreground mb-2">
            {t("employeesDetail.scheduleLegendFilterHint", "Filter by schedule type")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-muted-foreground">
            <button
              type="button"
              onClick={() => setLegendFilter(null)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 transition-colors",
                legendFilter === null && "bg-accent/50 ring-1 ring-border"
              )}
            >
              <IconLabel
                icon={null}
                text={t("absences.allTypes", "All Types")}
                color="gray"
                size="sm"
                textClassName="font-semibold"
              />
            </button>
            {YEAR_LEGEND_KEY_ORDER.filter((k) => legendKindsPresent.has(k)).map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() =>
                  setLegendFilter(legendFilter === kind ? null : kind)
                }
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 transition-colors",
                  legendFilter === kind && "bg-accent/50 ring-1 ring-border"
                )}
              >
                <IconLabel
                  icon={null}
                  text={
                    kind === "work"
                      ? t("on-call.legendWorkShift", "Work Shift")
                      : kind === "oncall"
                        ? t("on-call.legendOnCallShift", "OnCall Shift")
                        : t("on-call.legendSpecialShift", "Special Shift")
                  }
                  color={YEAR_LEGEND_ICON_COLOR[kind]}
                  size="sm"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
 export default OnCallYearCalendar;