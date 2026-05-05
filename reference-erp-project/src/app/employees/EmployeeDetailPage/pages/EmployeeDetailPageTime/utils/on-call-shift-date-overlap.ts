import { endOfDay, parseISO, startOfDay } from "date-fns";
import type { OnCallShift } from "@/types/field-service/on-call/on-call-shifts";

/** Same end-date handling as the on-call calendar (avoids timezone pushing past the day). */
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

export function onCallShiftOverlapsCalendarDate(shift: OnCallShift, date: Date): boolean {
  const start = parseISO(shift.start_date);
  const end = parseShiftEndDate(shift.end_date);
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  return start <= dayEnd && end >= dayStart;
}

/** True if any assigned on-call shift overlaps this calendar day. */
export function hasAssignedOnCallShiftOnDate(shifts: OnCallShift[], date: Date): boolean {
  return shifts.some((s) => onCallShiftOverlapsCalendarDate(s, date));
}
