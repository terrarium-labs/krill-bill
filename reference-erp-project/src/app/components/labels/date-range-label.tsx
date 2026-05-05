import React from "react";
import { formatDateRange } from "@/utils/miscelanea";
import { cn } from "@/lib/utils";

interface DateRangeLabelProps {
    /** Start date as ISO string */
    startDate?: string | null;
    /** End date as ISO string */
    endDate?: string | null;
    /** Whether to use UTC timezone (default: true) */
    useUTC?: boolean;
    /** If true, show date range only without timestamps */
    dateOnly?: boolean;
    /** Optional className for the container */
    className?: string;
}

/**
 * DateRangeLabel component - Displays a formatted date range
 * 
 * @param startDate - Start date as ISO string
 * @param endDate - End date as ISO string
 * @param useUTC - Whether to use UTC timezone (default: true)
 * @param className - Optional className for styling
 * 
 * Behavior:
 * - If dates are invalid/missing: displays "-"
 * - If whole-day (00:00:00 to 23:59:59): shows date only
 * - If same day: shows "Date Time - Time"
 * - If different days: shows "Date Time - Date Time"
 * 
 * Examples:
 * - Single day: "Jan 15"
 * - Same month range: "Jan 15 - 17"
 * - Different months: "Jan 15 - Feb 3"
 * - Time range same day: "Jan 15, 9:00 AM - 5:00 PM"
 * - Time range different days: "Jan 15, 9:00 AM - Jan 16, 5:00 PM"
 */
const DateRangeLabel: React.FC<DateRangeLabelProps> = ({
    startDate,
    endDate,
    useUTC = true,
    dateOnly = false,
    className = ""
}) => {
    // Handle null, undefined, or empty string
    if (!startDate || !endDate) {
        return <span className="text-muted-foreground">-</span>;
    }

    const formattedRange = formatDateRange(startDate, endDate, { useUTC, dateOnly });

    return (
        <div className={cn("text-sm", className)}>
            {formattedRange}
        </div>
    );
};

export default DateRangeLabel;
