import type { OnCallGroup } from "@/types/field-service/on-call/groups";
import type { OnCallShift } from "@/types/field-service/on-call/on-call-shifts";
import type { PolicyDayDisplayInfo } from "@/app/employees/EmployeeDetailPage/pages/EmployeeDetailPageTime/utils/policy-day-display";
import { getColorClasses } from "@/utils/miscelanea";
import { getTagColorFromString } from "@/app/components/tag/utils";
import { cn } from "@/lib/utils";

/** `default` = per-group / per-slot colors (month parity). `type` = one color per category (green / orange / purple). */
export type YearCalendarCellVariant = "default" | "type";

/** Same shape as `DayShift` in the year calendar. */
export type YearDayShiftRow = {
  shift: OnCallShift;
  groupId: string;
  groupName: string;
};

interface YearDayCellPaintedProps {
  dayNum: number;
  dayShifts: YearDayShiftRow[];
  policyInfo: PolicyDayDisplayInfo | null | undefined;
  groupsMap: Map<string, OnCallGroup>;
}

type YearDayCellTypePaintedProps = {
  dayNum: number;
  dayShifts: YearDayShiftRow[];
  policyInfo: PolicyDayDisplayInfo | null | undefined;
};

/**
 * Solid type cell: `absolute inset-0` so height matches across CalendarDayButton vs on-call shift button wrappers.
 * (A flex child with `h-full` was shorter on shift-only days.)
 */
function TypeSolidDayFill({ color, dayNum }: { color: string; dayNum: number }) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-0 flex items-center justify-center rounded-md border-none",
        getColorClasses(color)
      )}
    >
      <span className="font-semibold text-xs tabular-nums leading-none">{dayNum}</span>
    </div>
  );
}

/**
 * One color per schedule category: default → green, on-call (policy or shifts) → orange, special → purple.
 * Assigned shifts always use solid orange (no diagonal splits — avoids stacking opacity and matches legend).
 */
export function YearDayCellTypePainted({
  dayNum,
  dayShifts,
  policyInfo,
}: YearDayCellTypePaintedProps) {
  const hasShifts = dayShifts.length > 0;
  const source = policyInfo?.source;

  if (hasShifts) {
    return <TypeSolidDayFill color="orange" dayNum={dayNum} />;
  }

  if (source === "special") {
    return <TypeSolidDayFill color="purple" dayNum={dayNum} />;
  }

  if (source === "on_call") {
    return <TypeSolidDayFill color="orange" dayNum={dayNum} />;
  }

  if (source === "default") {
    return <TypeSolidDayFill color="green" dayNum={dayNum} />;
  }

  return <span className="font-semibold text-xs tabular-nums leading-none">{dayNum}</span>;
}

export function YearCalendarDayCell({
  variant = "default",
  ...props
}: YearDayCellPaintedProps & { variant?: YearCalendarCellVariant }) {
  if (variant === "type") {
    return (
      <YearDayCellTypePainted
        dayNum={props.dayNum}
        dayShifts={props.dayShifts}
        policyInfo={props.policyInfo}
      />
    );
  }
  return <YearDayCellPainted {...props} />;
}

/**
 * Mini year-view cell: backgrounds for assigned on-call shifts + time policy slots (org / default variant).
 * Diagonal splits are only used for multi-slot policy-only days; shift days use a solid fill to avoid muddy opacity.
 */
export function YearDayCellPainted({ dayNum, dayShifts, policyInfo, groupsMap }: YearDayCellPaintedProps) {
  const gc = (id: string) => groupsMap.get(id)?.color ?? getTagColorFromString(id);
  const slots = policyInfo?.slots ?? [];

  if (dayShifts.length >= 2) {
    return (
      <span
        className={cn(
          "relative z-[1] font-semibold text-xs flex h-full w-full items-center justify-center rounded-md",
          getColorClasses(gc(dayShifts[0]!.groupId))
        )}
      >
        {dayNum}
      </span>
    );
  }

  if (dayShifts.length === 1 && slots.length > 0) {
    return (
      <span
        className={cn(
          "relative z-[1] font-semibold text-xs flex h-full w-full items-center justify-center rounded-md",
          getColorClasses(gc(dayShifts[0]!.groupId))
        )}
      >
        {dayNum}
      </span>
    );
  }

  if (dayShifts.length === 1) {
    return (
      <span
        className={cn(
          "relative z-[1] font-semibold text-xs flex h-full w-full items-center justify-center rounded-md",
          getColorClasses(gc(dayShifts[0]!.groupId))
        )}
      >
        {dayNum}
      </span>
    );
  }

  if (slots.length >= 2) {
    const p0 = slots[0]!;
    const p1 = slots[1]!;
    return (
      <>
        <div
          className={cn("absolute inset-0 rounded-md", p0.colorClasses)}
          style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
          aria-hidden
        />
        <div
          className={cn("absolute inset-0 rounded-md", p1.colorClasses)}
          style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
          aria-hidden
        />
        <span className="relative z-[1] font-semibold text-xs">{dayNum}</span>
      </>
    );
  }

  if (slots.length === 1) {
    return (
      <span
        className={cn(
          "relative z-[1] font-semibold text-xs flex h-full w-full items-center justify-center rounded-md",
          slots[0].colorClasses
        )}
      >
        {dayNum}
      </span>
    );
  }

  return <span className="font-semibold">{dayNum}</span>;
}
