import React, { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Badge } from "@/components/ui/badge";

interface DurationLabelProps {
    /** Start date as ISO string */
    startDate?: string | null;
    /** End date as ISO string */
    endDate?: string | null;
    /** Optional className for the container */
    className?: string;
    /** Show elapsed time when no endDate (updates live every minute) */
    showElapsedTime?: boolean;
    /** Show "Live" badge when tracking is active (no endDate) */
    showLiveBadge?: boolean;
}

// Treat 23:59:59 as 24:00:00 (add 1 second) for duration so end-of-day counts as a full day.
function endOfDayAsMidnight(d: Date): Date {
    if (!Number.isFinite(d.getTime())) return d;
    const h = d.getUTCHours(),
        m = d.getUTCMinutes(),
        s = d.getUTCSeconds();
    if (h === 23 && m === 59 && s === 59) return new Date(d.getTime() + 1000);
    return d;
}

/**
 * DurationLabel component - Displays formatted duration between two dates
 * 
 * @param startDate - Start date as ISO string
 * @param endDate - End date as ISO string (if null and showElapsedTime=true, shows live elapsed time)
 * @param className - Optional className for styling
 * @param showElapsedTime - When true and no endDate, calculates elapsed time from now (updates every minute)
 * @param showLiveBadge - When true and no endDate, shows a "Live" badge with pulsing indicator
 * 
 * Behavior:
 * - If dates are invalid/missing: displays "-"
 * - Shows duration in most appropriate units: "X day(s)", "Xh Xm Xs"
 * - Omits 0h/0m when not needed
 * - Shows "Xs" when only seconds remain
 * - Treats 23:59:59 as end of day (adds 1 second for full day calculation)
 * - With showElapsedTime: calculates live duration when no endDate (updates every minute)
 * - With showLiveBadge: displays "Live" badge with pulsing dot for active tracking
 * 
 * Examples:
 * - "1 day"
 * - "2 days"
 * - "1 day 8h 30m"
 * - "5h 45m" [Live]
 * - "30m 15s"
 * - "45s"
 */
const DurationLabel: React.FC<DurationLabelProps> = ({
    startDate,
    endDate,
    className = "",
    showElapsedTime = false,
    showLiveBadge = false,
}) => {
    const { t } = useTranslation();
    const [currentTime, setCurrentTime] = useState(Date.now());

    // Update current time every minute when showElapsedTime is true and no endDate
    useEffect(() => {
        if (showElapsedTime && !endDate && startDate) {
            // Initial update to ensure we have the latest time
            setCurrentTime(Date.now());
            
            const interval = setInterval(() => {
                setCurrentTime(Date.now());
            }, 60000); // Update every minute
            return () => clearInterval(interval);
        }
    }, [showElapsedTime, endDate, startDate]);

    // Handle null, undefined, or empty string for startDate
    if (!startDate) {
        return <span className="text-muted-foreground">-</span>;
    }

    // If no endDate and showElapsedTime is false, show "-"
    if (!endDate && !showElapsedTime) {
        return <span className="text-muted-foreground">-</span>;
    }

    // Determine if this is an active elapsed time calculation
    const isActive = !endDate && showElapsedTime;

    // Calculate duration
    const startDateObj = new Date(startDate);
    // For active tracking, use fresh Date.now() instead of currentTime, otherwise use endDate or currentTime
    const endDateObj = isActive 
        ? new Date(Date.now())  // Use fresh Date.now() for active tracking
        : (endDate ? endOfDayAsMidnight(new Date(endDate)) : new Date(currentTime));
    
    if (!Number.isFinite(startDateObj.getTime()) || !Number.isFinite(endDateObj.getTime())) {
        return <span className="text-muted-foreground">-</span>;
    }

    const totalSeconds = Math.max(0, Math.round((endDateObj.getTime() - startDateObj.getTime()) / 1000));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    const fullDays = Math.floor(h / 24);
    const remainingHours = h % 24;

    const parts: string[] = [];
    
    if (fullDays > 0) {
        parts.push(
            `${fullDays} ${fullDays === 1 ? t("absences.day", "day") : t("absences.days", "days")}`
        );
    }
    if (remainingHours > 0) parts.push(`${remainingHours}h`);
    if (m > 0) parts.push(`${m}m`);
    
    // For elapsed time display, omit seconds to reduce visual noise
    if (!isActive) {
        if (s > 0 || parts.length === 0) parts.push(`${s}s`);
    }
    
    // If no parts (e.g., 0 minutes for active tracking), show at least "0m"
    if (parts.length === 0) {
        parts.push("0m");
    }

    return (
        <div className={`font-medium text-sm flex items-center gap-2 ${className}`}>
            <span>{parts.join(" ")}</span>
            {isActive && showLiveBadge && (
                <Badge 
                    variant="outline" 
                    className="bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400 text-xs"
                >
                    <div className="size-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                    {t("workorders.live", "Live")}
                </Badge>
            )}
        </div>
    );
};

export default DurationLabel;
