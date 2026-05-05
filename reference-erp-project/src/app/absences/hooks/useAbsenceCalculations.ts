import { useMemo, useCallback } from "react";
import { addDays, addHours } from "date-fns";
import { AbsenceCounterType } from "@/types/employees/absences";

export type HalfDayPeriod = "first" | "second";

export interface AbsenceCalculationsParams {
  startDate: Date | undefined;
  duration: number;
  halfDayPeriod: HalfDayPeriod;
  counter: AbsenceCounterType | null;
}

export interface AbsenceCalculationsResult {
  /** Calculate the end date based on start date, duration, unit, and half-day period */
  calculateEndDate: () => Date;
  /** Adjust start date time based on unit type and half-day period */
  adjustStartDate: (date: Date) => Date;
  /** Parse existing absence dates to get duration and half-day period */
  parseDurationFromDates: (
    startDate: Date,
    endDate: Date,
    unit: "days" | "hours"
  ) => { duration: number; halfDayPeriod: HalfDayPeriod };
}

/**
 * Hook for absence date/duration calculations.
 * Encapsulates the complex logic for:
 * - Calculating end dates based on start date, duration, and unit
 * - Adjusting start date times for half-day periods
 * - Parsing existing absence dates back to duration/period
 */
export function useAbsenceCalculations({
  startDate,
  duration,
  halfDayPeriod,
  counter,
}: AbsenceCalculationsParams): AbsenceCalculationsResult {
  /**
   * Calculate the end date based on start date, duration, unit, and half-day period
   */
  const calculateEndDate = useCallback((): Date => {
    if (!counter || !startDate) return startDate || new Date();

    const start = new Date(startDate);

    if (counter.unit === "days") {
      if (duration % 1 === 0) {
        // Whole number of days
        // If duration is 1 day, end date is same day at 23:59:59
        // If duration is 2 days, end date is next day at 23:59:59
        const endDate = addDays(start, duration - 1);
        endDate.setHours(23, 59, 59, 0);
        return endDate;
      } else {
        // Half day (0.5, 1.5, 2.5, etc.)
        if (duration === 0.5) {
          // Exactly 0.5 days - same day
          const endDate = new Date(start);
          if (halfDayPeriod === "first") {
            // First half: 00:00 - 12:00
            endDate.setHours(12, 0, 0, 0);
          } else {
            // Last half: 12:00 - 23:59
            endDate.setHours(23, 59, 59, 0);
          }
          return endDate;
        } else {
          // More than 1 day with .5 (1.5, 2.5, etc.)
          const wholeDays = Math.floor(duration);

          if (halfDayPeriod === "first") {
            // First day is half (12:00-23:59), then full days
            // Start is at 12:00, end at 23:59 after wholeDays
            const endDate = addDays(start, wholeDays);
            endDate.setHours(23, 59, 59, 0);
            return endDate;
          } else {
            // Full days, then last day is half (00:00-12:00)
            // Start is at 00:00, end at 12:00 after wholeDays
            const endDate = addDays(start, wholeDays);
            endDate.setHours(12, 0, 0, 0);
            return endDate;
          }
        }
      }
    } else {
      // Hours
      return addHours(start, duration);
    }
  }, [counter, startDate, duration, halfDayPeriod]);

  /**
   * Adjust start date time based on unit type and half-day period
   */
  const adjustStartDate = useCallback(
    (date: Date): Date => {
      if (!counter) return date;

      const newStartDate = new Date(date);

      if (counter.unit === "days") {
        // For days with half-day durations
        if (duration % 1 !== 0) {
          // Has a half day (.5)
          if (duration === 0.5) {
            // Exactly 0.5 days
            if (halfDayPeriod === "first") {
              // First half: 00:00 - 12:00
              newStartDate.setHours(0, 0, 0, 0);
            } else {
              // Last half: 12:00 - 23:59
              newStartDate.setHours(12, 0, 0, 0);
            }
          } else {
            // More than 1 day with .5 (1.5, 2.5, etc.)
            if (halfDayPeriod === "first") {
              // First day is half: start at 12:00 (last half of first day)
              newStartDate.setHours(12, 0, 0, 0);
            } else {
              // Last day is half: start at 00:00 (normal)
              newStartDate.setHours(0, 0, 0, 0);
            }
          }
        } else {
          // Whole days: always start at 00:00
          newStartDate.setHours(0, 0, 0, 0);
        }
      }
      // For hours, keep the time selector value

      return newStartDate;
    },
    [counter, duration, halfDayPeriod]
  );

  /**
   * Parse existing absence dates to get duration and half-day period
   */
  const parseDurationFromDates = useCallback(
    (
      start: Date,
      end: Date,
      unit: "days" | "hours"
    ): { duration: number; halfDayPeriod: HalfDayPeriod } => {
      if (unit === "days") {
        // Calculate days difference using UTC to avoid timezone issues
        const startDay = new Date(start);
        startDay.setUTCHours(0, 0, 0, 0);
        const endDay = new Date(end);
        endDay.setUTCHours(0, 0, 0, 0);
        const daysDiff =
          (endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24);

        // Use UTC hours to match how dates are stored
        const startHour = start.getUTCHours();
        const endHour = end.getUTCHours();

        // Check if it's a half day scenario
        if (daysDiff === 0 && endHour === 12) {
          // 0.5 days
          return {
            duration: 0.5,
            halfDayPeriod: startHour === 0 ? "first" : "second",
          };
        } else if (endHour === 12) {
          // Ends at 12:00 - last day is half
          return { duration: daysDiff + 0.5, halfDayPeriod: "second" };
        } else if (startHour === 12 && endHour === 23) {
          // Starts at 12:00, ends at 23:59 - first day is half
          return { duration: daysDiff + 0.5, halfDayPeriod: "first" };
        } else if (startHour === 0 && endHour === 23) {
          // Normal full days
          return { duration: daysDiff + 1, halfDayPeriod: "second" };
        } else {
          // Fallback
          return { duration: Math.ceil(daysDiff + 1), halfDayPeriod: "second" };
        }
      } else {
        // Hours
        const timeDiff = end.getTime() - start.getTime();
        return {
          duration: timeDiff / (1000 * 60 * 60),
          halfDayPeriod: "second",
        };
      }
    },
    []
  );

  return useMemo(
    () => ({
      calculateEndDate,
      adjustStartDate,
      parseDurationFromDates,
    }),
    [calculateEndDate, adjustStartDate, parseDurationFromDates]
  );
}

export default useAbsenceCalculations;
