import { formatDate, getColorClasses } from "@/utils/miscelanea";
import { cn } from "@/lib/utils";

/** Props for the CalendarDayLabel component. */
interface CalendarDayLabelProps {
    /** The date to display. Only the day and month are shown; the year is ignored. */
    data: Date;
    /** Color for the month header (e.g. "red", "amber"). Defaults to "red". */
    color?: string;
    /** Whether to format the date using UTC. Defaults to true. */
    useUTC?: boolean;
}

/**
 * A compact calendar-style label that displays a month name and day number.
 * Used for holidays, sick leaves, and other date displays where a visual
 * calendar tile is desired.
 */
const CalendarDayLabel = ({ data, color = "red", useUTC = true }: CalendarDayLabelProps) => {
    const monthName = formatDate(data, {
        showTime: false,
        showDay: false,
        showMonth: true,
        showYear: false,
        useUTC: useUTC,
    });
    const dayFormatted = formatDate(data, {
        showTime: false,
        showDay: true,
        showMonth: false,
        showYear: false,
        useUTC: useUTC,
    });

    return (
        <div className="flex flex-col items-center justify-center w-12 rounded-sm border border-border flex-shrink-0">
            <div
                className={cn(
                    "text-xs w-full text-center rounded-t-sm py-0.5",
                    getColorClasses(color)
                )}
            >
                {monthName}
            </div>
            <div className="text-lg font-bold text-foreground leading-none pt-1 pb-2">
                {dayFormatted}
            </div>
        </div>
    );
};

export default CalendarDayLabel;
