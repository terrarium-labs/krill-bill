import { useState, ReactNode } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { formatTimeToTravel, formatTime, formatTimeHHMM, getColorClasses } from "@/utils/miscelanea";
import { TimeRecord } from "@/types/employees/time-records";
import { IconLabel } from "@/app/components/custom-labels";
import { Info } from "lucide-react";
import EmployeeLabel from "@/app/components/labels/employee-label";
import Tag from "@/app/components/tag/tag";

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

// Get color name based on verification status
const getVerificationColor = (status: string): string => {
    if (status === "approved") return "green";
    if (status === "rejected") return "red";
    return "yellow"; // default to yellow
};

// Calculate duration in minutes
const getDurationInMinutes = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = Math.max(0, end.getTime() - start.getTime());
    return durationMs / (1000 * 60);
};

// Calculate duration formatted for display
const calculateDuration = (startTime: string, endTime: string) => {
    const minutes = getDurationInMinutes(startTime, endTime);
    return formatTimeToTravel(minutes);
};

// Helper function to check if two dates are the same day
const isSameCalendarDay = (date1: Date, date2: Date): boolean => {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
};

interface TimeRecordPopoverProps {
    timeRecord: TimeRecord & {
        isPartialStart?: boolean;
        isPartialEnd?: boolean;
        showDuration?: boolean;
        displayStartTime?: string;
        displayEndTime?: string;
    };
    /** When provided, shows workable duration (excludes break time) instead of raw duration */
    workableDurationMinutes?: number;
    width: number;
    onViewTimeRecord: (timeRecord: TimeRecord) => void;
    /** Custom render function for actions. Receives the time record and a callback to close the popover */
    renderActions?: (timeRecord: TimeRecord, closePopover: () => void) => ReactNode;
    dayKey: number;
    segmentIndex: number;
    /** Additional className for the trigger div */
    className?: string;
    /** Z-index for stacking when overlapping with other segments */
    zIndex?: number;
    /** When true, adds diagonal stripes to the bar (e.g. for unfolded day row) */
    stripes?: boolean;
    /** Controlled open state (e.g. when whole row is the trigger) */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** When true, show time range (HH:MM - HH:MM) on bar instead of duration */
    showTypeAndTimeOnBar?: boolean;
    /** When true and showTypeAndTimeOnBar, show label (e.g. "Active") above time range. Defaults to false. */
    showTypeLabelOnBar?: boolean;
}

const TimeRecordPopover = ({
    timeRecord,
    workableDurationMinutes,
    width,
    onViewTimeRecord,
    renderActions,
    dayKey,
    segmentIndex,
    className,
    zIndex,
    stripes,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    showTypeAndTimeOnBar,
    showTypeLabelOnBar = false,
}: TimeRecordPopoverProps) => {
    const { t } = useTranslation();
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined && controlledOnOpenChange !== undefined;
    const isOpen = isControlled ? controlledOpen : internalOpen;
    const setIsOpen = isControlled ? controlledOnOpenChange : setInternalOpen;

    const tr = timeRecord;
    const duration = workableDurationMinutes !== undefined
        ? formatTimeToTravel(workableDurationMinutes)
        : calculateDuration(tr.start_time, tr.end_time);
    const colorName = getVerificationColor(tr.verification_status);
    const colorClasses = getColorClasses(colorName);

    // Visual indicator for multi-day records: thick border only on the corner(s) where record crosses day boundary,
    // matching the style of records outside the displayed time range (edge indicators)
    let borderStyle = "";
    const borderColorClass = getBorderColorClass(colorName);
    const hasPartialBorder = tr.isPartialStart || tr.isPartialEnd;
    if (hasPartialBorder) {
        borderStyle += " border-0";
        if (tr.isPartialStart) borderStyle += ` border-l-4 ${borderColorClass}`;
        if (tr.isPartialEnd) borderStyle += ` border-r-4 ${borderColorClass}`;
    }

    const statusText =
        tr.verification_status === "approved"
            ? t("employees.timeRecords.status.approved", "Approved")
            : tr.verification_status === "rejected"
                ? t("employees.timeRecords.status.rejected", "Rejected")
                : t("employees.timeRecords.status.pending", "Pending");

    // Check if multi-day record
    const startDate = new Date(tr.start_time);
    const endDate = new Date(tr.end_time);
    const isMultiDay = !isSameCalendarDay(startDate, endDate);

    // Get day name(s) for display
    const getDayName = (date: Date): string => {
        return date.toLocaleDateString(undefined, { weekday: 'long' });
    };

    const dayDisplay = isMultiDay
        ? `${getDayName(startDate)} - ${getDayName(endDate)}`
        : getDayName(startDate);

    // Get verifier display name
    const verifier = tr.verified_by;

    const handleClick = () => {
        onViewTimeRecord(tr);
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div
                    key={`${dayKey}-segment-${segmentIndex}`}
                    className={cn(
                        "relative rounded-sm cursor-pointer transition-all hover:brightness-110 flex items-center justify-center gap-1 group overflow-hidden min-w-0",
                        colorClasses,
                        hasPartialBorder ? borderStyle : "border",
                        className
                    )}
                    style={{
                        width: `${width}%`,
                        ...(zIndex !== undefined && { zIndex }),
                        ...(stripes && { maskImage: "repeating-linear-gradient(-45deg, transparent, transparent 2px, black 2px, black 4px)", WebkitMaskImage: "repeating-linear-gradient(-45deg, transparent, transparent 2px, black 2px, black 4px)" }),
                    }}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    {/* Segment content */}
                    {width > 5 && (
                        showTypeAndTimeOnBar ? (
                            <div className="flex flex-col items-center justify-center min-w-0 flex-1 overflow-hidden px-0.5">
                                {showTypeLabelOnBar && (
                                    <div className="text-xs font-medium truncate w-full text-center">
                                        {t("employees.timeRecords.active", "Active")}
                                    </div>
                                )}
                                <div className={cn("text-[10px] truncate w-full text-center", showTypeLabelOnBar && "-mt-0.5")}>
                                    {formatTimeHHMM(tr.displayStartTime || tr.start_time)} - {formatTimeHHMM(tr.displayEndTime || tr.end_time)}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-1 min-w-0 flex-1 overflow-hidden px-0.5">
                                {tr.notes && tr.showDuration && (
                                    <Info className="h-3 w-3 shrink-0" />
                                )}
                                <div className="text-xs font-medium truncate">
                                    {tr.showDuration ? duration : ''}
                                </div>
                            </div>
                        )
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80" side="top" align="center">
                <div className="space-y-2">
                    {/* Day name header */}
                    <h4 className="text-sm font-semibold">{dayDisplay}</h4>
                    <div
                        className={cn(
                            "py-1.5 px-2 rounded-md transition-colors cursor-pointer",
                            "hover:bg-accent hover:text-accent-foreground"
                        )}
                        onClick={handleClick}
                    >
                        {/* Title row: Duration with clock icon + Status Tag */}
                        <div className="flex items-center gap-2">
                            <IconLabel
                                icon="clock"
                                text={duration}
                            />
                            <Tag
                                text={statusText}
                                color={colorName}
                                className="capitalize"
                            />
                        </div>
                        {/* Time range row with actions */}
                        <div className="flex items-center justify-between mt-0.5">
                            <span className="text-xs text-muted-foreground">
                                {formatTime(startDate, { useUTC: false })} -{" "}
                                {formatTime(endDate, { useUTC: false })}
                            </span>
                            {renderActions && (
                                <div onClick={(e) => e.stopPropagation()}>
                                    {renderActions(tr, () => setIsOpen(false))}
                                </div>
                            )}
                        </div>
                        {/* Verified by row */}
                        <div className="flex items-center gap-2 mt-2 text-xs">
                            <span className="text-muted-foreground">
                                {t("employees.timeRecords.verifiedBy", "Verified by")}
                            </span>
                            <EmployeeLabel data={verifier} />
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default TimeRecordPopover;
