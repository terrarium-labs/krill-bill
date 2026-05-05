import { useState, type ReactNode } from "react";
import { CalendarDayButton } from "@/components/ui/calendar";
import type { OnCallGroup } from "@/types/field-service/on-call/groups";
import type { OnCallShift } from "@/types/field-service/on-call/on-call-shifts";
import OnCallDayTileItemPopover, { OnCallDayTileItemForPopover } from "./on-call-day-tile-item-popover";
import type { PopoverTriggerMode } from "./on-call-tile-popover";
import { cn } from "@/lib/utils";
import type { PolicyDayDisplayInfo } from "@/app/employees/EmployeeDetailPage/pages/EmployeeDetailPageTime/utils/policy-day-display";
import {
  YearCalendarDayCell,
  type YearCalendarCellVariant,
} from "./year-calendar-day-visual";

interface OnCallYearCalendarDayPopoverProps
  extends React.ComponentProps<typeof CalendarDayButton> {
  dayShifts: OnCallDayTileItemForPopover[];
  groupsMap: Map<string, OnCallGroup>;
  /** Time policy work hours for this day (for cell coloring + popover). */
  policyDayDisplayInfo?: PolicyDayDisplayInfo | null;
  /** Time policy work hours (popover section). */
  policySection?: ReactNode;
  /** "click" = open on click (default). "hover" = open on hover. */
  triggerMode?: PopoverTriggerMode;
  onEditShift?: (shift: OnCallShift) => void;
  onDeleteShift?: (shift: OnCallShift) => void;
  onEmployeesAdded?: () => void;
  calendarVariant?: YearCalendarCellVariant;
}

const toYearRows = (dayShifts: OnCallDayTileItemForPopover[]) =>
  dayShifts.map((ds) => ({
    shift: ds.shift,
    groupId: ds.groupId,
    groupName: ds.groupName,
  }));

const OnCallYearCalendarDayPopover = ({
  className,
  day,
  dayShifts,
  groupsMap,
  policyDayDisplayInfo,
  policySection,
  triggerMode = "click",
  onEditShift,
  onDeleteShift,
  onEmployeesAdded,
  calendarVariant = "default",
  ...props
}: OnCallYearCalendarDayPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (dayShifts.length === 0 && !policySection) {
    return <CalendarDayButton className={className} day={day} {...props} />;
  }

  const dayNum = day.date.getDate();
  const yearRows = toYearRows(dayShifts);

  const trigger = (
    <button
      type="button"
      className={cn(
        "min-h-6 min-w-6 max-h-6 max-w-6 p-0 text-xs font-normal flex items-center justify-center hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 relative overflow-hidden rounded-md",
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
      <div className="relative flex size-full min-h-6 min-w-6 items-center justify-center overflow-hidden rounded-md">
        <YearCalendarDayCell
          variant={calendarVariant}
          dayNum={dayNum}
          dayShifts={yearRows}
          policyInfo={policyDayDisplayInfo}
          groupsMap={groupsMap}
        />
      </div>
    </button>
  );

  if (dayShifts.length === 0 && policySection) {
    return (
      <OnCallDayTileItemPopover
        trigger={
          <CalendarDayButton
            className={cn(className, "relative overflow-hidden p-0 min-h-6 min-w-6 max-h-6 max-w-6")}
            day={day}
            {...props}
          >
            <div className="relative flex size-full min-h-6 min-w-6 items-center justify-center overflow-hidden rounded-md">
              <YearCalendarDayCell
                variant={calendarVariant}
                dayNum={dayNum}
                dayShifts={[]}
                policyInfo={policyDayDisplayInfo}
                groupsMap={groupsMap}
              />
            </div>
          </CalendarDayButton>
        }
        day={day.date}
        dayShifts={[]}
        groupsMap={groupsMap}
        policySection={policySection}
        open={triggerMode === "click" ? isOpen : undefined}
        onOpenChange={triggerMode === "click" ? setIsOpen : undefined}
        triggerMode={triggerMode}
      />
    );
  }

  return (
    <OnCallDayTileItemPopover
      trigger={trigger}
      day={day.date}
      dayShifts={dayShifts}
      groupsMap={groupsMap}
      policySection={policySection}
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
