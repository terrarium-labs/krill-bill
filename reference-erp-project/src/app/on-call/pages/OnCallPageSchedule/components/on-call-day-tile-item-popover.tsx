import { useState, useRef, useCallback } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDate } from "@/utils/miscelanea";
import type { PopoverTriggerMode } from "./on-call-tile-popover";
import type { OnCallShift } from "@/types/field-service/on-call/on-call-shifts";
import type { OnCallGroup } from "@/types/field-service/on-call/groups";
import OnCallDayTileItem from "./on-call-day-tile-item";

export interface OnCallDayTileItemForPopover {
  groupId: string;
  groupName: string;
  shift: OnCallShift;
  continuesFromPrevWeek?: boolean;
  continuesToNextWeek?: boolean;
}

interface OnCallDayTileItemPopoverProps {
  trigger: React.ReactNode;
  day: Date;
  dayShifts: OnCallDayTileItemForPopover[];
  groupsMap: Map<string, OnCallGroup>;
  /** When provided, popover is controlled (caller must toggle on trigger click). Only used when triggerMode="click". */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** "click" = open on click (default). "hover" = open on hover. */
  triggerMode?: PopoverTriggerMode;
  /** Called when user clicks Edit on a shift. */
  onEditShift?: (shift: OnCallShift) => void;
  /** Called when user clicks Delete on a shift. */
  onDeleteShift?: (shift: OnCallShift) => void;
  /** Called when employees are added to a shift. */
  onEmployeesAdded?: () => void;
}

/** Popover showing all shifts for a day. Reusable with any trigger (e.g. calendar day button or "X more" tile). */
const OnCallDayTileItemPopover = ({
  trigger,
  day,
  dayShifts,
  groupsMap,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  triggerMode = "click",
  onEditShift,
  onDeleteShift,
  onEmployeesAdded,
}: OnCallDayTileItemPopoverProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const nestedOpenCountRef = useRef(0);
  const dropdownOrNestedRef = useRef(false);
  dropdownOrNestedRef.current = nestedOpenCountRef.current > 0;
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isControlled = triggerMode === "click" && controlledOnOpenChange !== undefined;
  const open = isControlled ? (controlledOpen ?? false) : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const clearLeaveTimer = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  const clearOpenTimer = useCallback(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearLeaveTimer();
    leaveTimerRef.current = setTimeout(() => {
      leaveTimerRef.current = null;
      if (!dropdownOrNestedRef.current) setOpen(false);
    }, 150);
  }, [setOpen, clearLeaveTimer]);

  if (dayShifts.length === 0) {
    return <>{trigger}</>;
  }

  const content = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">
          {formatDate(day, {
            showTime: false,
            showYear: true,
            useUTC: true,
            showDayName: true,
          })}
        </h4>
      </div>
        <div className="flex flex-col gap-1">
        {dayShifts.map((ds) => (
          <OnCallDayTileItem
            key={ds.shift.id}
            groupId={ds.groupId}
            groupName={ds.groupName}
            shift={ds.shift}
            groupsMap={groupsMap}
            segmentStart={day}
            segmentEnd={day}
            continuesFromPrevWeek={ds.continuesFromPrevWeek}
            continuesToNextWeek={ds.continuesToNextWeek}
            triggerMode={triggerMode}
            onNestedOpenChange={(isOpen) => {
              nestedOpenCountRef.current += isOpen ? 1 : -1;
              if (nestedOpenCountRef.current < 0) nestedOpenCountRef.current = 0;
              dropdownOrNestedRef.current = nestedOpenCountRef.current > 0;
            }}
            onEditShift={onEditShift}
            onDeleteShift={onDeleteShift}
            onEmployeesAdded={onEmployeesAdded}
          />
        ))}
      </div>
    </div>
  );

  const isInsideDropdownOrTriggerOrNested = (el: Element | null) =>
    el?.closest?.("[data-slot='dropdown-menu-content']") ||
    el?.closest?.("[data-slot='dropdown-menu-trigger']") ||
    el?.closest?.("[data-slot='dropdown-menu']") ||
    el?.closest?.("[role='menu']") ||
    el?.closest?.("[data-slot='popover-content']");

  const handleOutside = (e: Event) => {
    const target = e.target as Element | null;
    if (isInsideDropdownOrTriggerOrNested(target)) {
      e.preventDefault();
    }
  };

  const handleFocusOutside = (e: Event) => {
    const fe = e as FocusEvent;
    const target = (fe.relatedTarget ?? document.activeElement) as Element | null;
    if (isInsideDropdownOrTriggerOrNested(target)) {
      e.preventDefault();
    }
  };

  const contentProps = {
    className: "w-80",
    side: "top" as const,
    align: "center" as const,
    onPointerDownOutside: handleOutside,
    onInteractOutside: handleOutside,
    onFocusOutside: handleFocusOutside,
    onMouseEnter: triggerMode === "hover" ? clearLeaveTimer : undefined,
    onMouseLeave: triggerMode === "hover" ? scheduleClose : undefined,
  };

  const triggerWithHover =
    triggerMode === "hover" ? (
      <div
        onMouseEnter={() => {
          clearLeaveTimer();
          clearOpenTimer();
          openTimerRef.current = setTimeout(() => setOpen(true), 200);
        }}
        onMouseLeave={() => {
          clearOpenTimer();
          scheduleClose();
        }}
      >
        {trigger}
      </div>
    ) : (
      trigger
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{triggerWithHover}</PopoverTrigger>
      <PopoverContent {...contentProps}>
        {content}
      </PopoverContent>
    </Popover>
  );
};

export default OnCallDayTileItemPopover;