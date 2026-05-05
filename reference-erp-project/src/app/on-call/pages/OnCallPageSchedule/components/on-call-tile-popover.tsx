import { useState, useRef, useCallback, useEffect } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { CircleCheck, CircleX, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import OnCallShiftEmployeesAddModal from "./on-call-shift-employees-add-modal";
import {
  postOrgOnCallShiftEmployees,
  deleteOrgOnCallShiftEmployees,
} from "@/api/field-service/on-call/on-call-shifts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { OnCallShift, OnCallShiftEmployeeStatus } from "@/types/field-service/on-call/on-call-shifts";
import EmployeeLabel from "@/app/components/labels/employee-label";
import Tag from "@/app/components/tag/tag";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { formatDate, formatTime } from "@/utils/miscelanea";
import { parseISO } from "date-fns";
import { cn } from "@/lib/utils";

export type PopoverTriggerMode = "click" | "hover";

interface OnCallTilePopoverProps {
  trigger: React.ReactNode;
  groupName: string;
  /** Group color (e.g. "blue", "green"). When provided, used for the Tag badge. */
  groupColor?: string | null;
  shift: OnCallShift;
  segmentStart: Date;
  segmentEnd: Date;
  /** Called when user approves or cancels an employee (after API success). Used to refresh data. */
  onStatusChange?: (employeeId: string, status: OnCallShiftEmployeeStatus) => void;
  /** Called when user clicks Edit. */
  onEditShift?: (shift: OnCallShift) => void;
  /** Called when user clicks Delete. */
  onDeleteShift?: (shift: OnCallShift) => void;
  /** Called when employees are added to the shift. Used to refresh data. */
  onEmployeesAdded?: () => void;
  /** When provided, popover is controlled (caller must toggle on trigger click). Only used when triggerMode="click". */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** "click" = open on click (default). "hover" = open on hover, like time policy time slots. */
  triggerMode?: PopoverTriggerMode;
  /** Called when this popover or its dropdown opens/closes. Used by parent to keep open when nested is active. */
  onNestedOpenChange?: (open: boolean) => void;
}

const OnCallTilePopover = ({
  trigger,
  groupName,
  groupColor,
  shift,
  segmentStart,
  segmentEnd,
  onStatusChange,
  onEditShift,
  onDeleteShift,
  onEmployeesAdded,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  triggerMode = "click",
  onNestedOpenChange,
}: OnCallTilePopoverProps) => {
  const { t } = useTranslation();
  const { orgId } = useParams<{ orgId: string }>();
  const [internalOpen, setInternalOpen] = useState(false);
  const [addEmployeesModalOpen, setAddEmployeesModalOpen] = useState(false);
  const [statusOverrides, setStatusOverrides] = useState<Map<string, OnCallShiftEmployeeStatus>>(new Map());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownOpenRef = useRef(false);
  dropdownOpenRef.current = dropdownOpen;
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isControlled = triggerMode === "click" && controlledOnOpenChange !== undefined;
  const open = isControlled ? (controlledOpen ?? false) : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const nestedOpen = open || dropdownOpen;
  useEffect(() => {
    onNestedOpenChange?.(nestedOpen);
  }, [nestedOpen, onNestedOpenChange]);

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
      if (!dropdownOpenRef.current) setOpen(false);
    }, 150);
  }, [setOpen, clearLeaveTimer]);

  const handleApprove = useCallback(
    async (employeeId: string) => {
      if (!orgId) return;
      setStatusOverrides((prev) => new Map(prev).set(employeeId, "on_call"));
      try {
        const response = await postOrgOnCallShiftEmployees(orgId, shift.id, {
          employees_ids: [employeeId],
        });
        if (response.error) {
          setStatusOverrides((prev) => {
            const next = new Map(prev);
            next.delete(employeeId);
            return next;
          });
          toast.error(t("on-call.shifts.employees.errorApproving", "Error approving employee"));
        } else {
          toast.success(t("on-call.shifts.employees.employeeApproved", "Employee approved"));
          onStatusChange?.(employeeId, "on_call");
          onEmployeesAdded?.();
        }
      } catch (error) {
        setStatusOverrides((prev) => {
          const next = new Map(prev);
          next.delete(employeeId);
          return next;
        });
        toast.error(t("on-call.shifts.employees.errorApproving", "Error approving employee"));
      }
    },
    [orgId, shift.id, onStatusChange, onEmployeesAdded, t]
  );

  const handleCancel = useCallback(
    async (employeeId: string) => {
      if (!orgId) return;
      setStatusOverrides((prev) => new Map(prev).set(employeeId, "cancelled"));
      try {
        const response = await deleteOrgOnCallShiftEmployees(orgId, shift.id, {
          employees_ids: [employeeId],
        });
        if (response.error) {
          setStatusOverrides((prev) => {
            const next = new Map(prev);
            next.delete(employeeId);
            return next;
          });
          toast.error(t("on-call.shifts.employees.errorCancelling", "Error cancelling employee"));
        } else {
          toast.success(t("on-call.shifts.employees.employeeCancelled", "Employee cancelled"));
          onStatusChange?.(employeeId, "cancelled");
          onEmployeesAdded?.();
        }
      } catch (error) {
        setStatusOverrides((prev) => {
          const next = new Map(prev);
          next.delete(employeeId);
          return next;
        });
        toast.error(t("on-call.shifts.employees.errorCancelling", "Error cancelling employee"));
      }
    },
    [orgId, shift.id, onStatusChange, onEmployeesAdded, t]
  );

  const isSameDay =
    segmentStart.getFullYear() === segmentEnd.getFullYear() &&
    segmentStart.getMonth() === segmentEnd.getMonth() &&
    segmentStart.getDate() === segmentEnd.getDate();

  const dateStr = isSameDay
    ? formatDate(segmentStart, {
        showTime: false,
        showYear: true,
        useUTC: true,
        showDayName: false,
      })
    : `${formatDate(segmentStart, {
        showTime: false,
        showYear: false,
        useUTC: true,
        showDayName: false,
      })} – ${formatDate(segmentEnd, {
        showTime: false,
        showYear: true,
        useUTC: true,
        showDayName: false,
      })}`;

  const startDate = parseISO(shift.start_date);
  const endDate = parseISO(shift.end_date);
  const timeRangeStr =
    formatTime(startDate, { useUTC: true }) +
    " – " +
    formatTime(endDate, { useUTC: true });

  const content = (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">
          <span className="block">
            {dateStr}
            <span className="block font-normal text-muted-foreground text-xs mt-0.5">
              {timeRangeStr}
            </span>
          </span>
        </h4>
      </div>
      <div className="space-y-2">
        <Tag text={groupName} color={groupColor ?? undefined} />
        <ul className="space-y-1.5">
          {shift.employees.map((se) => {
            const employee = se.employee;
            const baseStatus = se.status;
            const status = statusOverrides.get(employee.id) ?? baseStatus;
            const isCancelled = status === "cancelled";
            const isOnCall = status === "on_call";

            return (
              <li
                key={employee.id}
                className={cn(
                  "flex items-center justify-between gap-2 text-sm"
                )}
              >
                <div className={cn(isCancelled && "opacity-60")}>
                  <EmployeeLabel data={[employee]} link />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {isCancelled ? (
                    <CircleX className="h-4 w-4 text-destructive" aria-label={t("common.cancelled", "Cancelled")} />
                  ) : isOnCall ? (
                    <CircleCheck className="h-4 w-4 text-green-600 dark:text-green-500" aria-label={t("common.confirmed", "Confirmed")} />
                  ) : null}
                  {onEmployeesAdded && orgId && (
                    <CustomActionsDropdown
                      size="sm"
                      onOpenChange={setDropdownOpen}
                      items={[
                        {
                          label: t("common.approve", "Approve"),
                          icon: "check",
                          onClick: () => handleApprove(employee.id),
                          showOption: !isOnCall,
                        },
                        {
                          label: t("common.cancel", "Cancel"),
                          icon: "x",
                          onClick: () => handleCancel(employee.id),
                          variant: "destructive",
                          showOption: !isCancelled,
                        },
                      ]}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {shift.exception_employees && shift.exception_employees.length > 0 && (
          <>
            <h5 className="text-xs font-medium text-muted-foreground pt-1">
              {t("on-call.shifts.exceptionEmployees", "Exception employees")}
            </h5>
            <ul className="space-y-1.5">
              {shift.exception_employees.map((se) => {
                const employee = se.employee;
                const baseStatus = se.status;
                const status = statusOverrides.get(employee.id) ?? baseStatus;
                const isCancelled = status === "cancelled";
                const isOnCall = status === "on_call";

                return (
                  <li
                    key={employee.id}
                    className={cn(
                      "flex items-center justify-between gap-2 text-sm"
                    )}
                  >
                    <div className={cn(isCancelled && "opacity-60")}>
                      <EmployeeLabel data={[employee]} link />
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {isCancelled ? (
                        <CircleX className="h-4 w-4 text-destructive" aria-label={t("common.cancelled", "Cancelled")} />
                      ) : isOnCall ? (
                        <CircleCheck className="h-4 w-4 text-green-600 dark:text-green-500" aria-label={t("common.confirmed", "Confirmed")} />
                      ) : null}
                      {onEmployeesAdded && orgId && (
                        <CustomActionsDropdown
                          size="sm"
                          onOpenChange={setDropdownOpen}
                          items={[
                            {
                              label: t("common.approve", "Approve"),
                              icon: "check",
                              onClick: () => handleApprove(employee.id),
                              showOption: !isOnCall,
                            },
                            {
                              label: t("common.cancel", "Cancel"),
                              icon: "x",
                              onClick: () => handleCancel(employee.id),
                              variant: "destructive",
                              showOption: !isCancelled,
                            },
                          ]}
                        />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        {onEmployeesAdded && (
        <button
          type="button"
          onClick={() => {
            if (orgId) setAddEmployeesModalOpen(true);
          }}
          className="w-full text-left text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md px-2 py-1.5 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4 shrink-0" />
          {t("common.addNew", "Add new")}
        </button>
        )}
        {onEmployeesAdded && orgId && (
          <OnCallShiftEmployeesAddModal
            open={addEmployeesModalOpen}
            onOpenChange={setAddEmployeesModalOpen}
            shiftId={shift.id}
            existingEmployeeIds={[
              ...shift.employees.map((se) => se.employee.id),
              ...(shift.exception_employees ?? []).map((se) => se.employee.id),
            ]}
            onEmployeesAdded={onEmployeesAdded}
          />
        )}
        {(onEditShift || onDeleteShift) && (
          <div className="flex gap-2 pt-2 border-t">
            {onEditShift && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setOpen(false);
                  onEditShift(shift);
                }}
              >
                <Edit className="h-3 w-3 mr-1" />
                {t("common.edit", "Edit")}
              </Button>
            )}
            {onDeleteShift && (
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setOpen(false);
                  onDeleteShift(shift);
                }}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                {t("common.delete", "Delete")}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const isInsideDropdownOrTrigger = (el: Element | null) =>
    el?.closest?.("[data-slot='dropdown-menu-content']") ||
    el?.closest?.("[data-slot='dropdown-menu-trigger']") ||
    el?.closest?.("[data-slot='dropdown-menu']") ||
    el?.closest?.("[role='menu']");

  const handleOutside = (e: Event) => {
    const target = e.target as Element | null;
    if (isInsideDropdownOrTrigger(target)) {
      e.preventDefault();
    }
  };

  const handleFocusOutside = (e: Event) => {
    const fe = e as FocusEvent;
    const target = (fe.relatedTarget ?? document.activeElement) as Element | null;
    if (isInsideDropdownOrTrigger(target)) {
      e.preventDefault();
    }
  };

  const contentProps = {
    className: "w-72",
    side: "top" as const,
    align: "center" as const,
    onPointerDownOutside: handleOutside,
    onInteractOutside: handleOutside,
    onFocusOutside: handleFocusOutside,
    ...(triggerMode === "hover" && {
      onMouseEnter: clearLeaveTimer,
      onMouseLeave: scheduleClose,
    }),
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

export default OnCallTilePopover;
