import { useState } from "react";
import { CalendarDayButton } from "@/components/ui/calendar";
import type { OnCallGroup } from "@/types/field-service/on-call/groups";
import type { OnCallShift } from "@/types/field-service/on-call/on-call-shifts";
import OnCallDayTileItemPopover, { OnCallDayTileItemForPopover } from "./on-call-day-tile-item-popover";
import type { PopoverTriggerMode } from "./on-call-tile-popover";
import { getBgColorClasses, getTextColorClasses } from "@/utils/miscelanea";
import { getTagColorFromString } from "@/app/components/tag/utils";
import { cn } from "@/lib/utils";

interface OnCallYearCalendarDayPopoverProps
  extends React.ComponentProps<typeof CalendarDayButton> {
  dayShifts: OnCallDayTileItemForPopover[];
  groupsMap: Map<string, OnCallGroup>;
  /** "click" = open on click (default). "hover" = open on hover. */
  triggerMode?: PopoverTriggerMode;
  onEditShift?: (shift: OnCallShift) => void;
  onDeleteShift?: (shift: OnCallShift) => void;
  onEmployeesAdded?: () => void;
}

const OnCallYearCalendarDayPopover = ({
  className,
  day,
  dayShifts,
  groupsMap,
  triggerMode = "click",
  onEditShift,
  onDeleteShift,
  onEmployeesAdded,
  ...props
}: OnCallYearCalendarDayPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (dayShifts.length === 0) {
    return <CalendarDayButton className={className} day={day} {...props} />;
  }

  const hasDiagonal = dayShifts.length >= 2;
  const color1 = hasDiagonal
    ? groupsMap.get(dayShifts[0]!.groupId)?.color ?? getTagColorFromString(dayShifts[0]!.groupId)
    : null;
  const color2 = hasDiagonal && dayShifts[1]
    ? groupsMap.get(dayShifts[1].groupId)?.color ?? getTagColorFromString(dayShifts[1].groupId)
    : null;

  const dayNum = day.date.getDate();

  const trigger = (
    <button
      type="button"
      className={cn(
        "min-h-6 min-w-6 max-h-6 max-w-6 p-0 text-xs font-normal flex items-center justify-center hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 relative overflow-hidden rounded-md",
        hasDiagonal && "bg-transparent",
        className
      )}
      onClick={
        triggerMode === "click"
          ? (e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen((o) => !o);
            }
          : undefined
      }
    >
      {hasDiagonal && color1 && color2 ? (
        <>
          {/* Background: diagonal split */}
          <div
            className={cn("absolute inset-0 rounded-md", getBgColorClasses(color1))}
            style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
            aria-hidden
          />
          <div
            className={cn("absolute inset-0 rounded-md", getBgColorClasses(color2))}
            style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
            aria-hidden
          />
          {/* Day label: two overlapping tiles, each clipped to one diagonal half */}
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center font-semibold text-xs",
              getTextColorClasses(color1)
            )}
            style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
            aria-hidden
          >
            {dayNum}
          </span>
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center font-semibold text-xs",
              getTextColorClasses(color2)
            )}
            style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
            aria-hidden
          >
            {dayNum}
          </span>
        </>
      ) : (
        <span className="font-semibold">{dayNum}</span>
      )}
    </button>
  );

  return (
    <OnCallDayTileItemPopover
      trigger={trigger}
      day={day.date}
      dayShifts={dayShifts}
      groupsMap={groupsMap}
      open={triggerMode === "click" ? isOpen : undefined}
      onOpenChange={triggerMode === "click" ? setIsOpen : undefined}
      triggerMode={triggerMode}
      onEditShift={onEditShift}
      onDeleteShift={onDeleteShift}
      onEmployeesAdded={onEmployeesAdded}
    />
  );
};

export default OnCallYearCalendarDayPopover;
