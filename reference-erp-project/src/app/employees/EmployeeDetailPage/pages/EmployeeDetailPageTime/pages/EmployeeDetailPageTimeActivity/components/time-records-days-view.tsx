import { useState, useEffect, ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { TimeRecord } from "@/types/employees/time-records";
import { formatDateForAPI, formatDate, getFirstDayOfMonth, getLastDayOfMonth } from "@/utils/miscelanea";
import { useParams } from "react-router";
import { getEmployeeTimeRecords } from "@/api/employees/time-records/time-records";
import { TimePolicy, TimeSlot, flattenDefaultTimeSlots } from "@/types/general/time-policies";
import { Absence } from "@/types/employees/absences";
import { Holiday } from "@/types/general/holidays";
import { SickLeave } from "@/types/employees/sick-leaves";
import { toast } from "sonner";
import PageHeader from "@/app/components/page-header";
import TimeRecordsSummaryCard from "@/app/time-records/components/time-records-summary-card";
import TimeRecordsDaysTable from "./time-records-days-table";

interface TimeRecordsDaysViewProps {
    employeeId: string;
    /** Time policy from context (EmployeeContext or DashboardEmployeeContext). */
    timePolicy: TimePolicy | null;
    /** Holidays from context (filtered to period by parent). */
    holidays?: Holiday[];
    /** Sick leaves from context (filtered to period by parent). */
    sickLeaves?: SickLeave[];
    /** Absences from context (filtered to period when building timeRecordsByDay). */
    absences?: Absence[];
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
    /** Custom render function for row actions. Receives the day data and, for expandable rows, expand state + toggle. */
    renderActions?: (
        dayData: { day: any; date: Date; timeRecords: any[] },
        expandProps?: { isExpanded: boolean; onToggleExpand: () => void }
    ) => ReactNode;
    renderPopoverActions?: (timeRecord: TimeRecord, closePopover: () => void) => ReactNode;
    /** Custom render function for detail actions. Receives the time record and a callback to close the popover */
    renderDetailActions?: (timeRecord: TimeRecord, closePopover: () => void) => ReactNode;
    refreshTrigger?: number; // Used to trigger a refresh of the data
    /** Full PageHeader action element (period nav, 24h toggle, week/month tabs, buttons) - same for both tabs when alternating */
    headerAction: ReactNode;
    /** Controlled period (from parent) so both tabs share the same values */
    currentWeekMonday: Date;
    currentMonthStart: Date;
    showMonthView: boolean;
    use24HourView: boolean;
}

// Day of week 1–7 (Monday = 1, Sunday = 7), matching time policy day_of_week
const getDayOfWeek = (date: Date): number => {
    const d = date.getDay();
    return d === 0 ? 7 : d;
};

// Helper function to get next Monday
const getNextMonday = (monday: Date): Date => {
    const nextMonday = new Date(monday);
    nextMonday.setDate(nextMonday.getDate() + 7);
    return nextMonday;
};


const TimeRecordsDaysView: React.FC<TimeRecordsDaysViewProps> = ({
    employeeId,
    timePolicy,
    holidays: holidaysProp = [],
    sickLeaves: sickLeavesProp = [],
    absences: absencesProp = [],
    onViewTimeRecord,
    onViewAbsence,
    onViewSickLeave,
    renderAbsencePopoverActions,
    renderAbsenceDetailActions,
    renderSickLeavePopoverActions,
    renderSickLeaveDetailActions,
    renderActions,
    renderDetailActions,
    renderPopoverActions,
    refreshTrigger,
    headerAction,
    currentWeekMonday,
    currentMonthStart,
    showMonthView,
    use24HourView,
}) => {
    const { t, i18n } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);

    // Dates to show: 7 days in week view, or all days of month in month view
    const datesToShow = useMemo(() => {
        if (showMonthView) {
            const first = getFirstDayOfMonth(currentMonthStart);
            const last = getLastDayOfMonth(currentMonthStart);
            const dates: Date[] = [];
            const d = new Date(first);
            while (d <= last) {
                dates.push(new Date(d));
                d.setDate(d.getDate() + 1);
            }
            return dates;
        }
        const monday = new Date(currentWeekMonday);
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d;
        });
    }, [showMonthView, currentWeekMonday, currentMonthStart]);

    /** Default weekly schedule only (`TimePolicyType` default), flattened from `time_slot_ranges`. */
    const defaultScheduleSlots = useMemo(
        () => (timePolicy ? flattenDefaultTimeSlots(timePolicy.time_slot_ranges) : []),
        [timePolicy]
    );

    // Fetch time records for the current period (week or month)
    const fetchPeriodTimeRecords = async () => {
        if (!orgId || !employeeId) return;

        let fromDay: string;
        let toDay: string;
        if (showMonthView) {
            const first = getFirstDayOfMonth(currentMonthStart);
            const last = getLastDayOfMonth(currentMonthStart);
            fromDay = formatDateForAPI(first);
            toDay = formatDateForAPI(last);
        } else {
            fromDay = formatDateForAPI(currentWeekMonday);
            toDay = formatDateForAPI(getNextMonday(currentWeekMonday));
        }

        try {
            const response = await getEmployeeTimeRecords(orgId, employeeId, fromDay, toDay, "", undefined, undefined);
            if (response.success && response.success.time_records) {
                setTimeRecords(response.success.time_records);
            } else {
                toast.error(t("employees.timeRecords.errorFetchingTimeRecords") || "Error fetching time records");
            }
        } catch (error) {
            toast.error(t("employees.timeRecords.errorFetchingTimeRecords") || "Error fetching time records");
        }
    };

    // Load time records when period (week/month) or refresh is triggered
    useEffect(() => {
        fetchPeriodTimeRecords();
    }, [showMonthView, currentWeekMonday, currentMonthStart, orgId, employeeId, refreshTrigger]);

    // Period range for filtering holidays/sick leaves from context
    const periodFromTo = useMemo(() => {
        if (showMonthView) {
            const first = getFirstDayOfMonth(currentMonthStart);
            const last = getLastDayOfMonth(currentMonthStart);
            return { fromDay: formatDateForAPI(first), toDay: formatDateForAPI(last) };
        }
        return {
            fromDay: formatDateForAPI(currentWeekMonday),
            toDay: formatDateForAPI(getNextMonday(currentWeekMonday)),
        };
    }, [showMonthView, currentWeekMonday, currentMonthStart]);

    // Filter holidays and sick leaves from context to the displayed period
    const holidaysInPeriod = useMemo(() => {
        const fromDate = new Date(periodFromTo.fromDay);
        const toDate = new Date(periodFromTo.toDay);
        return holidaysProp.filter((h) => {
            const d = new Date(h.holiday_date + "T12:00:00Z");
            return d >= fromDate && d <= toDate;
        });
    }, [holidaysProp, periodFromTo.fromDay, periodFromTo.toDay]);

    const sickLeavesInPeriod = useMemo(() => {
        const fromDate = new Date(periodFromTo.fromDay);
        const toDate = new Date(periodFromTo.toDay);
        return sickLeavesProp.filter((sl) => {
            const start = new Date(sl.start_date);
            const end = new Date(sl.end_date);
            return start <= toDate && end >= fromDate;
        });
    }, [sickLeavesProp, periodFromTo.fromDay, periodFromTo.toDay]);

    // Parse time string (HH:MM:SS or HH:MM) to minutes from midnight
    const timeToMinutes = (timeStr: string): number => {
        const date = new Date(timeStr);
        return date.getHours() * 60 + date.getMinutes();
    };

    // True when time is 23:59 (end of day) - treat as full end for rendering to avoid white pixel gap
    const isEndOfDayTime = (timeStr: string): boolean => {
        const date = new Date(timeStr);
        return date.getHours() === 23 && date.getMinutes() === 59;
    };

    // Parse time slot time (HH:MM:SS format) to minutes from midnight
    const timeSlotToMinutes = (timeStr: string): number => {
        const [hours, minutes] = timeStr.split(":").map(Number);
        return hours * 60 + minutes;
    };

    // Check if a time record spans multiple days
    const spansMultipleDays = (startTime: string, endTime: string): boolean => {
        const startDate = formatDateForAPI(new Date(startTime));
        const endDate = formatDateForAPI(new Date(endTime));
        return startDate !== endDate;
    };

    // Normalize date to UTC midnight (same as AbsencesCalendar) - absences use UTC date parts
    const normalizeDateUTC = (date: Date): Date =>
        new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));

    // Check if an absence spans a given day - use UTC date comparison (same as AbsencesCalendar)
    const isDateInAbsence = (dayDate: Date, absence: Absence): boolean => {
        const normalizedDay = new Date(
            Date.UTC(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 0, 0, 0, 0)
        );
        const absenceStart = normalizeDateUTC(new Date(absence.start_date));
        const absenceEnd = normalizeDateUTC(new Date(absence.end_date));
        return normalizedDay >= absenceStart && normalizedDay <= absenceEnd;
    };

    // Check if a date is a holiday
    const isDateHoliday = (dateStr: string, holiday: Holiday): boolean => {
        return formatDateForAPI(new Date(holiday.holiday_date + "T12:00:00Z")) === dateStr;
    };

    // Check if a date is in a sick leave (UTC date comparison, same as absences)
    const isDateInSickLeave = (dayDate: Date, sickLeave: SickLeave): boolean => {
        const normalizedDay = new Date(
            Date.UTC(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 0, 0, 0, 0)
        );
        const slStart = new Date(Date.UTC(
            new Date(sickLeave.start_date).getUTCFullYear(),
            new Date(sickLeave.start_date).getUTCMonth(),
            new Date(sickLeave.start_date).getUTCDate(),
            0, 0, 0, 0
        ));
        const slEnd = new Date(Date.UTC(
            new Date(sickLeave.end_date).getUTCFullYear(),
            new Date(sickLeave.end_date).getUTCMonth(),
            new Date(sickLeave.end_date).getUTCDate(),
            0, 0, 0, 0
        ));
        return normalizedDay >= slStart && normalizedDay <= slEnd;
    };

    // Group time records by day, handling multi-day records (day labels via formatDate like time-records-summary-table)
    const timeRecordsByDay = useMemo(() => {
        const dayLabelOpts = { showTime: false, showMonth: false, showYear: false };
        return datesToShow.map((dayDate) => {
            const dayDateStr = formatDateForAPI(dayDate);
            const dayOfWeek = getDayOfWeek(dayDate);
            const day = {
                key: showMonthView ? dayDate.getTime() : dayOfWeek,
                dayOfWeek,
                label: formatDate(dayDate, { ...dayLabelOpts, showDayName: true, showDay: showMonthView }),
            };

            const records: any[] = [];

            timeRecords.forEach((tr) => {
                const trStartDate = formatDateForAPI(new Date(tr.start_time));
                const trEndDate = formatDateForAPI(new Date(tr.end_time));
                const isMultiDay = spansMultipleDays(tr.start_time, tr.end_time);

                if (trStartDate === dayDateStr) {
                    if (isMultiDay) {
                        const endOfDay = new Date(dayDate);
                        endOfDay.setHours(23, 59, 59, 999);
                        records.push({
                            ...tr,
                            displayStartTime: tr.start_time,
                            displayEndTime: endOfDay.toISOString(),
                            isPartialEnd: true,
                            isPartialStart: false,
                            dayIndex: day.key,
                        });
                    } else {
                        records.push({
                            ...tr,
                            displayStartTime: tr.start_time,
                            displayEndTime: tr.end_time,
                            isPartialEnd: false,
                            isPartialStart: false,
                            dayIndex: day.key,
                        });
                    }
                } else if (trEndDate === dayDateStr && isMultiDay) {
                    const startOfDay = new Date(dayDate);
                    startOfDay.setHours(0, 0, 0, 0);
                    records.push({
                        ...tr,
                        displayStartTime: startOfDay.toISOString(),
                        displayEndTime: tr.end_time,
                        isPartialEnd: false,
                        isPartialStart: true,
                        dayIndex: day.key,
                    });
                } else if (isMultiDay && trStartDate < dayDateStr && trEndDate > dayDateStr) {
                    const startOfDay = new Date(dayDate);
                    startOfDay.setHours(0, 0, 0, 0);
                    const endOfDay = new Date(dayDate);
                    endOfDay.setHours(23, 59, 59, 999);
                    records.push({
                        ...tr,
                        displayStartTime: startOfDay.toISOString(),
                        displayEndTime: endOfDay.toISOString(),
                        isPartialEnd: true,
                        isPartialStart: true,
                        dayIndex: day.key,
                    });
                }
            });

            const dayAbsences = absencesProp
                .filter((a) => a.status === "approved")
                .filter((a) => isDateInAbsence(dayDate, a));
            const dayHolidays = holidaysInPeriod.filter((h) => isDateHoliday(dayDateStr, h));
            const daySickLeaves = sickLeavesInPeriod.filter((sl) => isDateInSickLeave(dayDate, sl));

            return {
                day,
                date: new Date(dayDate),
                timeRecords: records.sort((a, b) => timeToMinutes(a.displayStartTime) - timeToMinutes(b.displayStartTime)),
                absences: dayAbsences,
                holidays: dayHolidays,
                sickLeaves: daySickLeaves,
            };
        });
    }, [datesToShow, i18n.language, showMonthView, timeRecords, absencesProp, holidaysInPeriod, sickLeavesInPeriod]);

    // Calculate which day should show duration for multi-day records
    const recordSegmentsByRecordId = new Map<string, any[]>();

    timeRecordsByDay.forEach(({ timeRecords: records }) => {
        records.forEach(record => {
            if (!recordSegmentsByRecordId.has(record.id)) {
                recordSegmentsByRecordId.set(record.id, []);
            }
            recordSegmentsByRecordId.get(record.id)!.push(record);
        });
    });

    // For each record, determine which segment should show duration
    recordSegmentsByRecordId.forEach((segments) => {
        if (segments.length === 1) {
            // Single day record, always show duration
            segments[0].showDuration = true;
        } else {
            // Multi-day record: find longest segment(s)
            const segmentsWithDuration = segments.map(seg => {
                const start = new Date(seg.displayStartTime);
                const end = new Date(seg.displayEndTime);
                const durationMs = end.getTime() - start.getTime();
                return { ...seg, durationMs };
            });

            const maxDuration = Math.max(...segmentsWithDuration.map(s => s.durationMs));
            const longestSegments = segmentsWithDuration.filter(s => s.durationMs === maxDuration);

            // If multiple segments have same duration, pick middle one
            const middleIndex = Math.floor(longestSegments.length / 2);
            const segmentToShowDuration = longestSegments[middleIndex];

            // Mark only that segment to show duration
            segments.forEach(seg => {
                seg.showDuration = seg.dayIndex === segmentToShowDuration.dayIndex;
            });
        }
    });

    // Get time slots for a specific day (regular, non-holiday slots)
    const getTimeSlotsForDay = (dayOfWeek: number): TimeSlot[] => {
        return defaultScheduleSlots.filter((slot) => slot.day_of_week === dayOfWeek && !slot.is_holiday);
    };

    // Get time slots for a specific day when it is a holiday (is_holiday: true slots)
    const getHolidayTimeSlotsForDay = (dayOfWeek: number): TimeSlot[] => {
        return defaultScheduleSlots.filter((slot) => slot.day_of_week === dayOfWeek && slot.is_holiday);
    };

    // Get start and end time for a specific day based on time policy slots (or 00:00–24:00 when use24HourView)
    const getDayTimeRange = (dayOfWeek: number, useHolidaySlots = false): { startHour: number; endHour: number } => {
        if (use24HourView) {
            return { startHour: 0, endHour: 24 };
        }

        const slots = useHolidaySlots ? getHolidayTimeSlotsForDay(dayOfWeek) : getTimeSlotsForDay(dayOfWeek);

        if (slots.length === 0) {
            // Default to 6:00 - 18:00 if no time policy slots
            return { startHour: 6, endHour: 18 };
        }

        // Find earliest start and latest end from slots
        let earliestMinutes = Infinity;
        let latestMinutes = -Infinity;

        slots.forEach(slot => {
            const startMinutes = timeSlotToMinutes(slot.start_time);
            const endMinutes = timeSlotToMinutes(slot.end_time);

            if (startMinutes < earliestMinutes) earliestMinutes = startMinutes;
            if (endMinutes > latestMinutes) latestMinutes = endMinutes;
        });

        // Convert to hours without padding - start and end exactly at time slot boundaries
        const startHour = Math.max(0, Math.floor(earliestMinutes / 60));
        const endHour = Math.min(24, Math.ceil(latestMinutes / 60));

        return { startHour, endHour };
    };

    // Create segments for time policy slots
    const getTimeSlotSegments = (slots: TimeSlot[], startHour: number, totalMinutes: number) => {
        const segments: Array<{
            start: number;
            end: number;
            isEmpty: boolean;
            timeSlot?: TimeSlot;
        }> = [];

        if (slots.length === 0) {
            return segments;
        }

        slots.forEach((slot) => {
            const startMinutes = timeSlotToMinutes(slot.start_time) - (startHour * 60);
            const endMinutes = timeSlotToMinutes(slot.end_time) - (startHour * 60);

            // Skip slots outside the view range
            if (endMinutes <= 0 || startMinutes >= totalMinutes) {
                return;
            }

            const clampedStart = Math.max(0, startMinutes);
            const clampedEnd = Math.min(totalMinutes, endMinutes);

            segments.push({
                start: clampedStart,
                end: clampedEnd,
                isEmpty: false,
                timeSlot: slot,
            });
        });

        return segments;
    };

    // Build day boundaries from dayDate (avoids timezone issues from parsing date strings)
    const getDayBounds = (dayDate: Date): { dayStart: Date; dayEnd: Date } => {
        const dayStart = new Date(dayDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayDate);
        dayEnd.setHours(23, 59, 59, 999);
        return { dayStart, dayEnd };
    };

    // Create segments for absence visualization (colored bars based on absence start/end times).
    // Uses actual datetime overlap so absences ending at 23:59 UTC (00:59 next day local) are correctly shown.
    // durationMinutes = real overlap with the day (independent of visible view range).
    const getAbsenceSegments = (
        dayAbsences: Absence[],
        _slots: TimeSlot[],
        startHour: number,
        totalMinutes: number,
        dayDate: Date
    ): Array<{ start: number; end: number; isEmpty: boolean; absence?: Absence; durationMinutes: number }> => {
        const segments: Array<{ start: number; end: number; isEmpty: boolean; absence?: Absence; durationMinutes: number }> = [];
        if (dayAbsences.length === 0) return segments;

        const { dayStart, dayEnd } = getDayBounds(dayDate);
        const viewStartMinutes = startHour * 60;

        for (const absence of dayAbsences) {
            const absStart = new Date(absence.start_date);
            const absEnd = new Date(absence.end_date);
            // Only include if absence actually overlaps the day (avoids 23:59→00:00 false inclusion)
            if (absEnd <= dayStart || absStart >= dayEnd) continue;

            const overlapStart = absStart < dayStart ? dayStart : absStart;
            const overlapEnd = absEnd > dayEnd ? dayEnd : absEnd;
            const absStartMinutes = overlapStart.getHours() * 60 + overlapStart.getMinutes();
            let absEndMinutes = overlapEnd.getHours() * 60 + overlapEnd.getMinutes();
            if (overlapEnd.getHours() === 23 && overlapEnd.getMinutes() === 59) absEndMinutes = 24 * 60;

            const segStart = Math.max(0, absStartMinutes - viewStartMinutes);
            const segEnd = Math.min(totalMinutes, absEndMinutes - viewStartMinutes);
            if (segEnd <= segStart) continue;

            // Real duration: overlap with the day (independent of visible view range)
            const durationMinutes = Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 60000);

            segments.push({
                start: segStart,
                end: segEnd,
                isEmpty: false,
                absence,
                durationMinutes,
            });
        }

        return segments;
    };

    // Create segments for sick leave visualization (same logic as absences, painted blue).
    // durationMinutes = real overlap with the day (independent of visible view range).
    const getSickLeaveSegments = (
        daySickLeaves: SickLeave[],
        _slots: TimeSlot[],
        startHour: number,
        totalMinutes: number,
        dayDate: Date
    ): Array<{ start: number; end: number; isEmpty: boolean; sickLeave?: SickLeave; durationMinutes: number }> => {
        const segments: Array<{ start: number; end: number; isEmpty: boolean; sickLeave?: SickLeave; durationMinutes: number }> = [];
        if (daySickLeaves.length === 0) return segments;

        const { dayStart, dayEnd } = getDayBounds(dayDate);
        const viewStartMinutes = startHour * 60;

        for (const sl of daySickLeaves) {
            const slStart = new Date(sl.start_date);
            const slEnd = new Date(sl.end_date);
            if (slEnd <= dayStart || slStart >= dayEnd) continue;

            const overlapStart = slStart < dayStart ? dayStart : slStart;
            const overlapEnd = slEnd > dayEnd ? dayEnd : slEnd;
            const slStartMinutes = overlapStart.getHours() * 60 + overlapStart.getMinutes();
            let slEndMinutes = overlapEnd.getHours() * 60 + overlapEnd.getMinutes();
            if (overlapEnd.getHours() === 23 && overlapEnd.getMinutes() === 59) slEndMinutes = 24 * 60;

            const segStart = Math.max(0, slStartMinutes - viewStartMinutes);
            const segEnd = Math.min(totalMinutes, slEndMinutes - viewStartMinutes);
            if (segEnd <= segStart) continue;

            // Real duration: overlap with the day (independent of visible view range)
            const durationMinutes = Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 60000);

            segments.push({
                start: segStart,
                end: segEnd,
                isEmpty: false,
                sickLeave: sl,
                durationMinutes,
            });
        }

        return segments;
    };

    // Create segments for visualization
    const getTimeRecordSegments = (records: any[], startHour: number, totalMinutes: number) => {
        const segments: Array<{
            start: number;
            end: number;
            isEmpty: boolean;
            timeRecord?: any;
        }> = [];

        if (records.length === 0) {
            segments.push({
                start: 0,
                end: totalMinutes,
                isEmpty: true,
            });
        } else {
            let currentMinute = 0;

            records.forEach((tr) => {
                // Use display times for visualization
                const startMinutes = timeToMinutes(tr.displayStartTime) - (startHour * 60);
                let endMinutes = timeToMinutes(tr.displayEndTime) - (startHour * 60);
                // Treat 23:59 as end of visible range to avoid white pixel gap
                if (isEndOfDayTime(tr.displayEndTime)) endMinutes = totalMinutes;

                // Skip records outside the view range
                if (endMinutes <= 0 || startMinutes >= totalMinutes) {
                    return;
                }

                const clampedStart = Math.max(0, startMinutes);
                const clampedEnd = Math.min(totalMinutes, endMinutes);

                // Add empty segment before this record if there's a gap
                if (currentMinute < clampedStart) {
                    segments.push({
                        start: currentMinute,
                        end: clampedStart,
                        isEmpty: true,
                    });
                }

                // Add the time record segment
                segments.push({
                    start: clampedStart,
                    end: clampedEnd,
                    isEmpty: false,
                    timeRecord: tr,
                });

                currentMinute = clampedEnd;
            });

            // Add empty segment after the last record if needed
            if (currentMinute < totalMinutes) {
                segments.push({
                    start: currentMinute,
                    end: totalMinutes,
                    isEmpty: true,
                });
            }
        }

        return segments;
    };

    // Calculate expected (workable) time in minutes for a specific day from time policy slots.
    // Excludes break_time_duration from each slot since break is not workable time.
    // When day is a holiday: use holiday-specific slots for that day (if any). Do NOT subtract absence/sickleave.
    // When holiday has no holiday slots: returns 0.
    // When absences/sickleave overlap with schedule (non-holiday): subtracts the overlapping minutes from expected.
    const getExpectedTimeForDay = (
        dayOfWeek: number,
        dayDate: Date,
        dayAbsences: Absence[],
        dayHolidays: Holiday[],
        daySickLeaves: SickLeave[] = []
    ): number => {
        if (dayHolidays.length > 0) {
            // For holidays: use holiday-specific slots for that day of week. Do not subtract absence/sickleave.
            const holidaySlots = getHolidayTimeSlotsForDay(dayOfWeek);
            return holidaySlots.reduce((total, slot) => {
                const startMinutes = timeSlotToMinutes(slot.start_time);
                const endMinutes = timeSlotToMinutes(slot.end_time);
                const slotDuration = endMinutes - startMinutes;
                const breakMinutes = slot.break_time_duration ?? 0;
                return total + Math.max(0, slotDuration - breakMinutes);
            }, 0);
        }

        const slots = getTimeSlotsForDay(dayOfWeek);
        let baseExpected = slots.reduce((total, slot) => {
            const startMinutes = timeSlotToMinutes(slot.start_time);
            const endMinutes = timeSlotToMinutes(slot.end_time);
            const slotDuration = endMinutes - startMinutes;
            const breakMinutes = slot.break_time_duration ?? 0;
            return total + Math.max(0, slotDuration - breakMinutes);
        }, 0);

        const { dayStart, dayEnd } = getDayBounds(dayDate);
        let overlapMinutes = 0;

        const subtractOverlap = (start: Date, end: Date) => {
            if (end <= dayStart || start >= dayEnd) return;
            const overlapStart = start < dayStart ? dayStart : start;
            const overlapEnd = end > dayEnd ? dayEnd : end;
            const startMin = overlapStart.getHours() * 60 + overlapStart.getMinutes();
            const endMin = overlapEnd.getHours() * 60 + overlapEnd.getMinutes();
            for (const slot of slots) {
                const slotStart = timeSlotToMinutes(slot.start_time);
                const slotEnd = timeSlotToMinutes(slot.end_time);
                const slotBreak = slot.break_time_duration ?? 0;
                const slotWorkable = slotEnd - slotStart - slotBreak;
                const overlapStartMin = Math.max(slotStart, startMin);
                const overlapEndMin = Math.min(slotEnd, endMin);
                const overlap = Math.max(0, overlapEndMin - overlapStartMin);
                overlapMinutes += Math.min(overlap, slotWorkable);
            }
        };

        for (const absence of dayAbsences) {
            subtractOverlap(new Date(absence.start_date), new Date(absence.end_date));
        }
        for (const sl of daySickLeaves) {
            subtractOverlap(new Date(sl.start_date), new Date(sl.end_date));
        }

        return Math.max(0, baseExpected - overlapMinutes);
    };

    // Calculate workable duration for a record segment (displayStartTime, displayEndTime) on a given day.
    // Subtracts break time from the overlapping time policy slot since break is not workable time.
    const getWorkableDurationInMinutes = (displayStartTime: string, displayEndTime: string, dayOfWeek: number): number => {
        const start = new Date(displayStartTime);
        const end = new Date(displayEndTime);
        const rawMinutes = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60));

        const slots = getTimeSlotsForDay(dayOfWeek);
        if (slots.length === 0) return rawMinutes;

        const segStartMinutes = start.getHours() * 60 + start.getMinutes();
        const segEndMinutes = end.getHours() * 60 + end.getMinutes();

        // Find the slot with maximum overlap and subtract its break time
        let maxOverlap = 0;
        let breakToSubtract = 0;
        for (const slot of slots) {
            const slotStart = timeSlotToMinutes(slot.start_time);
            const slotEnd = timeSlotToMinutes(slot.end_time);
            const overlapStart = Math.max(segStartMinutes, slotStart);
            const overlapEnd = Math.min(segEndMinutes, slotEnd);
            const overlapMinutes = Math.max(0, overlapEnd - overlapStart);
            if (overlapMinutes > maxOverlap && (slot.break_time_duration ?? 0) > 0) {
                maxOverlap = overlapMinutes;
                breakToSubtract = Math.min(slot.break_time_duration, overlapMinutes);
            }
        }
        return Math.max(0, rawMinutes - breakToSubtract);
    };

    // Format time to show in "XXh XXmin" format
    const formatTimeHoursMinutes = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        return `${hours}h ${mins}min`;
    };

    // Get color name based on verification status
    const getVerificationColor = (status: "approved" | "rejected" | "pending"): string => {
        if (status === "approved") return "green";
        if (status === "rejected") return "red";
        if (status === "pending") return "yellow";
        return "gray"; // default to gray
    };

    // Calculate weekly totals (workable time: excludes break from both worked and scheduled)
    const totalWorkedMinutes = timeRecordsByDay.reduce((sum, { day, timeRecords: records }) => {
        return sum + records.reduce((daySum, record) => {
            const displayStart = record.displayStartTime ?? record.start_time;
            const displayEnd = record.displayEndTime ?? record.end_time;
            return daySum + getWorkableDurationInMinutes(displayStart, displayEnd, day.dayOfWeek);
        }, 0);
    }, 0);
    const totalEstimatedMinutes = timeRecordsByDay.reduce(
        (sum, { day, date, absences: dayAbsences = [], holidays: dayHolidays = [], sickLeaves: daySickLeaves = [] }) =>
            sum + getExpectedTimeForDay(day.dayOfWeek, date, dayAbsences, dayHolidays, daySickLeaves),
        0
    );

    return (
        <div className="space-y-4">
            <PageHeader
                title={
                    <span className="text-[16px] font-semibold">
                        {t("employees.timeRecords.title", "Time Records Summary")}
                    </span>
                }
                showBackButton={false}
                action={headerAction}
            />

            <Card className="w-full shadow-none p-0 border-none">
                <CardContent className="p-0">
                    {/* Weekly Summary */}
                    {timePolicy && (
                        <div className="mb-4">
                            <TimeRecordsSummaryCard
                                scheduledMinutes={totalEstimatedMinutes}
                                workedMinutes={totalWorkedMinutes}
                            />
                        </div>
                    )}

                    <TimeRecordsDaysTable
                        timeRecordsByDay={timeRecordsByDay}
                        timePolicy={timePolicy}
                        onViewTimeRecord={onViewTimeRecord}
                        onViewAbsence={onViewAbsence}
                        onViewSickLeave={onViewSickLeave}
                        renderAbsencePopoverActions={renderAbsencePopoverActions}
                        renderAbsenceDetailActions={renderAbsenceDetailActions}
                        renderSickLeavePopoverActions={renderSickLeavePopoverActions}
                        renderSickLeaveDetailActions={renderSickLeaveDetailActions}
                        hiddenColumns={["worked_time"]}
                        renderActions={renderActions}
                        renderPopoverActions={renderPopoverActions}
                        renderDetailActions={renderDetailActions}
                        getTimeSlotsForDay={getTimeSlotsForDay}
                        getHolidayTimeSlotsForDay={getHolidayTimeSlotsForDay}
                        getDayTimeRange={getDayTimeRange}
                        getTimeSlotSegments={getTimeSlotSegments}
                        getAbsenceSegments={getAbsenceSegments}
                        getSickLeaveSegments={getSickLeaveSegments}
                        getTimeRecordSegments={getTimeRecordSegments}
                        getWorkableDurationInMinutes={getWorkableDurationInMinutes}
                        getExpectedTimeForDay={getExpectedTimeForDay}
                        formatTimeHoursMinutes={formatTimeHoursMinutes}
                        getVerificationColor={getVerificationColor}
                        timeSlotToMinutes={timeSlotToMinutes}
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default TimeRecordsDaysView;

