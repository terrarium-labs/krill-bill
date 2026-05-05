import { ReactNode, memo, useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { TimeRecord } from "@/types/employees/time-records";
import { TimePolicy, TimeSlot } from "@/types/general/time-policies";
import { Absence } from "@/types/employees/absences";
import { Holiday } from "@/types/general/holidays";
import { SickLeave } from "@/types/employees/sick-leaves";
import { getColorClasses, formatDateForAPI, formatDate, formatTime } from "@/utils/miscelanea";
import TimeRecordPopover from "@/app/time-records/components/time-record-popover";
import { Clock, CalendarClock, ArrowUp, ArrowDown, ChevronDown, ChevronRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import Tag from "@/app/components/tag/tag";
import AbsenceTimelinePopover from "@/app/employees/EmployeeDetailPage/pages/EmployeeDetailPageTime/pages/EmployeeDetailPageTimeActivity/components/absence-timeline-popover";
import SickLeaveTimelinePopover from "@/app/sick-leaves/components/sick-leave-timeline-popover";
import HolidayTimelinePopover from "./holiday-timeline-popover";

// Z-index for stacking (bottom to top): scheduled=0, unavailable=10, rejected=20, pending=30, approved=40
const Z_SCHEDULED = 0;
const Z_UNAVAILABLE = 10;
const Z_REJECTED = 20;
const Z_PENDING = 30;
const Z_APPROVED = 40;

const getStatusZIndex = (status: string | null | undefined): number => {
    const s = status || "pending";
    if (s === "approved") return Z_APPROVED;
    if (s === "rejected") return Z_REJECTED;
    return Z_PENDING;
};

const sortByStatus = <T extends { verification_status?: string | null | undefined }>(items: T[]): T[] =>
    [...items].sort((a, b) => getStatusZIndex(a.verification_status) - getStatusZIndex(b.verification_status));

// Diagonal stripe mask for unfolded day row segments (not schedule) - creates transparent "holes" as stripes
const STRIPE_MASK_STYLE = {
    maskImage: "repeating-linear-gradient(-45deg, transparent, transparent 2px, black 2px, black 4px)",
    WebkitMaskImage: "repeating-linear-gradient(-45deg, transparent, transparent 2px, black 2px, black 4px)",
} as React.CSSProperties;

// Helper function to get border color class based on verification status color
const getBorderColorClass = (color: string): string => {
    const colorMap: Record<string, string> = {
        yellow: 'border-yellow-500',
        green: 'border-green-500',
        red: 'border-red-500',
        blue: 'border-blue-500',
    };
    return colorMap[color] || 'border-yellow-500';
};

// Day row: key is unique (week = 1–7, month = timestamp); dayOfWeek is 1–7 for time policy
export interface TimeRecordsDayRowDay {
    key: number;
    dayOfWeek?: number;
    label: string;
}

// Column keys that can be hidden
export type TimeRecordsDayTableColumnKey =
    | "day"
    | "balance"
    | "worked_time"
    | "start_time"
    | "end_time"
    | "scheduled_time"
    | "timeline"
    | "actions";

export interface TimeRecordsDayTableProps {
    timeRecordsByDay: Array<{
        day: TimeRecordsDayRowDay;
        date: Date;
        timeRecords: any[];
        absences?: Absence[];
        holidays?: Holiday[];
        sickLeaves?: SickLeave[];
    }>;
    timePolicy: TimePolicy | null;
    onViewTimeRecord: (timeRecord: TimeRecord) => void;
    onViewAbsence?: (absence: Absence) => void;
    onViewSickLeave?: (sickLeave: SickLeave) => void;
    /** Custom render function for absence popover actions (collapsed bar). Receives the absence and a callback to close the popover */
    renderAbsencePopoverActions?: (absence: Absence, closePopover: () => void) => ReactNode;
    /** Custom render function for absence detail actions (expanded row). Receives the absence and a callback to close. */
    renderAbsenceDetailActions?: (absence: Absence, closePopover: () => void) => ReactNode;
    /** Custom render function for sick leave popover actions (collapsed bar). Receives the sick leave and a callback to close the popover */
    renderSickLeavePopoverActions?: (sickLeave: SickLeave, closePopover: () => void) => ReactNode;
    /** Custom render function for sick leave detail actions (expanded row). Receives the sick leave and a callback to close. */
    renderSickLeaveDetailActions?: (sickLeave: SickLeave, closePopover: () => void) => ReactNode;
    /** Custom render function for popover actions. Receives the time record and a callback to close the popover */
    renderPopoverActions?: (timeRecord: TimeRecord, closePopover: () => void) => ReactNode;
    /** Custom render function for row actions. Receives the day's data and, for expandable rows, expand state + toggle. If not provided, default actions will be shown */
    renderActions?: (
        dayData: { day: TimeRecordsDayRowDay; date: Date; timeRecords: any[] },
        expandProps?: { isExpanded: boolean; onToggleExpand: () => void }
    ) => ReactNode;
    /** Custom render function for detail row actions. Receives the time record and a callback to close. Same as popoverActions but for detail rows */
    renderDetailActions?: (timeRecord: TimeRecord, closePopover: () => void) => ReactNode;
    /** Callback function when a row is clicked. Receives the day's data. If provided, the row becomes clickable */
    clickableRow?: (dayData: { day: TimeRecordsDayRowDay; date: Date; timeRecords: any[] }) => void;
    /** Columns to hide from the table, accepts array or single string */
    hiddenColumns?: TimeRecordsDayTableColumnKey[] | TimeRecordsDayTableColumnKey;
    getTimeSlotsForDay: (dayOfWeek: number) => TimeSlot[];
    getHolidayTimeSlotsForDay: (dayOfWeek: number) => TimeSlot[];
    getDayTimeRange: (dayOfWeek: number, useHolidaySlots?: boolean) => { startHour: number; endHour: number };
    getTimeSlotSegments: (slots: TimeSlot[], startHour: number, totalMinutes: number) => Array<{
        start: number;
        end: number;
        isEmpty: boolean;
        timeSlot?: TimeSlot;
    }>;
    getAbsenceSegments: (
        dayAbsences: Absence[],
        slots: TimeSlot[],
        startHour: number,
        totalMinutes: number,
        dayDate: Date
    ) => Array<{ start: number; end: number; isEmpty: boolean; absence?: Absence; durationMinutes: number }>;
    getSickLeaveSegments: (
        daySickLeaves: SickLeave[],
        slots: TimeSlot[],
        startHour: number,
        totalMinutes: number,
        dayDate: Date
    ) => Array<{ start: number; end: number; isEmpty: boolean; sickLeave?: SickLeave; durationMinutes: number }>;
    getTimeRecordSegments: (records: any[], startHour: number, totalMinutes: number) => Array<{
        start: number;
        end: number;
        isEmpty: boolean;
        timeRecord?: any;
    }>;
    getWorkableDurationInMinutes: (displayStartTime: string, displayEndTime: string, dayOfWeek: number) => number;
    getExpectedTimeForDay: (
        dayOfWeek: number,
        dayDate: Date,
        dayAbsences: Absence[],
        dayHolidays: Holiday[],
        daySickLeaves?: SickLeave[]
    ) => number;
    formatTimeHoursMinutes: (minutes: number) => string;
    getVerificationColor: (status: "approved" | "rejected" | "pending") => string;
    timeSlotToMinutes: (timeStr: string) => number;
}

const TimeRecordsDayTableComponent = ({
    timeRecordsByDay,
    timePolicy,
    onViewTimeRecord,
    onViewAbsence,
    onViewSickLeave,
    renderAbsencePopoverActions,
    renderAbsenceDetailActions,
    renderSickLeavePopoverActions,
    renderSickLeaveDetailActions,
    renderPopoverActions,
    renderActions,
    renderDetailActions,
    clickableRow,
    hiddenColumns = [],
    getTimeSlotsForDay,
    getHolidayTimeSlotsForDay,
    getDayTimeRange,
    getTimeSlotSegments,
    getAbsenceSegments,
    getSickLeaveSegments,
    getTimeRecordSegments,
    getWorkableDurationInMinutes,
    getExpectedTimeForDay,
    formatTimeHoursMinutes,
    getVerificationColor,
    timeSlotToMinutes,
}: TimeRecordsDayTableProps) => {
    const { t } = useTranslation();

    // State for expanded rows
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    // Reset all rows to folded when the selected week or time records change
    const periodKey = useMemo(
        () => timeRecordsByDay.map(({ day }) => day.key).join(","),
        [timeRecordsByDay]
    );
    useEffect(() => {
        setExpandedRows(new Set());
    }, [periodKey]);

    // When set, the popover for this time record (in an expanded detail row) is open; whole row acts as trigger.
    // Use composite key "dayKey-recordId" so multi-day records appearing on multiple days each have their own popover.
    const [openDetailPopoverId, setOpenDetailPopoverId] = useState<string | null>(null);

    // State for filter type
    const [selectedFilterType, setSelectedFilterType] = useState<"all" | "approved" | "pending" | "rejected" | "scheduled" | "unavailable" | null>(null);

    // Toggle row expansion
    const toggleRowExpansion = (dayKey: number) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(dayKey)) {
                newSet.delete(dayKey);
            } else {
                newSet.add(dayKey);
            }
            return newSet;
        });
    };

    // Normalize hiddenColumns to always be an array
    const hiddenColumnsArray = useMemo(() => {
        if (Array.isArray(hiddenColumns)) {
            return hiddenColumns;
        }
        return [hiddenColumns];
    }, [hiddenColumns]);

    const isColumnVisible = (key: TimeRecordsDayTableColumnKey) =>
        !hiddenColumnsArray.includes(key);

    // Filter records based on selected type
    const filterRecords = (records: any[]): any[] => {
        if (!selectedFilterType || selectedFilterType === "all") {
            return records;
        }
        // For "scheduled", return empty array to show only time policy slots
        if (selectedFilterType === "scheduled") {
            return [];
        }
        // For "unavailable", return empty array to show only absences, sick leaves, holidays
        if (selectedFilterType === "unavailable") {
            return [];
        }
        return records.filter(record => {
            const status = record.verification_status || "pending";
            return status === selectedFilterType;
        });
    };

    // Parse time string to minutes from midnight
    const timeToMinutes = (timeStr: string): number => {
        const date = new Date(timeStr);
        return date.getHours() * 60 + date.getMinutes();
    };

    // True when time is 23:59 (end of day) - treat as full end for rendering to avoid white pixel gap
    const isEndOfDayTime = (timeStr: string): boolean => {
        const date = new Date(timeStr);
        return date.getHours() === 23 && date.getMinutes() === 59;
    };

    return (
        <>
            <div className="space-y-2">
                {timeRecordsByDay.map(({ day, date, timeRecords: records, absences: dayAbsences = [], holidays: dayHolidays = [], sickLeaves: daySickLeaves = [] }) => {
                    // Filter records based on selected type
                    const filteredRecords = filterRecords(records);
                    const showUnavailability = selectedFilterType === "unavailable" || !selectedFilterType || selectedFilterType === "all";

                    const dayOfWeek = day.dayOfWeek ?? day.key;
                    const isHolidayDay = dayHolidays.length > 0;
                    const timeSlots = getTimeSlotsForDay(dayOfWeek);
                    const holidaySlots = getHolidayTimeSlotsForDay(dayOfWeek);
                    const effectiveTimeSlots = isHolidayDay ? holidaySlots : timeSlots;
                    const { startHour, endHour } = getDayTimeRange(dayOfWeek, isHolidayDay);
                    const totalMinutes = (endHour - startHour) * 60;
                    const timeSlotSegments = getTimeSlotSegments(effectiveTimeSlots, startHour, totalMinutes);
                    const absenceSegments = getAbsenceSegments(
                        dayAbsences,
                        effectiveTimeSlots,
                        startHour,
                        totalMinutes,
                        date
                    );
                    const sickLeaveSegments = getSickLeaveSegments(
                        daySickLeaves,
                        effectiveTimeSlots,
                        startHour,
                        totalMinutes,
                        date
                    );
                    const recordSegments = getTimeRecordSegments(filteredRecords, startHour, totalMinutes);
                    const isToday = formatDateForAPI(date) === formatDateForAPI(new Date());

                    // Find invisible records outside the day's time range
                    const invisibleRecords = records.filter(tr => {
                        const displayStart = new Date(tr.displayStartTime);
                        const displayEnd = new Date(tr.displayEndTime);
                        const startMinutes = displayStart.getHours() * 60 + displayStart.getMinutes();
                        const endMinutes = displayEnd.getHours() * 60 + displayEnd.getMinutes();
                        const viewStartMinutes = startHour * 60;
                        const viewEndMinutes = endHour * 60;

                        // Record is completely outside visible range
                        return endMinutes <= viewStartMinutes || startMinutes >= viewEndMinutes;
                    });

                    const invisibleBefore = invisibleRecords.filter(tr => {
                        const displayEnd = new Date(tr.displayEndTime);
                        const endMinutes = displayEnd.getHours() * 60 + displayEnd.getMinutes();
                        return endMinutes <= startHour * 60;
                    });

                    const invisibleAfter = invisibleRecords.filter(tr => {
                        const displayStart = new Date(tr.displayStartTime);
                        const startMinutes = displayStart.getHours() * 60 + displayStart.getMinutes();
                        return startMinutes >= endHour * 60;
                    });

                    // Find absences entirely outside the visible time range (before or after)
                    const viewStartMinutes = startHour * 60;
                    const viewEndMinutes = endHour * 60;
                    const dayStart = new Date(date);
                    dayStart.setHours(0, 0, 0, 0);
                    const dayEnd = new Date(date);
                    dayEnd.setHours(23, 59, 59, 999);
                    const invisibleAbsencesBefore: Absence[] = [];
                    const invisibleAbsencesAfter: Absence[] = [];
                    for (const absence of dayAbsences) {
                        const absStart = new Date(absence.start_date);
                        const absEnd = new Date(absence.end_date);
                        if (absEnd <= dayStart || absStart >= dayEnd) continue;
                        const overlapStart = absStart < dayStart ? dayStart : absStart;
                        const overlapEnd = absEnd > dayEnd ? dayEnd : absEnd;
                        const absStartMinutes = overlapStart.getHours() * 60 + overlapStart.getMinutes();
                        const absEndMinutes = overlapEnd.getHours() * 60 + overlapEnd.getMinutes();
                        if (absEndMinutes <= viewStartMinutes) invisibleAbsencesBefore.push(absence);
                        else if (absStartMinutes >= viewEndMinutes) invisibleAbsencesAfter.push(absence);
                    }

                    const invisibleSickLeavesBefore: SickLeave[] = [];
                    const invisibleSickLeavesAfter: SickLeave[] = [];
                    for (const sl of daySickLeaves) {
                        const slStart = new Date(sl.start_date);
                        const slEnd = new Date(sl.end_date);
                        if (slEnd <= dayStart || slStart >= dayEnd) continue;
                        const overlapStart = slStart < dayStart ? dayStart : slStart;
                        const overlapEnd = slEnd > dayEnd ? dayEnd : slEnd;
                        const slStartMinutes = overlapStart.getHours() * 60 + overlapStart.getMinutes();
                        const slEndMinutes = overlapEnd.getHours() * 60 + overlapEnd.getMinutes();
                        if (slEndMinutes <= viewStartMinutes) invisibleSickLeavesBefore.push(sl);
                        else if (slStartMinutes >= viewEndMinutes) invisibleSickLeavesAfter.push(sl);
                    }

                    // Calculate day totals based on filtered records (workable time: excludes break)
                    const dayWorkedMinutes = filteredRecords.reduce(
                        (sum, record) => {
                            const displayStart = record.displayStartTime ?? record.start_time;
                            const displayEnd = record.displayEndTime ?? record.end_time;
                            return sum + getWorkableDurationInMinutes(displayStart, displayEnd, dayOfWeek);
                        },
                        0
                    );
                    const dayApprovedOrPendingWorkedMinutes = records
                        .filter(record => {
                            const status = record.verification_status || "pending";
                            return status === "approved" || status === "pending";
                        })
                        .reduce(
                            (sum, record) => {
                                const displayStart = record.displayStartTime ?? record.start_time;
                                const displayEnd = record.displayEndTime ?? record.end_time;
                                return sum + getWorkableDurationInMinutes(displayStart, displayEnd, dayOfWeek);
                            },
                            0
                        );
                    const dayEstimatedMinutes = getExpectedTimeForDay(
                        dayOfWeek,
                        date,
                        dayAbsences,
                        dayHolidays,
                        daySickLeaves
                    );
                    const dayBalanceMinutes = dayWorkedMinutes - dayEstimatedMinutes;
                    const hasScheduledSlots = timeSlots.length > 0;
                    const hasHolidaySlotsForDay = isHolidayDay && holidaySlots.length > 0;
                    // Show balance when: (1) holiday with holiday slots, (2) non-holiday with regular slots, or (3) has time records (expected=0h)
                    const shouldShowBalance =
                        timePolicy &&
                        ((isHolidayDay && hasHolidaySlotsForDay) || (!isHolidayDay && hasScheduledSlots) || records.length > 0);
                    const isExpanded = expandedRows.has(day.key);
                    const hasRecords = filteredRecords.length > 0;
                    const hasAbsences = dayAbsences.length > 0;
                    const hasHolidays = dayHolidays.length > 0;
                    const hasSickLeaves = daySickLeaves.length > 0;
                    const hasExpandableContent = hasRecords || (showUnavailability && (hasAbsences || hasHolidays || hasSickLeaves));

                    return (
                        <div key={day.key} className="space-y-2">
                            {/* Main day row */}
                            <div
                                className={cn(
                                    "flex items-center gap-2 group hover:bg-muted/50 py-0.5 rounded-md",
                                    (hasExpandableContent || clickableRow) && "cursor-pointer"
                                )}
                                onClick={() => {
                                    if (hasExpandableContent) {
                                        toggleRowExpansion(day.key);
                                    } else if (clickableRow) {
                                        clickableRow({ day, date, timeRecords: records });
                                    }
                                }}
                            >
                                {/* Day label with date and expand button */}
                                {isColumnVisible("day") && (
                                    <div className="w-40 flex items-center gap-1">
                                        {/* Always reserve space for expand button to maintain alignment */}
                                        <div className="w-6 h-6 flex items-center justify-center">
                                            {hasExpandableContent && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-muted-foreground"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleRowExpansion(day.key);
                                                    }}
                                                >
                                                    {isExpanded ? (
                                                        <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                        <span className={`text-sm font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                                            {formatDate(date, { showDayName: true, showTime: false, showMonth: false, showYear: false })}
                                        </span>
                                    </div>
                                )}

                                {/* Balance column */}
                                {isColumnVisible("balance") && (
                                    <div className="w-40 flex items-center gap-1.5">
                                        {shouldShowBalance ? (
                                            <HoverCard openDelay={300} closeDelay={0}>
                                                <HoverCardTrigger asChild>
                                                    <div className="flex items-center gap-1.5 cursor-help">
                                                        {dayBalanceMinutes === 0 ? (
                                                            <span className="inline-block shrink-0 h-3.5 w-3.5" aria-hidden />
                                                        ) : dayBalanceMinutes > 0 ? (
                                                            <ArrowUp className="h-3.5 w-3.5 text-green-500" />
                                                        ) : (
                                                            <ArrowDown className="h-3.5 w-3.5 text-red-500" />
                                                        )}
                                                        <span className="text-sm text-foreground text-muted-foreground border-b border-dashed border-muted-foreground">
                                                            {formatTimeHoursMinutes(Math.abs(dayApprovedOrPendingWorkedMinutes))} / {formatTimeHoursMinutes(dayEstimatedMinutes)}
                                                        </span>
                                                    </div>
                                                </HoverCardTrigger>
                                                <HoverCardContent className="w-80">
                                                    <div className="space-y-3">
                                                        <h4 className="font-semibold text-sm">
                                                            {formatDate(date, { showDayName: true, showTime: false })}
                                                            {dayHolidays.length > 0 && (
                                                                <span className="ml-2 text-muted-foreground font-normal">
                                                                    ({dayHolidays.map((h) => h.name).join(", ")})
                                                                </span>
                                                            )}
                                                        </h4>
                                                        <div className="space-y-2 text-sm">
                                                            {/* Start/End time range */}
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">{t("employees.timeRecords.scheduled", "Scheduled")}:</span>
                                                                <span className="text-muted-foreground flex items-center gap-1">
                                                                    <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                                                                    {(() => {
                                                                        const startDate = new Date(date);
                                                                        startDate.setHours(startHour, 0, 0, 0);
                                                                        const endDate = new Date(date);
                                                                        endDate.setHours(endHour === 24 ? 23 : endHour, endHour === 24 ? 59 : 0, 0, 0);
                                                                        return `${formatTime(startDate, { useUTC: false })} - ${formatTime(endDate, { useUTC: false })}`;
                                                                    })()}
                                                                </span>
                                                            </div>
                                                            {/* Worked time */}
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">{t("employees.timeRecords.worked", "Worked")}:</span>
                                                                <span className="text-muted-foreground flex items-center gap-1">
                                                                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                                    {formatTimeHoursMinutes(dayWorkedMinutes)}
                                                                </span>
                                                            </div>
                                                            {/* Balance */}
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">{t("employees.timeRecords.balance", "Balance")}:</span>
                                                                <span className={cn("font-medium flex items-center gap-1", dayBalanceMinutes > 0 ? "text-green-500" : dayBalanceMinutes < 0 ? "text-red-500" : "")}>
                                                                    {dayBalanceMinutes === 0 ? (
                                                                        <span className="inline-block shrink-0 h-3.5 w-3.5" aria-hidden />
                                                                    ) : dayBalanceMinutes > 0 ? (
                                                                        <ArrowUp className="h-3.5 w-3.5 text-green-500" />
                                                                    ) : (
                                                                        <ArrowDown className="h-3.5 w-3.5 text-red-500" />
                                                                    )}
                                                                    {formatTimeHoursMinutes(dayBalanceMinutes)}
                                                                </span>
                                                            </div>
                                                            {/* Time policy slots */}
                                                            {effectiveTimeSlots.length > 0 && (
                                                                <div className="space-y-1.5 pt-2 border-t">
                                                                    <div className="text-xs font-semibold text-muted-foreground">
                                                                        {t("employees.timeRecords.shifts", "Shifts")}:
                                                                    </div>
                                                                    {effectiveTimeSlots.map((slot, index) => {
                                                                        const slotStartMinutes = timeSlotToMinutes(slot.start_time);
                                                                        const slotEndMinutes = timeSlotToMinutes(slot.end_time);
                                                                        const slotDuration = slotEndMinutes - slotStartMinutes;
                                                                        const breakMinutes = slot.break_time_duration ?? 0;
                                                                        const workableSlotDuration = Math.max(0, slotDuration - breakMinutes);
                                                                        const slotStartHour = Math.floor(slotStartMinutes / 60);
                                                                        const slotStartMin = slotStartMinutes % 60;
                                                                        const slotEndHour = Math.floor(slotEndMinutes / 60);
                                                                        const slotEndMin = slotEndMinutes % 60;
                                                                        const slotStartDate = new Date(date);
                                                                        slotStartDate.setHours(slotStartHour, slotStartMin, 0, 0);
                                                                        const slotEndDate = new Date(date);
                                                                        slotEndDate.setHours(slotEndHour, slotEndMin, 0, 0);

                                                                        return (
                                                                            <div key={index} className="space-y-1">
                                                                                <div className="font-medium text-foreground flex items-center gap-1.5">
                                                                                    <span>{slot.name}</span>
                                                                                    {slot.description && (
                                                                                        <Tooltip>
                                                                                            <TooltipTrigger asChild>
                                                                                                <button
                                                                                                    className="cursor-help text-muted-foreground hover:text-foreground"
                                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                                >
                                                                                                    <Info className="h-3.5 w-3.5" />
                                                                                                </button>
                                                                                            </TooltipTrigger>
                                                                                            <TooltipContent className="max-w-xs">
                                                                                                <p className="text-sm">{slot.description}</p>
                                                                                            </TooltipContent>
                                                                                        </Tooltip>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-muted-foreground flex items-center gap-1">
                                                                                        <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                                                                                        {formatTime(slotStartDate, { useUTC: false })} - {formatTime(slotEndDate, { useUTC: false })}
                                                                                    </span>
                                                                                    <span className="text-muted-foreground flex items-center gap-1">
                                                                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                                                        {formatTimeHoursMinutes(workableSlotDuration)}
                                                                                    </span>
                                                                                </div>
                                                                                {breakMinutes > 0 && (
                                                                                    <div className="flex justify-between text-xs text-muted-foreground">
                                                                                        <span>{t("timePolicies.timeSlots.breakTime", "Break Time")}:</span>
                                                                                        <span>{formatTimeHoursMinutes(breakMinutes)}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </HoverCardContent>
                                            </HoverCard>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">-</span>
                                        )}
                                    </div>
                                )}

                                {/* Worked time column */}
                                {isColumnVisible("worked_time") && (
                                    <div className="w-32 flex items-center gap-1.5">
                                        {timePolicy && hasScheduledSlots ? (
                                            <>
                                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="text-sm text-foreground">
                                                    {formatTimeHoursMinutes(dayWorkedMinutes)}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">-</span>
                                        )}
                                    </div>
                                )}

                                {/* Start time column - before timeline */}
                                {isColumnVisible("start_time") && (
                                    <div className="w-24 flex items-center justify-end">
                                        {timePolicy && hasScheduledSlots ? (
                                            <span className="text-sm text-muted-foreground">

                                                {(() => {
                                                    const startDate = new Date(date);
                                                    startDate.setHours(startHour, 0, 0, 0);
                                                    return formatTime(startDate, { useUTC: false });
                                                })()}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">-</span>
                                        )}
                                    </div>
                                )}

                                {/* Timeline container with segments - no stopPropagation so row is clickable except on colored slots */}
                                {isColumnVisible("timeline") ? (
                                    <div
                                        className={`flex-1 relative h-8 rounded-md border overflow-hidden`}
                                    >
                                        {/* Invisible records before visible range - sorted by status for stacking */}
                                        {invisibleBefore.length > 0 && (
                                            <div
                                                className="absolute left-0 top-0 bottom-0 flex flex-col justify-center"
                                                style={{ zIndex: Z_REJECTED }}
                                            >
                                                {sortByStatus(invisibleBefore).map((tr, idx) => {
                                                    const colorName = getVerificationColor(tr.verification_status);
                                                    return (
                                                        <div
                                                            key={`invisible-before-${tr.id}-${idx}`}
                                                            className={`w-1 h-full rounded-sm border-l-4 ${getBorderColorClass(colorName)}`}
                                                            style={isExpanded ? STRIPE_MASK_STYLE : undefined}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Invisible records after visible range - sorted by status for stacking */}
                                        {invisibleAfter.length > 0 && (
                                            <div
                                                className="absolute right-0 top-0 bottom-0 flex flex-col justify-center"
                                                style={{ zIndex: Z_REJECTED }}
                                            >
                                                {sortByStatus(invisibleAfter).map((tr, idx) => {
                                                    const colorName = getVerificationColor(tr.verification_status);
                                                    return (
                                                        <div
                                                            key={`invisible-after-${tr.id}-${idx}`}
                                                            className={`w-1 h-full rounded-sm border-r-4 ${getBorderColorClass(colorName)}`}
                                                            style={isExpanded ? STRIPE_MASK_STYLE : undefined}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Invisible absences before visible range - edge tiles (blue) - only when showing unavailability */}
                                        {showUnavailability && invisibleAbsencesBefore.length > 0 && (
                                            <div
                                                className="absolute left-0 top-0 bottom-0 flex flex-col justify-center gap-px"
                                                style={{ zIndex: Z_UNAVAILABLE }}
                                            >
                                                {invisibleAbsencesBefore.map((absence, idx) => (
                                                    <div
                                                        key={`invisible-absence-before-${absence.id}-${idx}`}
                                                        className={`w-1 h-full rounded-sm border-l-4 ${getColorClasses("blue")} ${onViewAbsence ? "cursor-pointer" : ""}`}
                                                        style={isExpanded ? STRIPE_MASK_STYLE : undefined}
                                                        title={absence.absence_type?.name}
                                                        onClick={onViewAbsence ? (e) => { e.stopPropagation(); onViewAbsence(absence); } : undefined}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Invisible absences after visible range - edge tiles (blue) - only when showing unavailability */}
                                        {showUnavailability && invisibleAbsencesAfter.length > 0 && (
                                            <div
                                                className="absolute right-0 top-0 bottom-0 flex flex-col justify-center gap-px"
                                                style={{ zIndex: Z_UNAVAILABLE }}
                                            >
                                                {invisibleAbsencesAfter.map((absence, idx) => (
                                                    <div
                                                        key={`invisible-absence-after-${absence.id}-${idx}`}
                                                        className={`w-1 h-full rounded-sm border-r-4 ${getColorClasses("blue")} ${onViewAbsence ? "cursor-pointer" : ""}`}
                                                        style={isExpanded ? STRIPE_MASK_STYLE : undefined}
                                                        title={absence.absence_type?.name}
                                                        onClick={onViewAbsence ? (e) => { e.stopPropagation(); onViewAbsence(absence); } : undefined}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Invisible sick leaves before visible range - edge tiles (blue) - only when showing unavailability */}
                                        {showUnavailability && onViewSickLeave && invisibleSickLeavesBefore.length > 0 && (
                                            <div
                                                className="absolute left-0 top-0 bottom-0 flex flex-col justify-center gap-px"
                                                style={{ zIndex: Z_UNAVAILABLE }}
                                            >
                                                {invisibleSickLeavesBefore.map((sl, idx) => (
                                                    <div
                                                        key={`invisible-sickleave-before-${sl.id}-${idx}`}
                                                        className={`w-1 h-full rounded-sm border-l-4 ${getColorClasses("blue")} cursor-pointer`}
                                                        style={isExpanded ? STRIPE_MASK_STYLE : undefined}
                                                        title={sl.name || t("sickLeaves.title", "Sick Leave")}
                                                        onClick={(e) => { e.stopPropagation(); onViewSickLeave(sl); }}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Invisible sick leaves after visible range - edge tiles (blue) - only when showing unavailability */}
                                        {showUnavailability && onViewSickLeave && invisibleSickLeavesAfter.length > 0 && (
                                            <div
                                                className="absolute right-0 top-0 bottom-0 flex flex-col justify-center gap-px"
                                                style={{ zIndex: Z_UNAVAILABLE }}
                                            >
                                                {invisibleSickLeavesAfter.map((sl, idx) => (
                                                    <div
                                                        key={`invisible-sickleave-after-${sl.id}-${idx}`}
                                                        className={`w-1 h-full rounded-sm border-r-4 ${getColorClasses("blue")} cursor-pointer`}
                                                        style={isExpanded ? STRIPE_MASK_STYLE : undefined}
                                                        title={sl.name || t("sickLeaves.title", "Sick Leave")}
                                                        onClick={(e) => { e.stopPropagation(); onViewSickLeave(sl); }}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Background layer: Time policy slots (scheduled) */}
                                        <div className="absolute inset-0 flex h-full" style={{ zIndex: Z_SCHEDULED }}>
                                            {timeSlotSegments.length > 0 ? (
                                                timeSlotSegments.map((segment, index) => {
                                                    const width = ((segment.end - segment.start) / totalMinutes) * 100;
                                                    const slotColorClasses = getColorClasses("slate");
                                                    return (
                                                        <div
                                                            key={`slot-${day.key}-${index}`}
                                                            className={`absolute rounded-sm ${slotColorClasses} border opacity-60`}
                                                            style={{
                                                                left: `${(segment.start / totalMinutes) * 100}%`,
                                                                width: `${width}%`,
                                                                height: '100%',
                                                            }}
                                                        />
                                                    );
                                                })
                                            ) : null}
                                        </div>

                                        {/* Holiday full-day bar (blue) - only when showing unavailability. Clickable popover with holiday name(s) */}
                                        {showUnavailability && dayHolidays.length > 0 && (
                                            <div className="absolute inset-0" style={{ zIndex: Z_UNAVAILABLE }}>
                                                <HolidayTimelinePopover
                                                    holidays={dayHolidays}
                                                    dayKey={day.key}
                                                    stripes={isExpanded}
                                                    durationMinutes={24 * 60}
                                                    showDurationOnBar={false}
                                                    showTypeAndTimeOnBar={!isExpanded}
                                                />
                                            </div>
                                        )}
                                        {/* Absence bars layer (blue, clickable) - only when showing unavailability */}
                                        {showUnavailability && absenceSegments.length > 0 && onViewAbsence && (
                                            <div className="absolute inset-0 flex h-full" style={{ zIndex: Z_UNAVAILABLE }}>
                                                {absenceSegments.map((segment, index) => {
                                                    if (segment.isEmpty || !segment.absence) return null;
                                                    const width = ((segment.end - segment.start) / totalMinutes) * 100;
                                                    const leftPercent = (segment.start / totalMinutes) * 100;
                                                    return (
                                                        <AbsenceTimelinePopover
                                                            key={`absence-${day.key}-${segment.absence.id}-${index}`}
                                                            absence={segment.absence}
                                                            width={width}
                                                            leftPercent={leftPercent}
                                                            durationMinutes={segment.durationMinutes}
                                                            onViewAbsence={onViewAbsence}
                                                            renderActions={renderAbsencePopoverActions}
                                                            dayKey={day.key}
                                                            segmentIndex={index}
                                                            colorOverride="blue"
                                                            stripes={isExpanded}
                                                            showDurationOnBar={false}
                                                            showTypeAndTimeOnBar={!isExpanded}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {/* Absence bars when no onViewAbsence (blue, non-interactive) - only when showing unavailability */}
                                        {showUnavailability && absenceSegments.length > 0 && !onViewAbsence && (
                                            <div className="absolute inset-0 flex h-full pointer-events-none" style={{ zIndex: Z_UNAVAILABLE }}>
                                                {absenceSegments.map((segment, index) => {
                                                    if (segment.isEmpty || !segment.absence) return null;
                                                    const width = ((segment.end - segment.start) / totalMinutes) * 100;
                                                    return (
                                                        <div
                                                            key={`absence-${day.key}-${segment.absence.id}-${index}`}
                                                            className={`absolute rounded-sm ${getColorClasses("blue")} border opacity-80`}
                                                            style={{
                                                                left: `${(segment.start / totalMinutes) * 100}%`,
                                                                width: `${width}%`,
                                                                height: '100%',
                                                                ...(isExpanded && STRIPE_MASK_STYLE),
                                                            }}
                                                            title={segment.absence.absence_type?.name}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {/* Sick leave bars (blue) - only when showing unavailability. With onViewSickLeave: clickable popover; otherwise non-interactive */}
                                        {showUnavailability && sickLeaveSegments.length > 0 && onViewSickLeave && (
                                            <div className="absolute inset-0 flex h-full" style={{ zIndex: Z_UNAVAILABLE }}>
                                                {sickLeaveSegments.map((segment, index) => {
                                                    if (segment.isEmpty || !segment.sickLeave) return null;
                                                    const segWidth = ((segment.end - segment.start) / totalMinutes) * 100;
                                                    const leftPercent = (segment.start / totalMinutes) * 100;
                                                    return (
                                                        <SickLeaveTimelinePopover
                                                            key={`sickleave-${day.key}-${segment.sickLeave.id}-${index}`}
                                                            sickLeave={segment.sickLeave}
                                                            width={segWidth}
                                                            leftPercent={leftPercent}
                                                            durationMinutes={segment.durationMinutes}
                                                            onViewSickLeave={onViewSickLeave}
                                                            renderActions={renderSickLeavePopoverActions}
                                                            dayKey={day.key}
                                                            segmentIndex={index}
                                                            stripes={isExpanded}
                                                            showDurationOnBar={false}
                                                            showTypeAndTimeOnBar={!isExpanded}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {showUnavailability && sickLeaveSegments.length > 0 && !onViewSickLeave && (
                                            <div className="absolute inset-0 flex h-full pointer-events-none" style={{ zIndex: Z_UNAVAILABLE }}>
                                                {sickLeaveSegments.map((segment, index) => {
                                                    if (segment.isEmpty || !segment.sickLeave) return null;
                                                    const width = ((segment.end - segment.start) / totalMinutes) * 100;
                                                    return (
                                                        <div
                                                            key={`sickleave-${day.key}-${segment.sickLeave.id}-${index}`}
                                                            className={`absolute rounded-sm ${getColorClasses("blue")} border opacity-80`}
                                                            style={{
                                                                left: `${(segment.start / totalMinutes) * 100}%`,
                                                                width: `${width}%`,
                                                                height: '100%',
                                                                ...(isExpanded && STRIPE_MASK_STYLE),
                                                            }}
                                                            title={segment.sickLeave.name || t("sickLeaves.title", "Sick Leave")}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Foreground layer: Time records - each segment has z-index by status for stacking */}
                                        <div className="relative flex h-full" style={{ zIndex: Z_REJECTED }}>
                                            {recordSegments.length === 0 ? (
                                                <div className="w-full h-full" />
                                            ) : (
                                                recordSegments.map((segment, index) => {
                                                    const width = ((segment.end - segment.start) / totalMinutes) * 100;

                                                    if (segment.isEmpty) {
                                                        return (
                                                            <div
                                                                key={`${day.key}-segment-${index}`}
                                                                className="relative"
                                                                style={{ width: `${width}%` }}
                                                            />
                                                        );
                                                    }

                                                    const tr = segment.timeRecord!;
                                                    const segmentZIndex = getStatusZIndex(tr.verification_status);

                                                    // When expanded, show segments with thick border only on day-boundary corners (like edge indicators)
                                                    if (isExpanded) {
                                                        const colorName = getVerificationColor(tr.verification_status);
                                                        const colorClasses = getColorClasses(colorName);
                                                        const borderClass = tr.isPartialStart || tr.isPartialEnd
                                                            ? cn("border-0", tr.isPartialStart && `border-l-4 ${getBorderColorClass(colorName)}`, tr.isPartialEnd && `border-r-4 ${getBorderColorClass(colorName)}`)
                                                            : "border";
                                                        return (
                                                            <div
                                                                key={`${day.key}-segment-${index}`}
                                                                className={cn("relative rounded-sm cursor-default", colorClasses, borderClass)}
                                                                style={{ width: `${width}%`, zIndex: segmentZIndex, ...STRIPE_MASK_STYLE }}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        );
                                                    }

                                                    return (
                                                        <TimeRecordPopover
                                                            key={`${day.key}-segment-${index}`}
                                                            timeRecord={tr}
                                                            workableDurationMinutes={getWorkableDurationInMinutes(
                                                                tr.displayStartTime ?? tr.start_time,
                                                                tr.displayEndTime ?? tr.end_time,
                                                                dayOfWeek
                                                            )}
                                                            width={width}
                                                            onViewTimeRecord={onViewTimeRecord}
                                                            renderActions={renderPopoverActions}
                                                            dayKey={day.key}
                                                            segmentIndex={index}
                                                            zIndex={segmentZIndex}
                                                            stripes={isExpanded}
                                                            showTypeAndTimeOnBar={!isExpanded}
                                                            showTypeLabelOnBar={false}
                                                        />
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 text-center text-sm text-muted-foreground">-</div>
                                )}

                                {/* End time column - after timeline */}
                                {isColumnVisible("end_time") && (
                                    <div className="w-24 flex items-center">
                                        {timePolicy && hasScheduledSlots ? (
                                            <span className="text-sm text-muted-foreground">
                                                {(() => {
                                                    const endDate = new Date(date);
                                                    endDate.setHours(endHour === 24 ? 23 : endHour, endHour === 24 ? 59 : 0, 0, 0);
                                                    return formatTime(endDate, { useUTC: false });
                                                })()}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">-</span>
                                        )}
                                    </div>
                                )}

                                {/* Actions column */}
                                {isColumnVisible("actions") && renderActions && (
                                    <div
                                        className="flex items-center justify-end"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {renderActions(
                                            { day, date, timeRecords: records },
                                            hasExpandableContent ? { isExpanded, onToggleExpand: () => toggleRowExpansion(day.key) } : undefined
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Expanded: time records and absences as individual rows */}
                            <AnimatePresence initial={false}>
                                {isExpanded && hasExpandableContent && (
                                    <motion.div
                                        key={`expanded-${day.key}`}
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                                        className="overflow-hidden"
                                    >
                                        <div className="space-y-2">
                                    {filteredRecords.map((timeRecord, recordIndex) => {
                                        const displayStart = timeRecord.displayStartTime ?? timeRecord.start_time;
                                        const displayEnd = timeRecord.displayEndTime ?? timeRecord.end_time;
                                        const recordDuration = getWorkableDurationInMinutes(displayStart, displayEnd, dayOfWeek);

                                        // Calculate position for this record in the timeline
                                        const recordStartMinutes = timeToMinutes(timeRecord.displayStartTime || timeRecord.start_time) - (startHour * 60);
                                        let recordEndMinutes = timeToMinutes(timeRecord.displayEndTime || timeRecord.end_time) - (startHour * 60);
                                        if (isEndOfDayTime(timeRecord.displayEndTime || timeRecord.end_time)) recordEndMinutes = totalMinutes;
                                        const clampedStart = Math.max(0, recordStartMinutes);
                                        const clampedEnd = Math.min(totalMinutes, recordEndMinutes);
                                        const recordWidth = Math.max(0, clampedEnd - clampedStart);
                                        const recordLeft = clampedStart;
                                        // Use composite key so multi-day records on different days each have their own popover
                                        const detailPopoverKey = `${day.key}-${timeRecord.id}`;
                                        const isDetailPopoverOpen = openDetailPopoverId === detailPopoverKey;

                                        return (
                                            <div
                                                key={detailPopoverKey}
                                                className="flex items-center gap-2 py-0.5 rounded-md -mx-1 px-1 cursor-pointer hover:bg-muted/50"
                                                onClick={() => setOpenDetailPopoverId(detailPopoverKey)}
                                            >
                                                {/* Type label column - matches day column width */}
                                                {isColumnVisible("day") && (
                                                    <div className="w-40 flex items-center gap-1">
                                                        {/* Reserve same space as expand icon for alignment */}
                                                        <div className="w-6 h-6 flex items-center justify-center" />
                                                        <div className="flex items-center gap-2 pl-4">
                                                            <Tag text={timeRecord.verification_status} />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Total Time column - matches balance column */}
                                                {isColumnVisible("balance") && (
                                                    <div className="w-66 pl-4 flex items-center gap-1.5">
                                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span className="text-sm text-muted-foreground">
                                                            {formatTimeHoursMinutes(recordDuration)}
                                                        </span>
                                                    </div>
                                                )}


                                {/* Timeline bar for individual record - popover controlled so row click opens it */}
                                {isColumnVisible("timeline") ? (
                                    <div className="flex-1 relative h-8 rounded-md border overflow-hidden">
                                        {/* Check if record is completely outside visible range */}
                                        {(() => {
                                            const isCompletelyBefore = recordEndMinutes <= 0;
                                            const isCompletelyAfter = recordStartMinutes >= totalMinutes;
                                            
                                            // If completely outside, show indicator at appropriate edge
                                            if (isCompletelyBefore || isCompletelyAfter) {
                                                const colorName = getVerificationColor(timeRecord.verification_status);
                                                return (
                                                    <div
                                                        className={`absolute h-full z-10 ${isCompletelyBefore ? 'left-0' : 'right-0'}`}
                                                        style={{ width: '4px' }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <TimeRecordPopover
                                                            timeRecord={{
                                                                ...timeRecord,
                                                                displayStartTime: timeRecord.displayStartTime || timeRecord.start_time,
                                                                displayEndTime: timeRecord.displayEndTime || timeRecord.end_time,
                                                                showDuration: true,
                                                            }}
                                                            workableDurationMinutes={recordDuration}
                                                            width={100}
                                                            onViewTimeRecord={onViewTimeRecord}
                                                            renderActions={renderPopoverActions}
                                                            dayKey={day.key}
                                                            segmentIndex={recordIndex}
                                                            className={`h-full border-0 ${isCompletelyBefore ? 'border-l-4' : 'border-r-4'} ${getBorderColorClass(colorName)}`}
                                                            open={isDetailPopoverOpen}
                                                            onOpenChange={(open) => setOpenDetailPopoverId(open ? detailPopoverKey : null)}
                                                        />
                                                    </div>
                                                );
                                            }
                                            
                                            // Normal case: record is at least partially visible
                                            if (recordWidth > 0) {
                                                return (
                                                    <div
                                                        className="absolute h-full z-10"
                                                        style={{
                                                            left: `${(recordLeft / totalMinutes) * 100}%`,
                                                            width: `${(recordWidth / totalMinutes) * 100}%`,
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <TimeRecordPopover
                                                            timeRecord={{
                                                                ...timeRecord,
                                                                displayStartTime: timeRecord.displayStartTime || timeRecord.start_time,
                                                                displayEndTime: timeRecord.displayEndTime || timeRecord.end_time,
                                                                showDuration: true,
                                                            }}
                                                            workableDurationMinutes={recordDuration}
                                                            width={100}
                                                            onViewTimeRecord={onViewTimeRecord}
                                                            renderActions={renderPopoverActions}
                                                            dayKey={day.key}
                                                            segmentIndex={recordIndex}
                                                            className="h-full"
                                                            open={isDetailPopoverOpen}
                                                            onOpenChange={(open) => setOpenDetailPopoverId(open ? detailPopoverKey : null)}
                                                            showTypeAndTimeOnBar
                                                            showTypeLabelOnBar={false}
                                                        />
                                                    </div>
                                                );
                                            }
                                            
                                            return <div className="w-full h-full" />;
                                        })()}
                                    </div>
                                ) : (
                                    isColumnVisible("timeline") && <div className="flex-1" />
                                )}                                                {/* Detail actions column - stop propagation so row click doesn't open popover */}
                                                {isColumnVisible("actions") && (
                                                    <div
                                                        className="flex items-center justify-end w-32 relative z-10"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {renderDetailActions ? (
                                                            renderDetailActions(timeRecord, () => { })
                                                        ) : null}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {/* Absence rows when expanded - only when showing unavailability */}
                                    {showUnavailability && dayAbsences.map((absence) => {
                                        const absSegments = getAbsenceSegments(
                                            [absence],
                                            timeSlots,
                                            startHour,
                                            totalMinutes,
                                            date
                                        );
                                        const firstSeg = absSegments[0];
                                        const colorClasses = getColorClasses("blue");
                                        const absenceDurationMinutes = absSegments.reduce(
                                            (sum, seg) => sum + seg.durationMinutes,
                                            0
                                        );
                                        const segStart = firstSeg ? firstSeg.start : 0;
                                        const segEnd = firstSeg ? firstSeg.end : totalMinutes;
                                        const segWidth = firstSeg ? ((segEnd - segStart) / totalMinutes) * 100 : 0;
                                        const segLeft = firstSeg ? (segStart / totalMinutes) * 100 : 0;

                                        // Check if absence is entirely outside visible range (for edge indicator)
                                        const absViewStartMinutes = startHour * 60;
                                        const absViewEndMinutes = endHour * 60;
                                        const absStart = new Date(absence.start_date);
                                        const absEnd = new Date(absence.end_date);
                                        const dayStart = new Date(date);
                                        dayStart.setHours(0, 0, 0, 0);
                                        const dayEnd = new Date(date);
                                        dayEnd.setHours(23, 59, 59, 999);
                                        let isAbsenceBeforeView = false;
                                        let isAbsenceAfterView = false;
                                        if (absEnd > dayStart && absStart < dayEnd) {
                                            const overlapStart = absStart < dayStart ? dayStart : absStart;
                                            const overlapEnd = absEnd > dayEnd ? dayEnd : absEnd;
                                            const absStartMin = overlapStart.getHours() * 60 + overlapStart.getMinutes();
                                            const absEndMin = overlapEnd.getHours() * 60 + overlapEnd.getMinutes();
                                            if (absEndMin <= absViewStartMinutes) isAbsenceBeforeView = true;
                                            else if (absStartMin >= absViewEndMinutes) isAbsenceAfterView = true;
                                        }
                                        const absDayOverlapMinutes = Math.max(
                                            0,
                                            (Math.min(absEnd.getTime(), dayEnd.getTime()) - Math.max(absStart.getTime(), dayStart.getTime())) / 60000
                                        );

                                        return (
                                            <div
                                                key={`absence-row-${day.key}-${absence.id}`}
                                                className={cn(
                                                    "flex items-center gap-2 py-0.5 rounded-md -mx-1 px-1",
                                                    onViewAbsence && "cursor-pointer hover:bg-muted/50"
                                                )}
                                                onClick={onViewAbsence ? () => onViewAbsence(absence) : undefined}
                                            >
                                                {isColumnVisible("day") && (
                                                    <div className="w-40 flex items-center gap-1">
                                                        <div className="w-6 h-6 flex items-center justify-center" />
                                                        <div className="flex items-center gap-2 pl-4">
                                                            <Tag
                                                                text={t("absences.absence", "Absence")}
                                                                color="blue"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                                {isColumnVisible("balance") && (
                                                    <div className="w-66 pl-4 flex items-center gap-1.5">
                                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span className="text-sm text-muted-foreground">
                                                            {formatTimeHoursMinutes(
                                                                absenceDurationMinutes > 0 ? absenceDurationMinutes : absDayOverlapMinutes
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                                {isColumnVisible("timeline") && (
                                                    <div className="flex-1 relative h-8 rounded-md border overflow-hidden">
                                                        {firstSeg && segWidth > 0 ? (
                                                            onViewAbsence ? (
                                                                <AbsenceTimelinePopover
                                                                    absence={absence}
                                                                    width={segWidth}
                                                                    leftPercent={segLeft}
                                                                    durationMinutes={absenceDurationMinutes > 0 ? absenceDurationMinutes : absDayOverlapMinutes}
                                                                    onViewAbsence={onViewAbsence}
                                                                    renderActions={renderAbsencePopoverActions}
                                                                    dayKey={day.key}
                                                                    segmentIndex={0}
                                                                    colorOverride="blue"
                                                                    showTypeAndTimeOnBar
                                                                />
                                                            ) : (
                                                                <div
                                                                    className={cn(
                                                                        "absolute h-full z-10 rounded-sm",
                                                                        colorClasses
                                                                    )}
                                                                    style={{
                                                                        left: `${segLeft}%`,
                                                                        width: `${segWidth}%`,
                                                                    }}
                                                                    title={absence.absence_type?.name}
                                                                />
                                                            )
                                                        ) : (isAbsenceBeforeView || isAbsenceAfterView) && onViewAbsence ? (
                                                            <AbsenceTimelinePopover
                                                                absence={absence}
                                                                width={2}
                                                                leftPercent={isAbsenceBeforeView ? 0 : 98}
                                                                durationMinutes={absDayOverlapMinutes}
                                                                onViewAbsence={onViewAbsence}
                                                                renderActions={renderAbsencePopoverActions}
                                                                dayKey={day.key}
                                                                segmentIndex={-1}
                                                                colorOverride="blue"
                                                                showDurationOnBar
                                                            />
                                                        ) : (isAbsenceBeforeView || isAbsenceAfterView) ? (
                                                            <div
                                                                className={cn(
                                                                    "absolute h-full z-10 w-1 rounded-sm",
                                                                    isAbsenceBeforeView ? "left-0 border-l-4" : "right-0 border-r-4",
                                                                    colorClasses
                                                                )}
                                                                title={absence.absence_type?.name}
                                                            />
                                                        ) : null}
                                                    </div>
                                                )}
                                                {isColumnVisible("actions") && (
                                                    <div
                                                        className="w-32 flex justify-end"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {renderAbsenceDetailActions
                                                            ? renderAbsenceDetailActions(absence, () => {})
                                                            : null}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {/* Holiday rows when expanded - only when showing unavailability */}
                                    {showUnavailability && dayHolidays.map((holiday) => (
                                        <div
                                            key={`holiday-row-${day.key}-${holiday.id}`}
                                            className="flex items-center gap-2 py-0.5 rounded-md -mx-1 px-1 cursor-pointer hover:bg-muted/50"
                                        >
                                            {isColumnVisible("day") && (
                                                <div className="w-40 flex items-center gap-1">
                                                    <div className="w-6 h-6 flex items-center justify-center" />
                                                    <div className="flex items-center gap-2 pl-4">
                                                        <Tag
                                                            text={t("employees.timeRecords.holiday", "Holiday")}
                                                            color="blue"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            {isColumnVisible("balance") && (
                                                <div className="w-66 pl-4 flex items-center gap-1.5">
                                                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                    <span className="text-sm text-muted-foreground">
                                                        {formatTimeHoursMinutes(0)}
                                                    </span>
                                                </div>
                                            )}
                                            {isColumnVisible("timeline") && (
                                                <div className="flex-1 relative h-8 rounded-md border overflow-hidden">
                                                    <HolidayTimelinePopover
                                                        holidays={[holiday]}
                                                        dayKey={day.key}
                                                        keySuffix={`-${holiday.id}`}
                                                        durationMinutes={24 * 60}
                                                        showTypeAndTimeOnBar
                                                    />
                                                </div>
                                            )}
                                            {isColumnVisible("actions") && <div className="w-32" />}
                                        </div>
                                    ))}
                                    {/* Sick leave rows when expanded - only when showing unavailability */}
                                    {showUnavailability && daySickLeaves.map((sickLeave) => {
                                        const slSegments = getSickLeaveSegments(
                                            [sickLeave],
                                            timeSlots,
                                            startHour,
                                            totalMinutes,
                                            date
                                        );
                                        const firstSeg = slSegments[0];
                                        const colorClasses = getColorClasses("blue");
                                        const slDurationMinutes = slSegments.reduce(
                                            (sum, seg) => sum + seg.durationMinutes,
                                            0
                                        );
                                        const segStart = firstSeg ? firstSeg.start : 0;
                                        const segEnd = firstSeg ? firstSeg.end : totalMinutes;
                                        const segWidth = firstSeg ? ((segEnd - segStart) / totalMinutes) * 100 : 0;
                                        const segLeft = firstSeg ? (segStart / totalMinutes) * 100 : 0;

                                        const slStart = new Date(sickLeave.start_date);
                                        const slEnd = new Date(sickLeave.end_date);
                                        const dayStart = new Date(date);
                                        dayStart.setHours(0, 0, 0, 0);
                                        const dayEnd = new Date(date);
                                        dayEnd.setHours(23, 59, 59, 999);
                                        let isSlBeforeView = false;
                                        let isSlAfterView = false;
                                        if (slEnd > dayStart && slStart < dayEnd) {
                                            const overlapStart = slStart < dayStart ? dayStart : slStart;
                                            const overlapEnd = slEnd > dayEnd ? dayEnd : slEnd;
                                            const slStartMin = overlapStart.getHours() * 60 + overlapStart.getMinutes();
                                            const slEndMin = overlapEnd.getHours() * 60 + overlapEnd.getMinutes();
                                            const viewStartMin = startHour * 60;
                                            const viewEndMin = endHour * 60;
                                            if (slEndMin <= viewStartMin) isSlBeforeView = true;
                                            else if (slStartMin >= viewEndMin) isSlAfterView = true;
                                        }
                                        const slDayOverlapMinutes = Math.max(
                                            0,
                                            (Math.min(slEnd.getTime(), dayEnd.getTime()) - Math.max(slStart.getTime(), dayStart.getTime())) / 60000
                                        );

                                        return (
                                            <div
                                                key={`sickleave-row-${day.key}-${sickLeave.id}`}
                                                className={cn(
                                                    "flex items-center gap-2 py-0.5 rounded-md -mx-1 px-1",
                                                    onViewSickLeave && "cursor-pointer hover:bg-muted/50"
                                                )}
                                                onClick={onViewSickLeave ? () => onViewSickLeave(sickLeave) : undefined}
                                            >
                                                {isColumnVisible("day") && (
                                                    <div className="w-40 flex items-center gap-1">
                                                        <div className="w-6 h-6 flex items-center justify-center" />
                                                        <div className="flex items-center gap-2 pl-4">
                                                            <Tag
                                                                text={t("sickLeaves.title", "Sick Leave")}
                                                                color="blue"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                                {isColumnVisible("balance") && (
                                                    <div className="w-66 pl-4 flex items-center gap-1.5">
                                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span className="text-sm text-muted-foreground">
                                                            {formatTimeHoursMinutes(slDurationMinutes > 0 ? slDurationMinutes : slDayOverlapMinutes)}
                                                        </span>
                                                    </div>
                                                )}
                                                {isColumnVisible("timeline") && (
                                                    <div className="flex-1 relative h-8 rounded-md border overflow-hidden">
                                                        {onViewSickLeave ? (
                                                            firstSeg && segWidth > 0 ? (
                                                                <SickLeaveTimelinePopover
                                                                    sickLeave={sickLeave}
                                                                    width={segWidth}
                                                                    leftPercent={segLeft}
                                                                    durationMinutes={slDurationMinutes > 0 ? slDurationMinutes : slDayOverlapMinutes}
                                                                    onViewSickLeave={onViewSickLeave}
                                                                    renderActions={renderSickLeavePopoverActions}
                                                                    dayKey={day.key}
                                                                    segmentIndex={0}
                                                                    showTypeAndTimeOnBar
                                                                />
                                                            ) : (isSlBeforeView || isSlAfterView) ? (
                                                                <SickLeaveTimelinePopover
                                                                    sickLeave={sickLeave}
                                                                    width={2}
                                                                    leftPercent={isSlBeforeView ? 0 : 98}
                                                                    durationMinutes={slDayOverlapMinutes}
                                                                    onViewSickLeave={onViewSickLeave}
                                                                    renderActions={renderSickLeavePopoverActions}
                                                                    dayKey={day.key}
                                                                    segmentIndex={0}
                                                                    showDurationOnBar
                                                                />
                                                            ) : (
                                                                <div
                                                                    className={cn("absolute inset-0 rounded-sm", colorClasses)}
                                                                    title={sickLeave.name || t("sickLeaves.title", "Sick Leave")}
                                                                />
                                                            )
                                                        ) : firstSeg && segWidth > 0 ? (
                                                            <div
                                                                className={cn("absolute h-full z-10 rounded-sm", colorClasses)}
                                                                style={{ left: `${segLeft}%`, width: `${segWidth}%` }}
                                                                title={sickLeave.name || t("sickLeaves.title", "Sick Leave")}
                                                            />
                                                        ) : (isSlBeforeView || isSlAfterView) ? (
                                                            <div
                                                                className={cn(
                                                                    "absolute h-full z-10 w-1 rounded-sm",
                                                                    isSlBeforeView ? "left-0 border-l-4" : "right-0 border-r-4",
                                                                    colorClasses
                                                                )}
                                                                title={sickLeave.name || t("sickLeaves.title", "Sick Leave")}
                                                            />
                                                        ) : null}
                                                    </div>
                                                )}
                                                {isColumnVisible("actions") && (
                                                    <div
                                                        className="w-32 flex justify-end"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {renderSickLeaveDetailActions
                                                            ? renderSickLeaveDetailActions(sickLeave, () => {})
                                                            : null}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {/* Filterable Legend - Horizontal Layout */}
            <div className="mt-6 pt-4 border-t">
                <div className="flex flex-wrap gap-3">
                    {/* All Types */}
                    <button
                        onClick={() => setSelectedFilterType(selectedFilterType === "all" ? null : "all")}
                        className={cn(
                            "px-4 py-2 rounded-md border transition-colors flex items-center gap-2",
                            (!selectedFilterType || selectedFilterType === "all") && "bg-accent/50 ring-1 ring-border"
                        )}
                    >
                        <span className="text-sm font-semibold">
                            {t("employees.timeRecords.allTypes", "All Types")}
                        </span>
                    </button>

                    {/* Unavailable (Absences, Sick Leaves, Holidays) */}
                    <button
                        onClick={() => setSelectedFilterType(selectedFilterType === "unavailable" ? null : "unavailable")}
                        className={cn(
                            "px-4 py-2 rounded-md border transition-colors flex items-center gap-2",
                            selectedFilterType === "unavailable" && "bg-accent/50 ring-1 ring-border"
                        )}
                    >
                        <div className={`w-4 h-4 rounded border ${getColorClasses("blue")}`} />
                        <span className="text-sm font-medium">
                            {t("employees.timeRecords.unavailable", "Unavailable")}
                        </span>
                    </button>

                    {/* Scheduled */}
                    <button
                        onClick={() => setSelectedFilterType(selectedFilterType === "scheduled" ? null : "scheduled")}
                        className={cn(
                            "px-4 py-2 rounded-md border transition-colors flex items-center gap-2",
                            selectedFilterType === "scheduled" && "bg-accent/50 ring-1 ring-border"
                        )}
                    >
                        <div className={`w-4 h-4 rounded border ${getColorClasses("slate")}`} />
                        <span className="text-sm font-medium">
                            {t("employees.timeRecords.status.scheduled", "Scheduled")}
                        </span>
                    </button>

                    {/* Pending */}
                    <button
                        onClick={() => setSelectedFilterType(selectedFilterType === "pending" ? null : "pending")}
                        className={cn(
                            "px-4 py-2 rounded-md border transition-colors flex items-center gap-2",
                            selectedFilterType === "pending" && "bg-accent/50 ring-1 ring-border"
                        )}
                    >
                        <div className={`w-4 h-4 rounded border ${getColorClasses("yellow")}`} />
                        <span className="text-sm font-medium">
                            {t("employees.timeRecords.status.pending", "Pending")}
                        </span>
                    </button>

                    {/* Approved */}
                    <button
                        onClick={() => setSelectedFilterType(selectedFilterType === "approved" ? null : "approved")}
                        className={cn(
                            "px-4 py-2 rounded-md border transition-colors flex items-center gap-2",
                            selectedFilterType === "approved" && "bg-accent/50 ring-1 ring-border"
                        )}
                    >
                        <div className={`w-4 h-4 rounded border ${getColorClasses("green")}`} />
                        <span className="text-sm font-medium">
                            {t("employees.timeRecords.status.approved", "Approved")}
                        </span>
                    </button>

                    {/* Rejected */}
                    <button
                        onClick={() => setSelectedFilterType(selectedFilterType === "rejected" ? null : "rejected")}
                        className={cn(
                            "px-4 py-2 rounded-md border transition-colors flex items-center gap-2",
                            selectedFilterType === "rejected" && "bg-accent/50 ring-1 ring-border"
                        )}
                    >
                        <div className={`w-4 h-4 rounded border ${getColorClasses("red")}`} />
                        <span className="text-sm font-medium">
                            {t("employees.timeRecords.status.rejected", "Rejected")}
                        </span>
                    </button>
                </div>
            </div>
        </>
    );
};

export const TimeRecordsDayTable = memo(TimeRecordsDayTableComponent);

export default TimeRecordsDayTable;
