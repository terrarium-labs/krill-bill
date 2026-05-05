import type { TFunction } from "i18next";
import type { EffectivePolicyDay, PolicyScheduleSource } from "./effective-policy-time-slots";
import type { TimeSlot } from "@/types/general/time-policies";
import { getColorClasses, RATES_COLORS } from "@/utils/miscelanea";

/** `type` = same legend as year calendar (green / orange / purple). `default` = per-slot name colors (admin parity). */
export type PolicyScheduleTileVariant = "default" | "type";

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

/** Start instant for ordering policy slots vs on-call shifts on this calendar date. */
export function policySlotSortStartMs(dateKey: string, startTime: string): number {
  const [y, mo, dd] = dateKey.split("-").map(Number);
  const base = new Date(y, (mo ?? 1) - 1, dd ?? 1);
  return base.getTime() + timeToMinutes(startTime) * 60 * 1000;
}

export interface PolicySlotLineDisplay {
  id: string;
  /** Slot label (same basis as admin time policy grid). */
  name: string;
  /** e.g. "09:00 - 17:00" */
  timeRange: string;
  /** Tailwind classes from `getColorClasses` in miscelanea (matches time policy shift tiles). */
  colorClasses: string;
  /** Order relative to on-call shifts on the same day. */
  sortStartMs: number;
  /** Full slot for hover card parity with admin time policy shifts grid. */
  timeSlot: TimeSlot;
}

export interface PolicyDayDisplayInfo {
  source: PolicyScheduleSource;
  sourceLabel: string;
  slots: PolicySlotLineDisplay[];
}

export function formatTimeSlotTime(timeStr: string): string {
  if (!timeStr) return "";
  if (timeStr.includes("T")) {
    const d = new Date(timeStr);
    if (!Number.isNaN(d.getTime())) {
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      return `${h}:${m}`;
    }
  }
  return timeStr.substring(0, 5);
}

function colorNameForSlotName(slots: TimeSlot[], slotName: string): string {
  const uniqueSlotNames = Array.from(new Set(slots.map((slot) => slot.name))).sort();
  const colorIndex = uniqueSlotNames.indexOf(slotName) % RATES_COLORS.length;
  return RATES_COLORS[colorIndex >= 0 ? colorIndex : 0] ?? RATES_COLORS[0]!;
}

function colorNameForScheduleSource(source: PolicyScheduleSource): string {
  if (source === "default") return "green";
  if (source === "on_call") return "orange";
  return "purple";
}

function buildPolicySlotDisplays(
  slots: TimeSlot[],
  dateKey: string,
  source: PolicyScheduleSource,
  scheduleTileVariant: PolicyScheduleTileVariant
): PolicySlotLineDisplay[] {
  const displays: PolicySlotLineDisplay[] = slots.map((slot) => {
    const timeRange = `${formatTimeSlotTime(slot.start_time)} - ${formatTimeSlotTime(slot.end_time)}`;
    const name = slot.name?.trim() || "—";
    const colorName =
      scheduleTileVariant === "type"
        ? colorNameForScheduleSource(source)
        : colorNameForSlotName(slots, slot.name);
    return {
      id: slot.id,
      name,
      timeRange,
      colorClasses: getColorClasses(colorName),
      sortStartMs: policySlotSortStartMs(dateKey, slot.start_time),
      timeSlot: slot,
    };
  });
  return displays.sort((a, b) => a.sortStartMs - b.sortStartMs);
}

export function toPolicyDayDisplayInfo(
  effective: EffectivePolicyDay,
  t: TFunction,
  dateKey: string,
  options?: { scheduleTileVariant?: PolicyScheduleTileVariant }
): PolicyDayDisplayInfo {
  const scheduleTileVariant = options?.scheduleTileVariant ?? "default";
  const sourceLabel =
    effective.source === "special"
      ? t("employeesDetail.policyScheduleSourceSpecial", "Special Shift")
      : effective.source === "on_call"
        ? t("employeesDetail.policyScheduleSourceOnCall", "On-call Shift")
        : t("employeesDetail.policyScheduleSourceDefault", "Work Shift");
  return {
    source: effective.source,
    sourceLabel,
    slots: buildPolicySlotDisplays(
      effective.slots,
      dateKey,
      effective.source,
      scheduleTileVariant
    ),
  };
}
