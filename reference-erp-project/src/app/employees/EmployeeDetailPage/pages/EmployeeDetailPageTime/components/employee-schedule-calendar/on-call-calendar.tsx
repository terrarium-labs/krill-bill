import { useMemo, useState } from "react";
import { ClockAlert, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  format,
  startOfMonth,
  startOfWeek,
  startOfDay,
  addDays,
  isSameMonth,
  parseISO,
  endOfDay,
} from "date-fns";
import { Employee } from "@/types/employees/employees";
import type { OnCallGroup } from "@/types/field-service/on-call/groups";
import { OnCallShift } from "@/types/field-service/on-call/on-call-shifts";
import OnCallDayTileItem from "./on-call-day-tile-item";
import OnCallDayTileItemPopover, { OnCallDayTileItemForPopover } from "./on-call-day-tile-item-popover";
import OnCallTilePopover from "./on-call-tile-popover";
import type { PopoverTriggerMode } from "./on-call-tile-popover";
import { cn } from "@/lib/utils";
import type { PolicyDayDisplayInfo, PolicySlotLineDisplay } from "@/app/employees/EmployeeDetailPage/pages/EmployeeDetailPageTime/utils/policy-day-display";
import { onCallShiftOverlapsCalendarDate } from "@/app/employees/EmployeeDetailPage/pages/EmployeeDetailPageTime/utils/on-call-shift-date-overlap";
import { PolicyCalendarTile } from "./policy-calendar-tile";
import type { PolicyCalendarTileSize } from "./policy-calendar-tile";
import { PolicyPolicyPopoverBlock } from "./policy-policy-popover-block";
import type { YearCalendarCellVariant } from "./year-calendar-day-visual";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type OnCallCalendarTileSize = PolicyCalendarTileSize;

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
  /**
   * Per-day work schedule from the employee time policy (calendar display precedence).
   * When set: lanes show only policy time-slot tiles (including on-call policy slots); assigned
   * on-call shifts open from the phone icon beside the day number, not as lane bars.
   */
  policyDayInfo?: Map<string, PolicyDayDisplayInfo>;
  /**
   * `sm`: compact tiles (same density as weekly time-policy shifts), show all lanes.
   * `default`: larger tiles, max 4 lanes then overflow popover.
   */
  tileSize?: OnCallCalendarTileSize;
  /**
   * `type` = same colors as year grid (green / orange / purple by schedule category; orange for assigned shifts).
   * `default` = per-group colors for shifts, per-slot colors for policy tiles.
   */
  calendarVariant?: YearCalendarCellVariant;
  /**
   * When true, only top corners are rounded and no outer border — use inside a parent card with a footer legend.
   */
  embedInCard?: boolean;
}

/** Week segment of a shift: the part that falls within a given week. */
interface ShiftWeekSegment {
  shift: OnCallShift;
  segmentStart: Date;
  segmentEnd: Date;
  startCol: number; // 1-7, Mon=1
  endCol: number; // 1-7, inclusive
  continuesFromPrevWeek: boolean;
  continuesToNextWeek: boolean;
}

type UnifiedLaneItem =
  | {
      kind: "policy";
      stableKey: string;
      startCol: number;
      endCol: number;
      sortStartMs: number;
      slot: PolicySlotLineDisplay;
      sourceLabel: string;
    }
  | {
      kind: "shift";
      stableKey: string;
      startCol: number;
      endCol: number;
      sortStartMs: number;
      segment: ShiftWeekSegment;
    };

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

function getShiftsOverlappingDay(shifts: OnCallShift[], date: Date): OnCallShift[] {
  return shifts.filter((s) => onCallShiftOverlapsCalendarDate(s, date));
}

function shiftSegmentForCalendarDay(shift: OnCallShift, date: Date): { segmentStart: Date; segmentEnd: Date } {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  const sStart = parseISO(shift.start_date);
  const sEnd = parseShiftEndDate(shift.end_date);
  return {
    segmentStart: sStart > dayStart ? sStart : dayStart,
    segmentEnd: sEnd < dayEnd ? sEnd : dayEnd,
  };
}

function getShiftsForWeek(shifts: OnCallShift[], weekStart: Date): ShiftWeekSegment[] {
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

/** Narrow shift segments to calendar columns that belong to the selected month; drop others. */
function clipSegmentToVisibleMonth(
  week: { date: Date; isCurrentMonth: boolean }[],
  seg: ShiftWeekSegment
): ShiftWeekSegment | null {
  let startCol = seg.startCol;
  let endCol = seg.endCol;
  while (startCol <= endCol && !week[startCol - 1]?.isCurrentMonth) startCol++;
  while (endCol >= startCol && !week[endCol - 1]?.isCurrentMonth) endCol--;
  if (startCol > endCol) return null;

  const firstDay = week[startCol - 1]!.date;
  const lastDay = week[endCol - 1]!.date;
  const rangeStart = startOfDay(firstDay);
  const rangeEnd = endOfDay(lastDay);
  const overlapStart = seg.segmentStart > rangeStart ? seg.segmentStart : rangeStart;
  const overlapEnd = seg.segmentEnd < rangeEnd ? seg.segmentEnd : rangeEnd;
  if (overlapStart > overlapEnd) return null;

  return {
    shift: seg.shift,
    segmentStart: overlapStart,
    segmentEnd: overlapEnd,
    startCol,
    endCol,
    continuesFromPrevWeek: seg.continuesFromPrevWeek || startCol > seg.startCol,
    continuesToNextWeek: seg.continuesToNextWeek || endCol < seg.endCol,
  };
}

function clipSegmentsToVisibleMonth(
  week: { date: Date; isCurrentMonth: boolean }[],
  segments: ShiftWeekSegment[]
): ShiftWeekSegment[] {
  return segments
    .map((seg) => clipSegmentToVisibleMonth(week, seg))
    .filter((s): s is ShiftWeekSegment => s != null);
}

function buildUnifiedLaneItems(
  week: { date: Date; dateKey: string; isCurrentMonth: boolean }[],
  shiftSegments: ShiftWeekSegment[],
  policyDayInfo: Map<string, PolicyDayDisplayInfo> | undefined,
  includeShiftSegmentsInLanes: boolean
): UnifiedLaneItem[] {
  const items: UnifiedLaneItem[] = [];

  if (includeShiftSegmentsInLanes) {
    for (const seg of shiftSegments) {
      const sortStartMs = parseISO(seg.shift.start_date).getTime();
      items.push({
        kind: "shift",
        stableKey: `shift-${seg.shift.id}-${seg.segmentStart.getTime()}`,
        startCol: seg.startCol,
        endCol: seg.endCol,
        sortStartMs,
        segment: seg,
      });
    }
  }

  if (policyDayInfo) {
    week.forEach((day, dayIdx) => {
      if (!day.isCurrentMonth) return;
      const info = policyDayInfo.get(day.dateKey);
      if (!info?.slots.length) return;
      const col = dayIdx + 1;
      for (const slot of info.slots) {
        items.push({
          kind: "policy",
          stableKey: `policy-${day.dateKey}-${slot.id}`,
          startCol: col,
          endCol: col,
          sortStartMs: slot.sortStartMs,
          slot,
          sourceLabel: info.sourceLabel,
        });
      }
    });
  }

  return items.sort((a, b) => {
    if (a.startCol !== b.startCol) return a.startCol - b.startCol;
    if (a.sortStartMs !== b.sortStartMs) return a.sortStartMs - b.sortStartMs;
    return a.endCol - b.endCol;
  });
}

function assignUnifiedToLanes(items: UnifiedLaneItem[]): { item: UnifiedLaneItem; lane: number }[] {
  const sorted = [...items].sort(
    (a, b) =>
      a.startCol - b.startCol ||
      a.sortStartMs - b.sortStartMs ||
      a.endCol - b.endCol
  );
  const laneLastEnd: number[] = [];
  const result: { item: UnifiedLaneItem; lane: number }[] = [];

  for (const item of sorted) {
    let lane = 0;
    while (lane < laneLastEnd.length && laneLastEnd[lane]! >= item.startCol) {
      lane++;
    }
    if (lane >= laneLastEnd.length) {
      laneLastEnd.push(item.endCol);
    } else {
      laneLastEnd[lane] = item.endCol;
    }
    result.push({ item, lane });
  }

  return result;
}

const OnCallCalendar = ({
  monthStart,
  shifts,
  groupsMap,
  isLoading,
  triggerMode = "click",
  onEditShift,
  onDeleteShift,
  onEmployeesAdded,
  policyDayInfo,
  tileSize = "default",
  calendarVariant = "default",
  embedInCard = false,
}: OnCallCalendarProps) => {
  const { t } = useTranslation();

  const [hoveredShiftId, setHoveredShiftId] = useState<string | null>(null);

  const shiftsToUse = useMemo(() => (isLoading ? [] : shifts), [isLoading, shifts]);
  /** Employee schedule: policy tiles in lanes; shift details via day icon (not shift bars). */
  const employeeScheduleMode = policyDayInfo != null;
  const includeShiftSegmentsInLanes = !employeeScheduleMode;

  const maxVisibleLanes = tileSize === "sm" ? 10_000 : 4;
  const minEmptyLaneRows = tileSize === "sm" ? 1 : 4;
  const tileRowMin = tileSize === "sm" ? "minmax(20px, auto)" : "minmax(24px, auto)";

  const { weeks, weekLaneAssignments } = useMemo(() => {
    const start = startOfMonth(monthStart);
    const calendarStart = startOfWeek(start, { weekStartsOn: 1 });
    const calendarEnd = addDays(calendarStart, 41);
    const weeks: { date: Date; dateKey: string; isCurrentMonth: boolean }[][] = [];
    const weekLaneAssignments: { item: UnifiedLaneItem; lane: number }[][] = [];
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
        const rawSegments = getShiftsForWeek(shiftsToUse, week[0]!.date);
        const shiftSegments = clipSegmentsToVisibleMonth(week, rawSegments);
        const unified = buildUnifiedLaneItems(
          week,
          shiftSegments,
          policyDayInfo,
          includeShiftSegmentsInLanes
        );
        weeks.push(week);
        weekLaneAssignments.push(assignUnifiedToLanes(unified));
        week = [];
      }
      current = addDays(current, 1);
    }
    if (week.length > 0) {
      const rawSegments = getShiftsForWeek(shiftsToUse, week[0]!.date);
      const shiftSegments = clipSegmentsToVisibleMonth(week, rawSegments);
      const unified = buildUnifiedLaneItems(
        week,
        shiftSegments,
        policyDayInfo,
        includeShiftSegmentsInLanes
      );
      weeks.push(week);
      weekLaneAssignments.push(assignUnifiedToLanes(unified));
    }

    return { weeks, weekLaneAssignments };
  }, [monthStart, shiftsToUse, policyDayInfo, includeShiftSegmentsInLanes]);

  return (
    <div className="relative">
      {isLoading && (
        <div
          className={cn(
            "absolute inset-0 z-10 flex items-center justify-center bg-background/80",
            embedInCard ? "rounded-t-lg" : "rounded-lg"
          )}
        >
          <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />
        </div>
      )}
      <div
        className={cn(
          "overflow-hidden bg-background",
          embedInCard ? "rounded-t-lg" : "border border-border rounded-lg"
        )}
      >
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
            const assigned = weekLaneAssignments[weekIdx] ?? [];
            const maxLane = assigned.length > 0 ? Math.max(...assigned.map((a) => a.lane)) : -1;
            const hasOverflow = maxLane >= maxVisibleLanes;
            const tileRowCount = hasOverflow
              ? maxVisibleLanes + 1
              : Math.max(minEmptyLaneRows, maxLane + 1);

            return (
              <div key={weekIdx} className="relative">
                <div
                  className={cn(
                    "grid gap-x-0 gap-y-1 p-1",
                    tileSize === "sm" ? "min-h-[100px]" : "min-h-[120px]"
                  )}
                  style={{
                    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                    gridTemplateRows: `minmax(28px, auto) repeat(${tileRowCount}, ${tileRowMin})`,
                  }}
                >
                  {/* Day number row — employee schedule: clock-alert icon opens assigned shift popover (lanes are policy slots only) */}
                  {week.map(({ date, dateKey, isCurrentMonth }, dayIdx) => {
                    const dayShiftsForIcon =
                      employeeScheduleMode && isCurrentMonth
                        ? getShiftsOverlappingDay(shiftsToUse, date)
                        : [];
                    const policyInfoForDay =
                      employeeScheduleMode && isCurrentMonth
                        ? policyDayInfo?.get(dateKey)
                        : undefined;
                    const policySectionHover = policyInfoForDay ? (
                      <PolicyPolicyPopoverBlock info={policyInfoForDay} tileSize={tileSize} />
                    ) : undefined;
                    return (
                      <div
                        key={dateKey}
                        className={cn(
                          "border-r border-border px-1 flex items-start min-w-0",
                          dayIdx === 6 && "border-r-0"
                        )}
                      >
                        <div className="flex w-full min-w-0 items-center gap-0.5">
                          <span
                            className={cn(
                              "text-xs font-medium text-muted-foreground shrink-0",
                              !isCurrentMonth && "opacity-60"
                            )}
                          >
                            {format(date, "d")}
                          </span>
                          {dayShiftsForIcon.length === 1 && (
                            <div
                              className="shrink-0 inline-flex items-center"
                              onClick={(e) => e.stopPropagation()}
                              onPointerDown={(e) => e.stopPropagation()}
                            >
                              {(() => {
                                const shift = dayShiftsForIcon[0]!;
                                const { segmentStart, segmentEnd } = shiftSegmentForCalendarDay(shift, date);
                                const groupName = groupsMap.get(shift.group.id)?.name ?? shift.group.name;
                                return (
                                  <OnCallTilePopover
                                    trigger={
                                      <button
                                        type="button"
                                        className={cn(
                                          "rounded-md p-0.5 text-amber-600 hover:bg-amber-500/15 hover:text-amber-700",
                                          "dark:text-amber-400 dark:hover:bg-amber-500/20 dark:hover:text-amber-300",
                                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        )}
                                        aria-label={t(
                                          "on-call.openAssignedShiftDetails",
                                          "Open on-call shift details"
                                        )}
                                      >
                                        <ClockAlert className="h-3.5 w-3.5" />
                                      </button>
                                    }
                                    groupName={groupName}
                                    groupColor={groupsMap.get(shift.group.id)?.color}
                                    shift={shift}
                                    segmentStart={segmentStart}
                                    segmentEnd={segmentEnd}
                                    triggerMode={triggerMode}
                                    onEditShift={onEditShift}
                                    onDeleteShift={onDeleteShift}
                                    onEmployeesAdded={onEmployeesAdded}
                                    policySection={policySectionHover}
                                  />
                                );
                              })()}
                            </div>
                          )}
                          {dayShiftsForIcon.length > 1 && (
                            <div
                              className="shrink-0 inline-flex items-center"
                              onClick={(e) => e.stopPropagation()}
                              onPointerDown={(e) => e.stopPropagation()}
                            >
                              <OnCallDayTileItemPopover
                                trigger={
                                  <button
                                    type="button"
                                    className={cn(
                                      "inline-flex items-center gap-0.5 rounded-md p-0.5 text-amber-600 hover:bg-amber-500/15 hover:text-amber-700",
                                      "dark:text-amber-400 dark:hover:bg-amber-500/20 dark:hover:text-amber-300",
                                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    )}
                                    aria-label={t(
                                      "on-call.openAssignedShiftsDetails",
                                      "Open on-call shifts for this day"
                                    )}
                                  >
                                    <ClockAlert className="h-3.5 w-3.5" />
                                    <span className="text-[10px] font-medium tabular-nums text-amber-600 dark:text-amber-400">
                                      {dayShiftsForIcon.length}
                                    </span>
                                  </button>
                                }
                                day={date}
                                dayShifts={dayShiftsForIcon.map((shift) => ({
                                  groupId: shift.group.id,
                                  groupName: groupsMap.get(shift.group.id)?.name ?? shift.group.name,
                                  shift,
                                  continuesFromPrevWeek: false,
                                  continuesToNextWeek: false,
                                }))}
                                groupsMap={groupsMap}
                                triggerMode={triggerMode}
                                calendarVariant={calendarVariant}
                                onEditShift={onEditShift}
                                onDeleteShift={onDeleteShift}
                                onEmployeesAdded={onEmployeesAdded}
                                policySection={policySectionHover}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {assigned
                    .filter(({ lane }) => !hasOverflow || lane < maxVisibleLanes)
                    .map(({ item, lane }) => {
                      if (item.kind === "policy") {
                        return (
                          <div
                            key={item.stableKey}
                            className="min-w-0 col-span-1 mx-1"
                            style={{
                              gridColumn: `${item.startCol} / ${item.endCol + 1}`,
                              gridRow: lane + 2,
                            }}
                          >
                            <PolicyCalendarTile
                              slot={item.slot}
                              sourceLabel={item.sourceLabel}
                              tileSize={tileSize}
                            />
                          </div>
                        );
                      }

                      const seg = item.segment;
                      return (
                        <div
                          key={item.stableKey}
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
                            groupName={
                              groupsMap.get(seg.shift.group.id)?.name ?? seg.shift.group.name
                            }
                            shift={seg.shift}
                            groupsMap={groupsMap}
                            segmentStart={seg.segmentStart}
                            segmentEnd={seg.segmentEnd}
                            continuesFromPrevWeek={seg.continuesFromPrevWeek}
                            continuesToNextWeek={seg.continuesToNextWeek}
                            isHovered={hoveredShiftId === seg.shift.id}
                            triggerMode={triggerMode}
                            size={tileSize}
                            calendarVariant={calendarVariant}
                            onEditShift={onEditShift}
                            onDeleteShift={onDeleteShift}
                            onEmployeesAdded={onEmployeesAdded}
                          />
                        </div>
                      );
                    })}

                  {hasOverflow &&
                    week.map(({ date, dateKey }, dayIdx) => {
                      const col = dayIdx + 1;
                      const overflowAssigned = assigned.filter(
                        (a) =>
                          a.lane >= maxVisibleLanes &&
                          a.item.startCol <= col &&
                          col <= a.item.endCol
                      );
                      const moreCount = overflowAssigned.length;

                      if (moreCount === 0) return null;

                      const dayShifts: OnCallDayTileItemForPopover[] = overflowAssigned
                        .filter(
                          (a): a is typeof a & {
                            item: Extract<UnifiedLaneItem, { kind: "shift" }>;
                          } => a.item.kind === "shift"
                        )
                        .map((a) => ({
                          groupId: a.item.segment.shift.group.id,
                          groupName:
                            groupsMap.get(a.item.segment.shift.group.id)?.name ??
                            a.item.segment.shift.group.name,
                          shift: a.item.segment.shift,
                          continuesFromPrevWeek: a.item.segment.continuesFromPrevWeek,
                          continuesToNextWeek: a.item.segment.continuesToNextWeek,
                        }));

                      const hasPolicyOverflow = overflowAssigned.some((a) => a.item.kind === "policy");

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

                      if (!hasPolicyOverflow && dayShifts.length > 0) {
                        return (
                          <div
                            key={dateKey}
                            className="min-w-0 col-span-1 mx-1"
                            style={{
                              gridColumn: `${col} / ${col + 1}`,
                              gridRow: maxVisibleLanes + 2,
                            }}
                          >
                            <OnCallDayTileItemPopover
                              trigger={trigger}
                              day={date}
                              dayShifts={dayShifts}
                              groupsMap={groupsMap}
                              triggerMode={triggerMode}
                              calendarVariant={calendarVariant}
                              onEditShift={onEditShift}
                              onDeleteShift={onDeleteShift}
                              onEmployeesAdded={onEmployeesAdded}
                            />
                          </div>
                        );
                      }

                      return (
                        <div
                          key={dateKey}
                          className="min-w-0 col-span-1 mx-1"
                          style={{
                            gridColumn: `${col} / ${col + 1}`,
                            gridRow: maxVisibleLanes + 2,
                          }}
                        >
                          <Popover>
                            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
                            <PopoverContent className="w-80 max-h-80 overflow-y-auto" align="start">
                              <div className="space-y-2 text-xs">
                                <p className="font-semibold text-muted-foreground">
                                  {format(date, "PPP")}
                                </p>
                                {overflowAssigned.map(({ item }) =>
                                  item.kind === "policy" ? (
                                    <div key={item.stableKey} className="space-y-0.5">
                                      <PolicyCalendarTile
                                        slot={item.slot}
                                        sourceLabel={item.sourceLabel}
                                        tileSize={tileSize}
                                      />
                                    </div>
                                  ) : (
                                    <OnCallDayTileItem
                                      key={item.stableKey}
                                      groupId={item.segment.shift.group.id}
                                      groupName={
                                        groupsMap.get(item.segment.shift.group.id)?.name ??
                                        item.segment.shift.group.name
                                      }
                                      shift={item.segment.shift}
                                      groupsMap={groupsMap}
                                      segmentStart={item.segment.segmentStart}
                                      segmentEnd={item.segment.segmentEnd}
                                      continuesFromPrevWeek={item.segment.continuesFromPrevWeek}
                                      continuesToNextWeek={item.segment.continuesToNextWeek}
                                      triggerMode={triggerMode}
                                      size={tileSize}
                                      calendarVariant={calendarVariant}
                                      onEditShift={onEditShift}
                                      onDeleteShift={onDeleteShift}
                                      onEmployeesAdded={onEmployeesAdded}
                                    />
                                  )
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      );
                    })}
                </div>

                <div
                  className="absolute inset-0 pointer-events-none grid p-1 z-10"
                  style={{
                    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                    gridTemplateRows: `minmax(28px, auto) repeat(${tileRowCount}, ${tileRowMin})`,
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
