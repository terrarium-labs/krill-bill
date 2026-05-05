import React from "react";
import { formatDate } from "@/utils/miscelanea";

type DateUnit = "minutes" | "seconds" | "hours" | "day" | "month" | "year";

interface DateLabelProps {
    data: string | number | Date | null | undefined;
    options?: {
        hide?: DateUnit | DateUnit[];
    };
    useUTC?: boolean;
    className?: string;
}

/**
 * DateLabel component - Displays a formatted date with customizable visibility options
 * 
 * @param data - Can be a date string, timestamp, Date object, null, or undefined
 * @param options - Optional configuration object
 * @param options.hide - Units to hide from the date display. Can be a single unit or an array of units.
 *                       Valid values: "minutes", "seconds", "hours", "day", "month", "year"
 * @param useUTC - Whether to use UTC timezone (default: true)
 * @param className - Optional custom class name to override the default "text-sm" styling
 * 
 * Behavior:
 * - If null/undefined: displays "-"
 * - Otherwise: displays formatted date based on hide options
 * 
 * Examples:
 * - hide: "seconds" -> shows date with time but no seconds
 * - hide: ["hours", "minutes", "seconds"] -> shows only the date part
 * - hide: "year" -> shows date without year
 */
const DateLabel: React.FC<DateLabelProps> = ({ data, options, useUTC = true, className }) => {
    // Handle null or undefined
    if (!data) {
        return <span className="text-muted-foreground">-</span>;
    }

    // Parse hide options
    const hideUnits = options?.hide
        ? (Array.isArray(options.hide) ? options.hide : [options.hide])
        : [];

    // Determine what to show based on hide options
    const showDay = !hideUnits.includes("day");
    const showMonth = !hideUnits.includes("month");
    const showYear = !hideUnits.includes("year");
    const showHours = !hideUnits.includes("hours");
    const showMinutes = !hideUnits.includes("minutes");
    const showSeconds = !hideUnits.includes("seconds");

    // showTime should be true if any time unit is visible
    const showTime = showHours || showMinutes || showSeconds;

    // Format the date with appropriate options
    const formattedDate = formatDate(data, {
        showDay,
        showMonth,
        showYear,
        showTime,
        showSeconds,
        useUTC,
    });

    return <div className={className || "text-sm"}>{formattedDate}</div>;
};

export default DateLabel;
