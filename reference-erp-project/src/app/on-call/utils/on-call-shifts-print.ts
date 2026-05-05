import {
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  addDays,
  isSameMonth,
  eachMonthOfInterval,
} from "date-fns";
import type { Locale } from "date-fns";
import type { OnCallShift } from "@/types/field-service/on-call/on-call-shifts";
import type { OnCallGroup } from "@/types/field-service/on-call/groups";
import { getTagColorFromString } from "@/app/components/tag/utils";

/** Tag-style colors (bg-100, border-200, text-800) per color name for print. */
const TAG_COLOR_HEX: Record<string, { bg: string; border: string; text: string }> = {
  red: { bg: "#fee2e2", border: "#fecaca", text: "#9f1239" },
  orange: { bg: "#ffedd5", border: "#fed7aa", text: "#9a3412" },
  amber: { bg: "#fef3c7", border: "#fde68a", text: "#92400e" },
  yellow: { bg: "#fef9c3", border: "#fef08a", text: "#854d0e" },
  lime: { bg: "#ecfccb", border: "#d9f99d", text: "#3f6212" },
  green: { bg: "#dcfce7", border: "#bbf7d0", text: "#166534" },
  emerald: { bg: "#d1fae5", border: "#a7f3d0", text: "#065f46" },
  teal: { bg: "#ccfbf1", border: "#99f6e4", text: "#115e59" },
  cyan: { bg: "#cffafe", border: "#a5f3fc", text: "#155e75" },
  sky: { bg: "#e0f2fe", border: "#bae6fd", text: "#0369a1" },
  blue: { bg: "#dbeafe", border: "#bfdbfe", text: "#1e40af" },
  indigo: { bg: "#e0e7ff", border: "#c7d2fe", text: "#3730a3" },
  violet: { bg: "#ede9fe", border: "#ddd6fe", text: "#5b21b6" },
  purple: { bg: "#f3e8ff", border: "#e9d5ff", text: "#6b21a8" },
  fuchsia: { bg: "#fae8ff", border: "#f5d0fe", text: "#86198f" },
  pink: { bg: "#fce7f3", border: "#fbcfe8", text: "#9d174d" },
  rose: { bg: "#ffe4e6", border: "#fecdd3", text: "#9f1239" },
  slate: { bg: "#f1f5f9", border: "#e2e8f0", text: "#1e293b" },
  gray: { bg: "#f3f4f6", border: "#e5e7eb", text: "#1f2937" },
  zinc: { bg: "#f4f4f5", border: "#e4e4e7", text: "#27272a" },
  stone: { bg: "#f5f5f4", border: "#e7e5e4", text: "#292524" },
};

function getTagStyleHex(color: string): { bg: string; border: string; text: string } {
  const c = color.toLowerCase();
  return TAG_COLOR_HEX[c] ?? TAG_COLOR_HEX.blue;
}

export interface PrintShiftsParams {
  shifts: OnCallShift[];
  groupsMap: Map<string, OnCallGroup>;
  showMonthView: boolean;
  currentMonthStart: Date;
  selectedYear: number;
  locale: Locale;
  t: (key: string, fallback?: string) => string;
}

function getDatesWithShifts(shifts: OnCallShift[]): Set<string> {
  const set = new Set<string>();
  for (const s of shifts) {
    const start = parseISO(s.start_date);
    const end = parseISO(s.end_date);
    const d = new Date(start);
    while (d <= end) {
      set.add(format(d, "yyyy-MM-dd"));
      d.setDate(d.getDate() + 1);
    }
  }
  return set;
}

function renderMonthCalendar(
  monthStart: Date,
  highlightedDates: Set<string>,
  locale: Locale,
  options: {
    hideOutsideDays?: boolean;
    showMonthLabel?: boolean;
    groupColor?: string;
  } = {}
): string {
  const { hideOutsideDays = false, showMonthLabel = false, groupColor } = options;
  const tagStyle = groupColor ? getTagStyleHex(groupColor) : null;
  const start = startOfMonth(monthStart);
  const calendarStart = startOfWeek(start, { weekStartsOn: 1 });
  const calendarEnd = addDays(calendarStart, 41);
  const weekdays = [1, 2, 3, 4, 5, 6, 7].map((d) =>
    format(new Date(2024, 0, d), "EEE", { locale })
  );
  const grid = weekdays.map((d) => `<th class="cal-wday">${d}</th>`).join("");
  let current = new Date(calendarStart);
  const week: string[] = [];
  const rows: string[] = [];
  while (current <= calendarEnd) {
    const dateKey = format(current, "yyyy-MM-dd");
    const isHighlight = highlightedDates.has(dateKey);
    const isCurrentMonth = isSameMonth(current, monthStart);
    const outsideClass = !isCurrentMonth ? "cal-day-outside" : "";
    const hideClass = hideOutsideDays && !isCurrentMonth ? "cal-day-unpainted" : "";
    const shouldHighlight =
      isHighlight && (!hideOutsideDays || isCurrentMonth);
    const highlightStyle =
      shouldHighlight && tagStyle
        ? ` style="background:${tagStyle.bg}!important;border-color:${tagStyle.border}!important;color:${tagStyle.text}!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;font-weight:600!important"`
        : "";
    const highlightClass = shouldHighlight && !tagStyle ? " cal-day-highlight" : "";
    week.push(
      `<td class="cal-day${highlightClass} ${outsideClass} ${hideClass}"${highlightStyle}>${isCurrentMonth ? current.getDate() : ""}</td>`
    );
    if (week.length === 7) {
      rows.push(`<tr>${week.join("")}</tr>`);
      week.length = 0;
    }
    current = addDays(current, 1);
  }
  if (week.length > 0) rows.push(`<tr>${week.join("")}</tr>`);
  const monthLabel = showMonthLabel
    ? `<div class="cal-month-label">${format(monthStart, "MMM", { locale })}</div>`
    : "";
  return `
    <div class="cal-month">
      ${monthLabel}
      <table class="cal-table"><thead><tr>${grid}</tr></thead><tbody>${rows.join("")}</tbody></table>
    </div>`;
}

function renderYearCalendars(
  year: number,
  highlightedDates: Set<string>,
  locale: Locale,
  groupColor?: string
): string {
  const months = eachMonthOfInterval({
    start: new Date(year, 0, 1),
    end: new Date(year, 11, 31),
  });
  return `
    <div class="cal-year-grid">
      ${months.map((m) => renderMonthCalendar(m, highlightedDates, locale, { showMonthLabel: true, hideOutsideDays: true, groupColor })).join("")}
    </div>`;
}

const PRINT_STYLES = `
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 8pt;
      line-height: 1.3;
      color: #1f2937;
      padding: 0;
      max-width: 1100px;
      margin: 0 auto;
      background: #fff;
    }
    .groups-list { display: flex; flex-direction: column; gap: 4px; }
    .group {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 10px;
      align-items: start;
      break-inside: avoid;
      padding: 4px 6px;
      border-bottom: 1px solid #e5e7eb;
    }
    .group.group-year {
      grid-template-columns: 1fr;
    }
    .group.group-year .group-header { margin-bottom: 2px; }
    .group.group-year .group-employees { text-align: left; margin-bottom: 4px; }
    .group:last-child { border-bottom: none; }
    .group-shifts { min-width: 0; }
    .group-title {
      font-weight: 600;
      font-size: 0.7rem;
      margin-bottom: 3px;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .shift-range {
      margin: 0 0 1px 0;
      font-size: 0.7rem;
      padding: 0;
    }
    .group-cal {
      display: flex;
      justify-content: center;
      min-width: 0;
    }
    .group-employees {
      font-size: 0.65rem;
      color: #6b7280;
      min-width: 0;
      text-align: right;
    }
    .group-employees-list { display: inline; }
    .cal-month { margin-bottom: 2px; }
    .cal-table {
      border-collapse: collapse;
      font-size: 0.55rem;
      width: 100%;
      max-width: 120px;
      border: 1px solid #e5e7eb;
      border-radius: 2px;
      overflow: hidden;
    }
    .cal-wday {
      padding: 2px 1px;
      text-align: center;
      font-weight: 600;
      font-size: 0.5rem;
      text-transform: uppercase;
      background: #f9fafb;
      color: #6b7280;
      border-bottom: 1px solid #e5e7eb;
    }
    .cal-day {
      padding: 2px 1px;
      text-align: center;
      border: 1px solid #e5e7eb;
      font-weight: 500;
    }
    .cal-day-highlight {
      background: #dbeafe !important;
      border-color: #bfdbfe !important;
      color: #1e40af !important;
      font-weight: 600 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .cal-day-outside { color: #9ca3af; background: #fafafa; }
    .cal-day-unpainted { background: transparent !important; border-color: transparent !important; color: transparent !important; }
    .cal-month-label { font-size: 0.5rem; font-weight: 600; text-align: center; margin-bottom: 2px; color: #374151; }
    .cal-year-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; }
    .cal-year-grid .cal-month { margin-bottom: 0; }
    .cal-year-grid .cal-month-label { font-size: 0.45rem; margin-bottom: 1px; }
    .cal-year-grid .cal-table { max-width: 80px; font-size: 0.45rem; }
    .cal-year-grid .cal-wday { padding: 1px; font-size: 0.4rem; }
    .cal-year-grid .cal-day { padding: 1px; }
    @media print {
      body { padding: 4px; }
      .groups-list { gap: 4px; }
      .group { padding: 4px 6px; gap: 10px; }
    }
`;

export function generateOnCallShiftsPrintHtml(params: PrintShiftsParams): string {
  const {
    shifts,
    groupsMap,
    showMonthView,
    currentMonthStart,
    selectedYear,
    locale,
    t,
  } = params;

  const shiftsByGroup = new Map<
    string,
    { name: string; color: string; shifts: OnCallShift[]; employees: OnCallShift["employees"] }
  >();
  for (const shift of shifts) {
    const groupId = shift.group.id;
    const groupFromMap = groupsMap.get(groupId);
    const groupName = groupFromMap?.name ?? shift.group.name;
    const groupColor = groupFromMap?.color ?? shift.group.color ?? getTagColorFromString(groupName);
    const allEmployees = [...shift.employees, ...(shift.exception_employees ?? [])];
    if (!shiftsByGroup.has(groupId)) {
      shiftsByGroup.set(groupId, {
        name: groupName,
        color: groupColor,
        shifts: [],
        employees: allEmployees,
      });
    } else {
      const existing = shiftsByGroup.get(groupId)!;
      const seenIds = new Set(existing.employees.map((se) => se.employee.id));
      for (const se of allEmployees) {
        if (!seenIds.has(se.employee.id)) {
          existing.employees.push(se);
          seenIds.add(se.employee.id);
        }
      }
    }
    shiftsByGroup.get(groupId)!.shifts.push(shift);
  }
  const sortedGroups = Array.from(shiftsByGroup.entries()).sort(
    ([, a], [, b]) => a.name.localeCompare(b.name)
  );

  const formatShiftRange = (s: OnCallShift) => {
    const start = parseISO(s.start_date);
    const end = parseISO(s.end_date);
    const shortDay = (d: Date) => format(d, "EEE d", { locale });
    if (s.start_date === s.end_date) {
      return showMonthView ? shortDay(start) : format(start, "MMM d", { locale });
    }
    return showMonthView
      ? `${shortDay(start)} – ${shortDay(end)}`
      : `${format(start, "MMM d", { locale })} – ${format(end, "MMM d", { locale })}`;
  };

  const periodTitle = showMonthView
    ? format(currentMonthStart, "MMMM yyyy", { locale })
    : String(selectedYear);

  const groupsHtml = sortedGroups
    .map(([, { name, color: groupColor, shifts: groupShifts, employees: groupEmployees }]) => {
      const highlightedDates = getDatesWithShifts(groupShifts);
      const calendarHtml = showMonthView
        ? renderMonthCalendar(currentMonthStart, highlightedDates, locale, {
            hideOutsideDays: true,
            groupColor,
          })
        : renderYearCalendars(selectedYear, highlightedDates, locale, groupColor);
      const employeesList = groupEmployees
        .map((se) => `${se.employee.first_name || ""} ${se.employee.last_name || ""}`.trim() || se.employee.email)
        .filter(Boolean)
        .join(", ");
      if (showMonthView) {
        return `
    <div class="group">
      <div class="group-shifts">
        <div class="group-title">${name} ${t("on-call.shiftsLabel", "shifts")}:</div>
        ${groupShifts.map((s) => `<div class="shift-range">${formatShiftRange(s)}</div>`).join("")}
      </div>
      <div class="group-cal">${calendarHtml}</div>
      <div class="group-employees">
        <span class="group-employees-list">${employeesList || "—"}</span>
      </div>
    </div>`;
      }
      return `
    <div class="group group-year">
      <div class="group-header">
        <div class="group-title">${name}</div>
        <div class="group-employees">
          <span class="group-employees-list">${employeesList || "—"}</span>
        </div>
      </div>
      <div class="group-cal">${calendarHtml}</div>
    </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${periodTitle} - On Call Shifts</title>
  <style>${PRINT_STYLES}</style>
</head>
<body>
  <div class="groups-list">
  ${groupsHtml}
  </div>
</body>
</html>`;
}

export function printOnCallShiftsHtml(html: string): boolean {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return false;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.onafterprint = () => printWindow.close();
  }, 100);
  return true;
}
