import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { format, startOfMonth, startOfWeek, addDays, isSameMonth, parseISO, endOfDay } from "date-fns";
import { Employee } from "@/types/employees/employees";
import type { OnCallGroup } from "@/types/field-service/on-call/groups";
import { OnCallShift } from "@/types/field-service/on-call/on-call-shifts";
import OnCallDayTileItem from "./on-call-day-tile-item";
import OnCallDayTileItemPopover, { OnCallDayTileItemForPopover } from "./on-call-day-tile-item-popover";
import type { PopoverTriggerMode } from "./on-call-tile-popover";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface OnCallCalendarProps {
  monthStart: Date;
  shifts: OnCallShift[];
  employees: Employee[];
  groupsMap: Map<string, OnCallGroup>;
  isLoading?: boolean;
  /** "click" = open on click (default). "hover" = open on hover, like time policy time slots. */
  triggerMode?: PopoverTriggerMode;
  onEditShift?: (shift: OnCallShift) => void;
  onDeleteShift?: (shift: OnCallShift) => void;
  onEmployeesAdded?: () => void;
}

/** Week segment of a shift: the part that falls within a given week. */
interface ShiftWeekSegment {
  shift: OnCallShift;
  segmentStart: Date;
  segmentEnd: Date;
  startCol: number; // 1-7, Mon=1
  endCol: number;   // 1-7, inclusive
  /** Shift continues from previous week (show chevron-left). */
  continuesFromPrevWeek: boolean;
  /** Shift continues to next week (show chevron-right). */
  continuesToNextWeek: boolean;
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

function getShiftsForWeek(
  shifts: OnCallShift[],
  weekStart: Date
): ShiftWeekSegment[] {
  const weekLastDay = addDays(weekStart, 6);
  const weekEnd = endOfDay(weekLastDay);
  const segments: ShiftWeekSegment[] = [];

  for (const shift of shifts) {
    const start = parseISO(shift.start_date);
    const end = parseShiftEndDate(shift.end_date);

    const overlapStart = start > weekStart ? start : weekStart;
    const overlapEnd = end < weekEnd ? end : weekEnd;
    if (overlapStart > overlapEnd) continue;

    const startDow = overlapStart.getDay() === 0 ? 7 : overlapStart.getDay();
    const endDow = overlapEnd.getDay() === 0 ? 7 : overlapEnd.getDay();
    const continuesFromPrevWeek = start < weekStart;
    const continuesToNextWeek = end > weekEnd;

    segments.push({
      shift,
      segmentStart: overlapStart,
      segmentEnd: overlapEnd,
      startCol: startDow,
      endCol: endDow,
      continuesFromPrevWeek,
      continuesToNextWeek,
    });
  }

  return segments;
}

/** Assign segments to lanes so non-overlapping segments share a row. */
function assignSegmentsToLanes(
  segments: ShiftWeekSegment[]
): { segment: ShiftWeekSegment; lane: number }[] {
  const sorted = [...segments].sort(
    (a, b) => a.startCol - b.startCol || a.endCol - b.endCol
  );

  const laneLastEnd: number[] = [];
  const result: { segment: ShiftWeekSegment; lane: number }[] = [];

  for (const seg of sorted) {
    let lane = 0;
    while (lane < laneLastEnd.length && laneLastEnd[lane]! >= seg.startCol) {
      lane++;
    }
    if (lane >= laneLastEnd.length) {
      laneLastEnd.push(seg.endCol);
    } else {
      laneLastEnd[lane] = seg.endCol;
    }
    result.push({ segment: seg, lane });
  }

  return result;
}

const OnCallCalendar = ({
  monthStart,
  shifts,
  employees: _employees,
  groupsMap,
  isLoading,
  triggerMode = "click",
  onEditShift,
  onDeleteShift,
  onEmployeesAdded,
}: OnCallCalendarProps) => {
  const { t } = useTranslation();

  const [hoveredShiftId, setHoveredShiftId] = useState<string | null>(null);

  const shiftsToUse = isLoading ? [] : shifts;

  const { weeks, weekSegments } = useMemo(() => {
    const start = startOfMonth(monthStart);
    const calendarStart = startOfWeek(start, { weekStartsOn: 1 });
    const calendarEnd = addDays(calendarStart, 41);
    const weeks: { date: Date; dateKey: string; isCurrentMonth: boolean }[][] = [];
    const weekSegments: ShiftWeekSegment[][] = [];
    let current = calendarStart;
    let week: { date: Date; dateKey: string; isCurrentMonth: boolean }[] = [];

    while (current <= calendarEnd) {
      const dateKey = format(current, "yyyy-MM-dd");
      week.push({
        date: new Date(current),
        dateKey,
        isCurrentMonth: isSameMonth(current, monthStart),
      });
      if (week.length === 7) {
        weeks.push(week);
        weekSegments.push(getShiftsForWeek(shiftsToUse, week[0]!.date));
        week = [];
      }
      current = addDays(current, 1);
    }
    if (week.length > 0) {
      weeks.push(week);
      weekSegments.push(getShiftsForWeek(shiftsToUse, week[0]!.date));
    }

    return { weeks, weekSegments };
  }, [monthStart, shiftsToUse]);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 rounded-lg">
          <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />
        </div>
      )}
      <div className="border border-border rounded-lg overflow-hidden bg-background">
      <div className="grid grid-cols-7 border-b border-border bg-muted/50">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-xs font-medium text-muted-foreground"
          >
            {t(`common.days.${day.toLowerCase()}`, day)}
          </div>
        ))}
      </div>

      <div className="divide-y divide-border">
        {weeks.map((week, weekIdx) => {
          const segments = weekSegments[weekIdx] ?? [];
          const assigned = assignSegmentsToLanes(segments);
          const maxLane = assigned.length > 0 ? Math.max(...assigned.map((a) => a.lane)) : 0;
          const MAX_VISIBLE_LANES = 4;
          const hasOverflow = maxLane >= MAX_VISIBLE_LANES;
          const tileRowCount = hasOverflow ? MAX_VISIBLE_LANES + 1 : Math.max(MAX_VISIBLE_LANES, maxLane + 1);
          const rowCount = 1 + tileRowCount;
          return (
            <div key={weekIdx} className="relative">
              <div
                className="grid gap-x-0 gap-y-1 p-1 min-h-[120px]"
                style={{
                  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                  gridTemplateRows: `repeat(${rowCount}, minmax(24px, auto))`,
                }}
              >
                {/* Day number row */}
                {week.map(({ date, dateKey, isCurrentMonth }, dayIdx) => (
                  <div
                    key={dateKey}
                    className={cn(
                      "border-r border-border px-1 flex items-start",
                      dayIdx === 6 && "border-r-0"
                    )}
                  >
                    <div
                      className={cn(
                        "text-xs font-medium text-muted-foreground",
                        !isCurrentMonth && "opacity-60"
                      )}
                    >
                      {format(date, "d")}
                    </div>
                  </div>
                ))}

                {/* Shift tiles - first 4 rows visible, 5th row+ go in "X more" popover */}
                {assigned
                  .filter(({ lane }) => !hasOverflow || lane < MAX_VISIBLE_LANES)
                  .map(({ segment: seg, lane }) => (
                    <div
                      key={`${seg.shift.id}-${seg.segmentStart.getTime()}`}
                      className="min-w-0 col-span-1 mx-1"
                      style={{
                        gridColumn: `${seg.startCol} / ${seg.endCol + 1}`,
                        gridRow: lane + 2,
                      }}
                      onMouseEnter={() => setHoveredShiftId(seg.shift.id)}
                      onMouseLeave={() => setHoveredShiftId(null)}
                    >
                      <OnCallDayTileItem
                        groupId={seg.shift.group.id}
                        groupName={groupsMap.get(seg.shift.group.id)?.name ?? seg.shift.group.name}
                        shift={seg.shift}
                        groupsMap={groupsMap}
                        segmentStart={seg.segmentStart}
                        segmentEnd={seg.segmentEnd}
                        continuesFromPrevWeek={seg.continuesFromPrevWeek}
                        continuesToNextWeek={seg.continuesToNextWeek}
                        isHovered={hoveredShiftId === seg.shift.id}
                        triggerMode={triggerMode}
                        onEditShift={onEditShift}
                        onDeleteShift={onDeleteShift}
                        onEmployeesAdded={onEmployeesAdded}
                      />
                    </div>
                  ))}

                {/* "X more" row when there are 5+ tile rows - only lane 4+ (5th row onwards) go in popover */}
                {hasOverflow &&
                  week.map(({ date, dateKey }, dayIdx) => {
                    const col = dayIdx + 1;
                    const overflowSegments = assigned.filter(
                      (a) => a.lane >= MAX_VISIBLE_LANES && a.segment.startCol <= col && col <= a.segment.endCol
                    );
                    const moreCount = overflowSegments.length;
                    const dayShifts: OnCallDayTileItemForPopover[] = overflowSegments.map((a) => ({
                      groupId: a.segment.shift.group.id,
                      groupName: groupsMap.get(a.segment.shift.group.id)?.name ?? a.segment.shift.group.name,
                      shift: a.segment.shift,
                      continuesFromPrevWeek: a.segment.continuesFromPrevWeek,
                      continuesToNextWeek: a.segment.continuesToNextWeek,
                    }));

                    if (moreCount === 0) return null;

                    const trigger = (
                      <button
                        type="button"
                        className={cn(
                          "w-full rounded border border-border bg-muted/50 px-2 py-1 text-xs font-medium",
                          "hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          "text-muted-foreground text-left truncate"
                        )}
                      >
                        {t("on-call.moreCount", "{{count}} more", { count: moreCount })}
                      </button>
                    );

                    return (
                      <div
                        key={dateKey}
                        className="min-w-0 col-span-1 mx-1"
                        style={{
                          gridColumn: `${col} / ${col + 1}`,
                          gridRow: MAX_VISIBLE_LANES + 2,
                        }}
                      >
                        <OnCallDayTileItemPopover
                          trigger={trigger}
                          day={date}
                          dayShifts={dayShifts}
                          groupsMap={groupsMap}
                          triggerMode={triggerMode}
                          onEditShift={onEditShift}
                          onDeleteShift={onDeleteShift}
                          onEmployeesAdded={onEmployeesAdded}
                        />
                      </div>
                    );
                  })}
              </div>

              {/* Vertical day separators - overlay for clear column boundaries */}
              <div
                className="absolute inset-0 pointer-events-none grid p-1 z-10"
                style={{
                  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                  gridTemplateRows: `28px repeat(${tileRowCount}, minmax(24px, 1fr))`,
                }}
              >
                {Array.from({ length: 7 }).map((_, colIdx) => (
                  <div
                    key={colIdx}
                    className={cn(
                      "border-r border-border",
                      colIdx === 6 && "border-r-0"
                    )}
                    style={{ gridRow: "1 / -1" }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
};

export default OnCallCalendar;