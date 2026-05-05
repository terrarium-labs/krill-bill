import { TriangleAlert, ChevronsLeft, ChevronsRight } from "lucide-react";
import { parseISO } from "date-fns";
import { getColorClasses, formatTime } from "@/utils/miscelanea";
import { getTagColorFromString } from "@/app/components/tag/utils";
import type { OnCallGroup } from "@/types/field-service/on-call/groups";
import { OnCallShift } from "@/types/field-service/on-call/on-call-shifts";
import OnCallTilePopover from "./on-call-tile-popover";
import type { PopoverTriggerMode } from "./on-call-tile-popover";
import { cn } from "@/lib/utils";

interface OnCallDayTileItemProps {
  groupId: string;
  groupName: string;
  shift: OnCallShift;
  groupsMap: Map<string, OnCallGroup>;
  segmentStart: Date;
  segmentEnd: Date;
  /** Shift continues from previous week - show chevron-left. */
  continuesFromPrevWeek?: boolean;
  /** Shift continues to next week - show chevron-right. */
  continuesToNextWeek?: boolean;
  /** When true, applies hover styling (e.g. when any tile with same shift id is hovered) */
  isHovered?: boolean;
  /** "click" = open on click (default). "hover" = open on hover. */
  triggerMode?: PopoverTriggerMode;
  className?: string;
  /** Called when nested popover/dropdown opens or closes. Used by parent to keep open. */
  onNestedOpenChange?: (open: boolean) => void;
  /** Called when user clicks Edit on the shift popover. */
  onEditShift?: (shift: OnCallShift) => void;
  /** Called when user clicks Delete on the shift popover. */
  onDeleteShift?: (shift: OnCallShift) => void;
  /** Called when employees are added to the shift. */
  onEmployeesAdded?: () => void;
}

const OnCallDayTileItem = ({
  groupId,
  groupName,
  shift,
  groupsMap,
  segmentStart,
  segmentEnd,
  continuesFromPrevWeek,
  continuesToNextWeek,
  isHovered,
  triggerMode,
  className,
  onNestedOpenChange,
  onEditShift,
  onDeleteShift,
  onEmployeesAdded,
}: OnCallDayTileItemProps) => {
  const group = groupsMap.get(groupId);
  const color = group?.color ?? getTagColorFromString(group?.name ?? groupName);
  const colorClasses = getColorClasses(color);

  const hasUnapprovedMember = [
    ...shift.employees,
    ...(shift.exception_employees ?? []),
  ].some((se) => se.status !== "on_call");

  const baseClasses = cn(
    "w-full text-left rounded transition-colors cursor-pointer",
    "border",
    "hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "px-2 py-1 text-xs font-medium truncate flex items-center gap-1 min-w-0",
    isHovered && "brightness-110",
    colorClasses,
    className
  );

  const showChevronLeft = continuesFromPrevWeek === true;
  const showChevronRight = continuesToNextWeek === true;

  const startDate = parseISO(shift.start_date);
  const endDate = parseISO(shift.end_date);
  const timeRangeStr =
    formatTime(startDate, { useUTC: true }) +
    " – " +
    formatTime(endDate, { useUTC: true });

  const trigger = (
    <button type="button" className={baseClasses}>
      {showChevronLeft && (
        <ChevronsLeft className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
      )}
      {hasUnapprovedMember && (
        <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-orange-500" />
      )}
      <span className="flex items-center gap-1 min-w-0">
        <span className="truncate min-w-0">{groupName}</span>
        <span className="text-muted-foreground shrink-0">({timeRangeStr})</span>
      </span>
      {showChevronRight && (
        <ChevronsRight className="h-3 w-3 shrink-0 opacity-70 ml-auto" aria-hidden />
      )}
    </button>
  );

  return (
    <OnCallTilePopover
      trigger={trigger}
      groupName={groupName}
      groupColor={group?.color}
      shift={shift}
      segmentStart={segmentStart}
      segmentEnd={segmentEnd}
      triggerMode={triggerMode}
      onNestedOpenChange={onNestedOpenChange}
      onEditShift={onEditShift}
      onDeleteShift={onDeleteShift}
      onEmployeesAdded={onEmployeesAdded}
    />
  );
};

export default OnCallDayTileItem;