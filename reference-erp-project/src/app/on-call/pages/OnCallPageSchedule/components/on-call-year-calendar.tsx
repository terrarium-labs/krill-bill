import { useState, useMemo, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { getColorClasses } from "@/utils/miscelanea";
import { getTagColorFromString } from "@/app/components/tag/utils";
import { IconLabel } from "@/app/components/custom-labels";
import { Employee } from "@/types/employees/employees";
import type { OnCallGroup } from "@/types/field-service/on-call/groups";
import { OnCallShift } from "@/types/field-service/on-call/on-call-shifts";
import OnCallYearCalendarDayPopover from "./on-call-year-calendar-day-popover";
import OnCallTilePopover from "./on-call-tile-popover";
import type { PopoverTriggerMode } from "./on-call-tile-popover";
import { eachMonthOfInterval, parseISO, endOfDay } from "date-fns";

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
}

interface DayShift {
  shift: OnCallShift;
  groupId: string;
  groupName: string;
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

function filterDayShiftsByLegend(
  dayShifts: DayShift[],
  legendGroupId: string | null
): DayShift[] {
  if (legendGroupId === null) return dayShifts;
  return dayShifts.filter((ds) => ds.groupId === legendGroupId);
}

interface OnCallYearTilePopoverDayButtonProps {
  day: Date;
  dayShift: DayShift;
  groupsMap: Map<string, OnCallGroup>;
  className?: string;
  triggerMode?: PopoverTriggerMode;
  onEditShift?: (shift: OnCallShift) => void;
  onDeleteShift?: (shift: OnCallShift) => void;
  onEmployeesAdded?: () => void;
}

const OnCallYearTilePopoverDayButton = ({
  day,
  dayShift,
  groupsMap,
  className,
  triggerMode = "click",
  onEditShift,
  onDeleteShift,
  onEmployeesAdded,
}: OnCallYearTilePopoverDayButtonProps) => {
  const [open, setOpen] = useState(false);
  const trigger = (
    <button
      type="button"
      className={cn(
        "min-h-6 min-w-6 max-h-6 max-w-6 p-0 text-xs font-normal flex items-center justify-center hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 font-semibold",
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
      {day.getDate()}
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
}: OnCallYearCalendarProps) => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  /** `null` = show all groups; otherwise only shifts for this group id. */
  const [legendGroupId, setLegendGroupId] = useState<string | null>(null);
  const shiftsToUse = useMemo(() => (isLoading ? [] : shifts), [isLoading, shifts]);

  const shiftsByDay = useMemo(
    () => getShiftsByDay(shiftsToUse, groupsMap),
    [shiftsToUse, groupsMap]
  );

  const groupsInYear = useMemo(() => {
    const ids = new Set<string>();
    shiftsByDay.forEach((dayShifts) => {
      for (const ds of dayShifts) ids.add(ds.groupId);
    });
    return Array.from(ids)
      .map((id) => {
        const g = groupsMap.get(id);
        return {
          id,
          name: g?.name ?? shiftsToUse.find((s) => s.group.id === id)?.group.name ?? id,
          color: g?.color ?? getTagColorFromString(g?.name ?? id),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [shiftsByDay, groupsMap, shiftsToUse]);

  const monthsInYear = useMemo(
    () =>
      eachMonthOfInterval({
        start: new Date(selectedYear, 0, 1),
        end: new Date(selectedYear, 11, 31),
      }),
    [selectedYear]
  );

  const getDayShiftsFiltered = useCallback(
    (date: Date) => {
      const key = dateToKey(date);
      const all = shiftsByDay.get(key) ?? [];
      return filterDayShiftsByLegend(all, legendGroupId);
    },
    [shiftsByDay, legendGroupId]
  );

  const getModifiers = useMemo(() => {
    const modifiers: Record<string, Date[]> = {};
    shiftsByDay.forEach((dayShifts, dateKey) => {
      const filtered = filterDayShiftsByLegend(dayShifts, legendGroupId);
      if (filtered.length === 0) return;
      const [y, m, d] = dateKey.split("-").map(Number);
      const date = new Date(y, (m ?? 1) - 1, d ?? 1);
      if (date.getFullYear() !== selectedYear) return;
      if (filtered.length >= 2) {
        const modKey = "on-call-shifts_diagonal";
        if (!modifiers[modKey]) modifiers[modKey] = [];
        modifiers[modKey].push(date);
      } else {
        const firstGroupId = filtered[0]?.groupId ?? "default";
        const modKey = `on-call-shifts_${firstGroupId}`;
        if (!modifiers[modKey]) modifiers[modKey] = [];
        modifiers[modKey].push(date);
      }
    });
    return modifiers;
  }, [shiftsByDay, selectedYear, legendGroupId]);

  const getModifiersClassNames = useMemo(() => {
    const classNames: Record<string, string> = {
      "on-call-shifts_diagonal": "rounded-md", // Diagonal split is rendered by the day popover
    };
    const seen = new Set<string>();
    shiftsByDay.forEach((dayShifts) => {
      const filtered = filterDayShiftsByLegend(dayShifts, legendGroupId);
      if (filtered.length >= 2) return;
      const groupId = filtered[0]?.groupId;
      if (!groupId || seen.has(groupId)) return;
      seen.add(groupId);
      const group = groupsMap.get(groupId);
      const color = group?.color ?? getTagColorFromString(group?.name ?? groupId);
      classNames[`on-call-shifts_${groupId}`] = cn(
        getColorClasses(color),
        "rounded-md"
      );
    });
    if (!classNames["on-call-shifts_default"]) {
      classNames["on-call-shifts_default"] = cn(
        getColorClasses("blue"),
        "rounded-md"
      );
    }
    return classNames;
  }, [shiftsByDay, groupsMap, legendGroupId]);

  const OnCallYearCalendarDayButton = (
    props: React.ComponentProps<typeof CalendarDayButton>
  ) => {
    const dayShifts = getDayShiftsFiltered(props.day.date);
    const dayShiftsForPopover = dayShifts.map((ds) => ({
      groupId: ds.groupId,
      groupName: ds.groupName,
      shift: ds.shift,
    }));

    if (dayShifts.length === 1) {
      return (
        <OnCallYearTilePopoverDayButton
          day={props.day.date}
          dayShift={dayShiftsForPopover[0]!}
          groupsMap={groupsMap}
          className={props.className}
          triggerMode={triggerMode}
          onEditShift={onEditShift}
          onDeleteShift={onDeleteShift}
          onEmployeesAdded={onEmployeesAdded}
        />
      );
    }

    return (
      <OnCallYearCalendarDayPopover
        {...props}
        className={cn(props.className, dayShifts.length > 0 && "font-semibold")}
        dayShifts={dayShiftsForPopover}
        groupsMap={groupsMap}
        triggerMode={triggerMode}
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
            modifiers={getModifiers}
            modifiersClassNames={getModifiersClassNames}
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
      {groupsInYear.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setLegendGroupId(null)}
              className={cn(
                "px-4 py-2 rounded-md border transition-colors flex items-center justify-center min-h-10",
                legendGroupId === null && "bg-accent/50 ring-1 ring-border"
              )}
            >
              <IconLabel
                icon={null}
                text={t("on-call.yearLegendAllGroups", "All groups")}
                color="gray"
                size="sm"
                textClassName="font-semibold"
              />
            </button>
            {groupsInYear.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() =>
                  setLegendGroupId((prev) => (prev === g.id ? null : g.id))
                }
                className={cn(
                  "px-4 py-2 rounded-md border transition-colors flex items-center justify-center min-h-10",
                  legendGroupId === g.id && "bg-accent/50 ring-1 ring-border"
                )}
              >
                <IconLabel
                  icon={null}
                  text={g.name}
                  color={g.color}
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