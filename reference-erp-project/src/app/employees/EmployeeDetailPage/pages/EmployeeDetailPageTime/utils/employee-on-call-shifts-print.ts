import {
  format,
  startOfMonth,
  startOfWeek,
  addDays,
  isSameMonth,
  eachMonthOfInterval,
} from "date-fns";
import type { Locale } from "date-fns";
import type { OnCallShift } from "@/types/field-service/on-call/on-call-shifts";
import type { OnCallGroup } from "@/types/field-service/on-call/groups";
import type { TimePolicy } from "@/types/general/time-policies";
import { getTagColorFromString } from "@/app/components/tag/utils";
import { formatDateRange } from "@/utils/miscelanea";
import {
  eachCalendarDateInMonthView,
  eachCalendarDateInYear,
  getDisplayedPolicySourceForDate,
} from "@/app/employees/EmployeeDetailPage/pages/EmployeeDetailPageTime/utils/effective-policy-time-slots";
import { hasAssignedOnCallShiftOnDate } from "@/app/employees/EmployeeDetailPage/pages/EmployeeDetailPageTime/utils/on-call-shift-date-overlap";

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

export type PrintScheduleKind = "default" | "on_call_policy" | "special" | "on_call_shifts";

export const PRINT_SCHEDULE_KIND_ORDER: PrintScheduleKind[] = [
  "default",
  "on_call_policy",
  "special",
  "on_call_shifts",
];

/** Single calendar-only block: on-call policy days ∪ assigned shift days (no group layout). */
type PrintSectionLoopKind = PrintScheduleKind | "on_call_merged";

function collapseOnCallPolicyAndShifts(
  kinds: PrintScheduleKind[]
): PrintSectionLoopKind[] {
  const set = new Set(kinds);
  const hasOnCallPolicy = set.has("on_call_policy");
  const hasOnCallShifts = set.has("on_call_shifts");
  if (!hasOnCallPolicy && !hasOnCallShifts) {
    return kinds;
  }
  const ordered = PRINT_SCHEDULE_KIND_ORDER.filter((k) => set.has(k));
  const out: PrintSectionLoopKind[] = [];
  let mergedOnCall = false;
  for (const k of ordered) {
    if (k === "on_call_policy" || k === "on_call_shifts") {
      if (!mergedOnCall) {
        out.push("on_call_merged");
        mergedOnCall = true;
      }
    } else {
      out.push(k);
    }
  }
  return out;
}

const POLICY_KIND_COLOR: Record<Exclude<PrintScheduleKind, "on_call_shifts">, string> = {
  default: "green",
  on_call_policy: "orange",
  special: "purple",
};

/** Includes merged on-call policy + on-call shifts in one print action. */
export type PrintShiftsMode = "all" | PrintScheduleKind | "on_call_union";

export interface PrintShiftsParams {
  shifts: OnCallShift[];
  groupsMap: Map<string, OnCallGroup>;
  showMonthView: boolean;
  currentMonthStart: Date;
  selectedYear: number;
  locale: Locale;
  t: (key: string, fallback?: string) => string;
  /** When set, enables schedule-type sections (employee time policy). */
  timePolicy?: TimePolicy | null;
  /**
   * What to include. With `timePolicy`, `all` prints every present kind in order (default → on-call policy → special → shifts).
   * Without `timePolicy`, only on-call shift groups are printed.
   */
  printMode?: PrintShiftsMode;
}

function getDatesInPeriod(params: {
  showMonthView: boolean;
  currentMonthStart: Date;
  selectedYear: number;
}): Date[] {
  const { showMonthView, currentMonthStart, selectedYear } = params;
  return showMonthView
    ? eachCalendarDateInMonthView(currentMonthStart)
    : eachCalendarDateInYear(selectedYear);
}

/** Dates in the visible period where an assigned on-call shift applies (yyyy-MM-dd). */
function getShiftDateKeysInPeriod(shifts: OnCallShift[], periodDates: Date[]): Set<string> {
  const set = new Set<string>();
  for (const d of periodDates) {
    if (hasAssignedOnCallShiftOnDate(shifts, d)) {
      set.add(format(d, "yyyy-MM-dd"));
    }
  }
  return set;
}

function getPolicyDateKeysByKind(
  timePolicy: TimePolicy | null,
  shifts: OnCallShift[],
  periodDates: Date[]
): Record<Exclude<PrintScheduleKind, "on_call_shifts">, Set<string>> {
  const out: Record<Exclude<PrintScheduleKind, "on_call_shifts">, Set<string>> = {
    default: new Set(),
    on_call_policy: new Set(),
    special: new Set(),
  };
  if (!timePolicy?.time_slot_ranges?.length) return out;
  for (const d of periodDates) {
    const src = getDisplayedPolicySourceForDate(d, timePolicy, shifts, false);
    if (src === "default") out.default.add(format(d, "yyyy-MM-dd"));
    else if (src === "on_call") out.on_call_policy.add(format(d, "yyyy-MM-dd"));
    else if (src === "special") out.special.add(format(d, "yyyy-MM-dd"));
  }
  return out;
}

export function computePrintKindsPresent(params: {
  timePolicy: TimePolicy | null | undefined;
  shifts: OnCallShift[];
  showMonthView: boolean;
  currentMonthStart: Date;
  selectedYear: number;
}): Set<PrintScheduleKind> {
  const { timePolicy, shifts, showMonthView, currentMonthStart, selectedYear } = params;
  const periodDates = getDatesInPeriod({ showMonthView, currentMonthStart, selectedYear });
  const kinds = new Set<PrintScheduleKind>();

  const shiftKeys = getShiftDateKeysInPeriod(shifts, periodDates);
  if (shiftKeys.size > 0) kinds.add("on_call_shifts");

  const policyKeys = getPolicyDateKeysByKind(timePolicy ?? null, shifts, periodDates);
  if (policyKeys.default.size > 0) kinds.add("default");
  if (policyKeys.on_call_policy.size > 0) kinds.add("on_call_policy");
  if (policyKeys.special.size > 0) kinds.add("special");

  return kinds;
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
    .print-section-title {
      font-size: 0.85rem;
      font-weight: 600;
      margin: 0 0 6px 0;
      color: #111827;
    }
    .print-section { break-inside: avoid; margin-bottom: 8px; }
    .print-schedule-root { display: flex; flex-direction: column; gap: 8px; }
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

function sectionTitleForKind(
  kind: PrintScheduleKind,
  t: (key: string, fallback?: string) => string
): string {
  switch (kind) {
    case "default":
      return t("on-call.legendWorkShift", "Work Shift");
    case "on_call_policy":
    case "on_call_shifts":
      return t("on-call.legendOnCallShift", "OnCall Shift");
    case "special":
      return t("on-call.legendSpecialShift", "Special Shift");
    default:
      return "";
  }
}

function buildPolicyOnlySectionHtml(
  kind: Exclude<PrintScheduleKind, "on_call_shifts">,
  dateKeys: Set<string>,
  params: Pick<
    PrintShiftsParams,
    "showMonthView" | "currentMonthStart" | "selectedYear" | "locale"
  >
): string {
  const { showMonthView, currentMonthStart, selectedYear, locale } = params;
  const color = POLICY_KIND_COLOR[kind];
  const calendarHtml = showMonthView
    ? renderMonthCalendar(currentMonthStart, dateKeys, locale, {
        hideOutsideDays: true,
        groupColor: color,
      })
    : renderYearCalendars(selectedYear, dateKeys, locale, color);
  return `<div class="group-cal policy-section-cal">${calendarHtml}</div>`;
}

function buildShiftsGroupsHtml(params: PrintShiftsParams): string {
  const {
    shifts,
    groupsMap,
    showMonthView,
    currentMonthStart,
    selectedYear,
    locale,
    t,
  } = params;

  const periodDates = getDatesInPeriod({ showMonthView, currentMonthStart, selectedYear });

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
  const sortedGroups = Array.from(shiftsByGroup.entries()).sort(([, a], [, b]) =>
    a.name.localeCompare(b.name)
  );

  const formatShiftRange = (s: OnCallShift) =>
    formatDateRange(s.start_date, s.end_date, { useUTC: false, dateOnly: true });

  const groupsHtml = sortedGroups
    .map(([, { name, color: groupColor, shifts: groupShifts, employees: groupEmployees }]) => {
      const highlightedDates = getShiftDateKeysInPeriod(groupShifts, periodDates);
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

  return `
  <div class="groups-list">
  ${groupsHtml}
  </div>`;
}

export function generateOnCallShiftsPrintHtml(params: PrintShiftsParams): string {
  const {
    shifts,
    showMonthView,
    currentMonthStart,
    selectedYear,
    locale,
    t,
    timePolicy,
    printMode = "all",
  } = params;

  const periodTitle = showMonthView
    ? format(currentMonthStart, "MMMM yyyy", { locale })
    : String(selectedYear);

  const periodDates = getDatesInPeriod({ showMonthView, currentMonthStart, selectedYear });
  const policyKeys = getPolicyDateKeysByKind(timePolicy ?? null, shifts, periodDates);
  const kindsPresent = computePrintKindsPresent({
    timePolicy,
    shifts,
    showMonthView,
    currentMonthStart,
    selectedYear,
  });

  const hasPolicy = !!timePolicy?.time_slot_ranges?.length;

  /** Org / no policy: legacy single block (on-call shift groups only). */
  if (!hasPolicy) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${periodTitle} - ${t("on-call.printSectionOnCallShifts", "On-call shifts")}</title>
  <style>${PRINT_STYLES}</style>
</head>
<body>
  ${buildShiftsGroupsHtml(params)}
</body>
</html>`;
  }

  const resolveKindsToRender = (): PrintScheduleKind[] => {
    if (printMode === "all") {
      return PRINT_SCHEDULE_KIND_ORDER.filter((k) => kindsPresent.has(k));
    }
    if (printMode === "on_call_union") {
      return (["on_call_policy", "on_call_shifts"] as const).filter((k) =>
        kindsPresent.has(k)
      ) as PrintScheduleKind[];
    }
    if (kindsPresent.has(printMode)) {
      return [printMode];
    }
    return [];
  };

  const kindsToRender = resolveKindsToRender();
  const sectionKinds = collapseOnCallPolicyAndShifts(kindsToRender);
  if (sectionKinds.length === 0) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${periodTitle}</title>
  <style>${PRINT_STYLES}</style>
</head>
<body><p>${t("on-call.printNothingInPeriod", "Nothing to print for this period.")}</p></body>
</html>`;
  }

  const sections: string[] = [];
  for (const kind of sectionKinds) {
    if (kind === "on_call_merged") {
      const mergedKeys = new Set<string>(policyKeys.on_call_policy);
      getShiftDateKeysInPeriod(shifts, periodDates).forEach((k) => mergedKeys.add(k));
      sections.push(`<div class="print-section">
  <div class="print-section-title">${t("on-call.legendOnCallShift", "OnCall Shift")}</div>
  ${buildPolicyOnlySectionHtml("on_call_policy", mergedKeys, {
    showMonthView,
    currentMonthStart,
    selectedYear,
    locale,
  })}
</div>`);
      continue;
    }
    if (kind === "on_call_shifts") {
      const keys = getShiftDateKeysInPeriod(shifts, periodDates);
      sections.push(`<div class="print-section">
  <div class="print-section-title">${sectionTitleForKind("on_call_shifts", t)}</div>
  ${buildPolicyOnlySectionHtml("on_call_policy", keys, {
    showMonthView,
    currentMonthStart,
    selectedYear,
    locale,
  })}
</div>`);
      continue;
    }
    const policyKind = kind;
    const keys = policyKeys[policyKind];
    sections.push(`<div class="print-section">
  <div class="print-section-title">${sectionTitleForKind(policyKind, t)}</div>
  ${buildPolicyOnlySectionHtml(policyKind, keys, {
    showMonthView,
    currentMonthStart,
    selectedYear,
    locale,
  })}
</div>`);
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${periodTitle} - ${t("on-call.printShifts", "Print Shifts")}</title>
  <style>${PRINT_STYLES}</style>
</head>
<body>
  <div class="print-schedule-root">
  ${sections.join("")}
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
