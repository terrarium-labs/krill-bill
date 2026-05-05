import { useState, useMemo, ReactNode } from "react";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { getColorClasses } from "@/utils/miscelanea";
import { Absence } from "@/types/employees/absences";
import type { SickLeave } from "@/types/employees/sick-leaves";
import AbsenceDayPopover from "./absence-day-popover";
import { eachMonthOfInterval } from "date-fns";
import { Holiday } from "@/types/general/holidays";

/** Modifier prefix for sick-leave spans (orange styling). */
const SICK_LEAVE_MODIFIER_PREFIX = "sick_leave";

interface AbsencesCalendarProps {
  selectedYear: number;
  absences: Absence[];
  /** Sick leaves overlapping the calendar year; shown in orange. */
  sickLeaves?: SickLeave[];
  holidays?: Holiday[];
  onAddAbsence: (date: Date | null) => void;
  onViewAbsence: (absence: Absence) => void;
  /** Opens the same sick-leave view modal as the sick leaves card (e.g. ref.openView). */
  onViewSickLeave?: (sickLeave: SickLeave) => void;
  /** Custom render function for actions in the popover. Receives the absence and a callback to close the popover */
  renderActions?: (absence: Absence, closePopover: () => void) => ReactNode;
}

const AbsencesCalendar = ({
  selectedYear,
  absences,
  sickLeaves = [],
  holidays = [],
  onAddAbsence,
  onViewAbsence,
  onViewSickLeave,
  renderActions,
}: AbsencesCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Get all months for the selected year
  const monthsInYear = useMemo(() => {
    return eachMonthOfInterval({
      start: new Date(selectedYear, 0, 1),
      end: new Date(selectedYear, 11, 31),
    });
  }, [selectedYear]);

  // Helper function to normalize date to start of day in UTC (ignore time)
  const normalizeDate = (date: Date): Date => {
    const normalized = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        0,
        0,
        0,
        0
      )
    );
    return normalized;
  };

  // Helper function to check if two dates are the same day
  const isSameCalendarDay = (date1: Date, date2: Date): boolean => {
    return normalizeDate(date1).getTime() === normalizeDate(date2).getTime();
  };

  // Function to get modifiers for calendar days
  const getDayModifiers = () => {
    const modifiers: Record<string, Date[]> = {};
    // Track which days have multiple absences
    const dayAbsenceCount: Map<string, number> = new Map();

    // Helper to ensure modifier arrays exist
    const ensureModifierKeys = (typeId: string) => {
      if (!modifiers[typeId]) {
        modifiers[typeId] = [];
        modifiers[`${typeId}_start`] = [];
        modifiers[`${typeId}_middle`] = [];
        modifiers[`${typeId}_end`] = [];
        modifiers[`${typeId}_single`] = [];
      }
    };

    // Helper to get a day key for tracking
    const getDayKey = (date: Date): string => {
      return normalizeDate(date).toISOString();
    };

    // First pass: count absence + sick-leave segments per day (for overlap / middle styling)
    const bumpDayCount = (start_date: Date, end_date: Date) => {
      if (isSameCalendarDay(start_date, end_date)) {
        const dayKey = getDayKey(start_date);
        dayAbsenceCount.set(dayKey, (dayAbsenceCount.get(dayKey) || 0) + 1);
      } else {
        const currentDate = normalizeDate(start_date);
        const normalizedEnd = normalizeDate(end_date);

        while (currentDate <= normalizedEnd) {
          const dayKey = getDayKey(currentDate);
          dayAbsenceCount.set(dayKey, (dayAbsenceCount.get(dayKey) || 0) + 1);
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    };

    absences.forEach((absence) => {
      bumpDayCount(new Date(absence.start_date), new Date(absence.end_date));
    });

    sickLeaves.forEach((sl) => {
      bumpDayCount(new Date(sl.start_date), new Date(sl.end_date));
    });

    // Second pass: apply modifiers based on position and overlap
    absences.forEach((absence) => {
      const absence_type = absence.absence_type;
      const start_date = new Date(absence.start_date);
      const end_date = new Date(absence.end_date);

      // Ensure modifier keys exist for this absence type
      ensureModifierKeys(absence_type.id);

      // Check if it's a single day absence (same calendar day)
      if (isSameCalendarDay(start_date, end_date)) {
        const dayKey = getDayKey(start_date);
        const hasMultiple = (dayAbsenceCount.get(dayKey) || 0) > 1;

        // If this day has multiple absences, use middle (continuous) style
        if (hasMultiple) {
          modifiers[`${absence_type.id}_middle`].push(
            normalizeDate(start_date)
          );
        } else {
          modifiers[`${absence_type.id}_single`].push(
            normalizeDate(start_date)
          );
        }
      } else {
        // Multi-day absence
        const currentDate = normalizeDate(start_date);
        const normalizedEnd = normalizeDate(end_date);

        while (currentDate <= normalizedEnd) {
          const dayKey = getDayKey(currentDate);
          const hasMultiple = (dayAbsenceCount.get(dayKey) || 0) > 1;

          if (hasMultiple) {
            // Day has multiple absences, always use middle style for continuity
            modifiers[`${absence_type.id}_middle`].push(new Date(currentDate));
          } else {
            // Single absence on this day, use position-based style
            if (isSameCalendarDay(currentDate, start_date)) {
              // First day
              modifiers[`${absence_type.id}_start`].push(new Date(currentDate));
            } else if (isSameCalendarDay(currentDate, end_date)) {
              // Last day
              modifiers[`${absence_type.id}_end`].push(new Date(currentDate));
            } else {
              // Middle day
              modifiers[`${absence_type.id}_middle`].push(
                new Date(currentDate)
              );
            }
          }

          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    });

    // Sick leave spans (fixed orange modifier set)
    sickLeaves.forEach((sl) => {
      ensureModifierKeys(SICK_LEAVE_MODIFIER_PREFIX);
      const start_date = new Date(sl.start_date);
      const end_date = new Date(sl.end_date);

      if (isSameCalendarDay(start_date, end_date)) {
        const dayKey = getDayKey(start_date);
        const hasMultiple = (dayAbsenceCount.get(dayKey) || 0) > 1;
        if (hasMultiple) {
          modifiers[`${SICK_LEAVE_MODIFIER_PREFIX}_middle`].push(
            normalizeDate(start_date)
          );
        } else {
          modifiers[`${SICK_LEAVE_MODIFIER_PREFIX}_single`].push(
            normalizeDate(start_date)
          );
        }
      } else {
        const currentDate = normalizeDate(start_date);
        const normalizedEnd = normalizeDate(end_date);

        while (currentDate <= normalizedEnd) {
          const dayKey = getDayKey(currentDate);
          const hasMultiple = (dayAbsenceCount.get(dayKey) || 0) > 1;

          if (hasMultiple) {
            modifiers[`${SICK_LEAVE_MODIFIER_PREFIX}_middle`].push(new Date(currentDate));
          } else {
            if (isSameCalendarDay(currentDate, start_date)) {
              modifiers[`${SICK_LEAVE_MODIFIER_PREFIX}_start`].push(new Date(currentDate));
            } else if (isSameCalendarDay(currentDate, end_date)) {
              modifiers[`${SICK_LEAVE_MODIFIER_PREFIX}_end`].push(new Date(currentDate));
            } else {
              modifiers[`${SICK_LEAVE_MODIFIER_PREFIX}_middle`].push(new Date(currentDate));
            }
          }

          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    });

    // Add holiday modifiers (from holiday_date YYYY-MM-DD; only for selected year). Parse as UTC then build local midnight so the highlighted day matches the grid and getHolidaysForDate.
    holidays.forEach((holiday) => {
      const d = new Date(holiday.holiday_date + "T12:00:00Z");
      if (d.getUTCFullYear() === selectedYear) {
        modifiers["holiday"] = modifiers["holiday"] || [];
        const localMidnight = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
        modifiers["holiday"].push(localMidnight);
      }
    });

    return modifiers;
  };

  const dayModifiers = useMemo(
    () => getDayModifiers(),
    [absences, sickLeaves, holidays, selectedYear]
  );

  // Function to generate dynamic modifiersClassNames based on absences
  const getModifiersClassNames = useMemo(() => {
    const classNames: Record<string, string> = {};
    const processedTypes = new Set<string>();

    // Process absence types from absences
    absences.forEach((absence) => {
      if (!processedTypes.has(absence.absence_type.id)) {
        const colorClasses = getColorClasses(absence.absence_type.color);
        processedTypes.add(absence.absence_type.id);

        classNames[`${absence.absence_type.id}_single`] = cn(
          colorClasses,
          "rounded-md"
        );
        classNames[`${absence.absence_type.id}_start`] = cn(
          colorClasses,
          "rounded-l-md"
        );
        classNames[`${absence.absence_type.id}_middle`] = cn(
          colorClasses,
          "rounded-none"
        );
        classNames[`${absence.absence_type.id}_end`] = cn(
          colorClasses,
          "rounded-r-md"
        );
      }
    });

    classNames[`${SICK_LEAVE_MODIFIER_PREFIX}_single`] = cn(getColorClasses("red"), "rounded-md");
    classNames[`${SICK_LEAVE_MODIFIER_PREFIX}_start`] = cn(getColorClasses("red"), "rounded-l-md");
    classNames[`${SICK_LEAVE_MODIFIER_PREFIX}_middle`] = cn(getColorClasses("red"), "rounded-none");
    classNames[`${SICK_LEAVE_MODIFIER_PREFIX}_end`] = cn(getColorClasses("red"), "rounded-r-md");

    // Add holiday styling
    classNames["holiday"] = cn(
      "bg-gray-100 dark:bg-gray-900/40 text-gray-900 dark:text-gray-100 font-semibold border border-gray-300 dark:border-gray-700 rounded-md"
    );

    return classNames;
  }, [absences]);

  // Function to get absences for a specific date
  const getSickLeavesForDate = (date: Date): SickLeave[] => {
    const normalizedDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
    );

    return sickLeaves.filter((sl) => {
      const slStart = normalizeDate(new Date(sl.start_date));
      const slEnd = normalizeDate(new Date(sl.end_date));
      return normalizedDate >= slStart && normalizedDate <= slEnd;
    });
  };

  const getAbsencesForDate = (date: Date): Absence[] => {
    // The calendar gives us a local date, we need to treat it as a calendar day
    // Create a UTC date with the same calendar day values
    const normalizedDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
    );

    return absences.filter((absence) => {
      const absenceStart = normalizeDate(new Date(absence.start_date));
      const absenceEnd = normalizeDate(new Date(absence.end_date));
      return normalizedDate >= absenceStart && normalizedDate <= absenceEnd;
    });
  };

  // Function to get holidays for a specific date (compare YYYY-MM-DD with holiday_date)
  const getHolidaysForDate = (date: Date): Holiday[] => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;
    return holidays.filter((holiday) => holiday.holiday_date === dateStr);
  };

  // Custom day button component with popover - wrapper for AbsenceDayPopover
  const AbsencePopoverDayButton = (
    props: React.ComponentProps<typeof CalendarDayButton>
  ) => {
    const dayAbsences = getAbsencesForDate(props.day.date);
    const daySickLeaves = getSickLeavesForDate(props.day.date);
    const dayHolidays = getHolidaysForDate(props.day.date);

    const handleAddAbsenceForDay = (date: Date) => {
      onAddAbsence(date);
    };

    return (
      <AbsenceDayPopover
        {...props}
        absences={dayAbsences}
        sickLeaves={daySickLeaves}
        holidays={dayHolidays}
        onAddAbsence={handleAddAbsenceForDay}
        onViewAbsence={onViewAbsence}
        onViewSickLeave={onViewSickLeave}
        renderActions={renderActions}
      />
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {monthsInYear.map((month) => (
        <div key={month.getTime()} className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={month}
            showOutsideDays={false}
            weekStartsOn={1}
            className="p-0"
            modifiers={dayModifiers}
            modifiersClassNames={getModifiersClassNames}
            classNames={{
              nav: "hidden",
              button_previous: "hidden",
              button_next: "hidden",
              caption:
                "flex justify-center pt-0 relative items-center w-full",
              caption_label: "text-xs font-medium",
              weekdays: "flex",
              weekday:
                "text-xs font-normal text-muted-foreground w-6 h-6 flex items-center justify-center p-0",
              week: "flex w-full mt-1",
              day: "min-h-6 min-w-6 max-h-6 max-w-6 text-xs p-0 font-normal aria-selected:opacity-100 flex items-center justify-center",
              day_button:
                "min-h-6 min-w-6 max-h-6 max-w-6 p-0 text-xs font-normal flex items-center justify-center hover:bg-accent hover:text-accent-foreground focus-visible:ring-1",
              month: "space-y-1 p-2",
            }}
            components={{
              DayButton: AbsencePopoverDayButton,
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default AbsencesCalendar;
