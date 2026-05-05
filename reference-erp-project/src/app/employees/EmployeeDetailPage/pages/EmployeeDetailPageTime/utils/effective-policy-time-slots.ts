import { addDays, format, getISODay, startOfMonth, startOfWeek } from "date-fns";
import type { OnCallShift } from "@/types/field-service/on-call/on-call-shifts";
import type { TimePolicy, TimePolicyType, TimeSlot, TimeSlotRange } from "@/types/general/time-policies";
import { hasAssignedOnCallShiftOnDate } from "./on-call-shift-date-overlap";

export type PolicyScheduleSource = Extract<TimePolicyType, "default" | "on_call" | "special">;

export interface EffectivePolicyDay {
  source: PolicyScheduleSource;
  slots: TimeSlot[];
}

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  if (timeStr.includes("T")) {
    const d = new Date(timeStr);
    if (!Number.isNaN(d.getTime())) {
      return d.getHours() * 60 + d.getMinutes();
    }
  }
  const [hours, minutes] = timeStr.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

function dateKeyInRange(dateKey: string, from: string, to: string): boolean {
  const f = from.slice(0, 10);
  const t = to.slice(0, 10);
  return dateKey >= f && dateKey <= t;
}

function overlappingRangesForDate(ranges: TimeSlotRange[], dateKey: string): TimeSlotRange[] {
  return ranges.filter((r) => dateKeyInRange(dateKey, r.from_date, r.to_date));
}

function collectSlotsForType(
  date: Date,
  timePolicy: TimePolicy,
  isHoliday: boolean,
  type: PolicyScheduleSource
): TimeSlot[] {
  const dateKey = format(date, "yyyy-MM-dd");
  const isoDay = getISODay(date);
  const overlapping = overlappingRangesForDate(timePolicy.time_slot_ranges, dateKey);
  if (overlapping.length === 0) return [];

  const slotMatchesDayAndHoliday = (slot: TimeSlot) =>
    slot.day_of_week === isoDay &&
    (isHoliday ? slot.is_holiday === true : slot.is_holiday !== true);

  const byId = new Map<string, TimeSlot>();
  for (const r of overlapping) {
    if (r.type !== type) continue;
    for (const slot of r.time_slots ?? []) {
      if (slotMatchesDayAndHoliday(slot)) {
        byId.set(slot.id, slot);
      }
    }
  }
  return Array.from(byId.values()).sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
}

/**
 * Calendar / schedule display precedence (month + year views, tiles, tooltips, print policy source):
 *
 * - **If an assigned on-call shift exists on this date:** `on_call` time policy slots (if any for this date),
 *   else `special`, else `default`.
 * - **If no assigned shift:** `special`, then `default` (on-call policy template is not shown without a shift).
 */
export function getEffectivePolicyTimeSlotsForCalendarDisplay(
  date: Date,
  timePolicy: TimePolicy | null,
  isHoliday: boolean,
  assignedOnCallShifts: OnCallShift[]
): EffectivePolicyDay | null {
  if (!timePolicy?.time_slot_ranges?.length) return null;

  const hasShift = hasAssignedOnCallShiftOnDate(assignedOnCallShifts, date);

  if (hasShift) {
    const onCall = collectSlotsForType(date, timePolicy, isHoliday, "on_call");
    if (onCall.length > 0) return { source: "on_call", slots: onCall };
    const special = collectSlotsForType(date, timePolicy, isHoliday, "special");
    if (special.length > 0) return { source: "special", slots: special };
    const def = collectSlotsForType(date, timePolicy, isHoliday, "default");
    if (def.length > 0) return { source: "default", slots: def };
    return null;
  }

  const special = collectSlotsForType(date, timePolicy, isHoliday, "special");
  if (special.length > 0) return { source: "special", slots: special };
  const def = collectSlotsForType(date, timePolicy, isHoliday, "default");
  if (def.length > 0) return { source: "default", slots: def };
  return null;
}

/**
 * Which time policy row applies for coloring / print keys for this day (same rules as
 * {@link getEffectivePolicyTimeSlotsForCalendarDisplay}).
 */
export function getDisplayedPolicySourceForDate(
  date: Date,
  timePolicy: TimePolicy | null,
  assignedOnCallShifts: OnCallShift[],
  isHoliday = false
): PolicyScheduleSource | null {
  const effective = getEffectivePolicyTimeSlotsForCalendarDisplay(
    date,
    timePolicy,
    isHoliday,
    assignedOnCallShifts
  );
  return effective?.source ?? null;
}

/** Same grid window as `OnCallCalendar` (6 weeks from month start). */
export function eachCalendarDateInMonthView(monthStart: Date): Date[] {
  const start = startOfMonth(monthStart);
  const calendarStart = startOfWeek(start, { weekStartsOn: 1 });
  const out: Date[] = [];
  let current = calendarStart;
  const end = addDays(calendarStart, 41);
  while (current <= end) {
    out.push(new Date(current));
    current = addDays(current, 1);
  }
  return out;
}

export function eachCalendarDateInYear(year: number): Date[] {
  const out: Date[] = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  let current = new Date(start);
  while (current <= end) {
    out.push(new Date(current));
    current = addDays(current, 1);
  }
  return out;
}
