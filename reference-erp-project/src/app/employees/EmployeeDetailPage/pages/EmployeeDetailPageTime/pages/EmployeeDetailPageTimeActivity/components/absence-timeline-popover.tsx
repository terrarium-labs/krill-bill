import { useState, ReactNode } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { formatTime, formatTimeToTravel, formatTimeHHMM, getColorClasses } from "@/utils/miscelanea";
import { Absence } from "@/types/employees/absences";
import Tag from "@/app/components/tag/tag";

const isSameCalendarDay = (date1: Date, date2: Date): boolean =>
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();

const getDayName = (date: Date): string =>
    date.toLocaleDateString(undefined, { weekday: "long" });

interface AbsenceTimelinePopoverProps {
    absence: Absence;
    width: number;
    leftPercent: number;
    durationMinutes: number;
    onViewAbsence: (absence: Absence) => void;
    /** Custom render function for actions. Receives the absence and a callback to close the popover */
    renderActions?: (absence: Absence, closePopover: () => void) => ReactNode;
    dayKey: number;
    segmentIndex: number;
    /** Override bar color (e.g. "blue" for time records). Tag still uses absence type color. */
    colorOverride?: string;
    /** When true, adds diagonal stripes to the bar (e.g. for unfolded day row) */
    stripes?: boolean;
    /** When true, displays duration on the bar (e.g. folded day row or unfolded individual row) */
    showDurationOnBar?: boolean;
    /** When true, show "Absence" + time range (HH:MM - HH:MM) on bar instead of duration */
    showTypeAndTimeOnBar?: boolean;
}

const AbsenceTimelinePopover = ({
    absence,
    width,
    leftPercent,
    durationMinutes,
    onViewAbsence,
    renderActions,
    dayKey,
    segmentIndex,
    colorOverride,
    stripes,
    showDurationOnBar,
    showTypeAndTimeOnBar,
}: AbsenceTimelinePopoverProps) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const color = absence.absence_type?.color ?? "gray";
    const colorClasses = getColorClasses(colorOverride ?? color);

    const startDate = new Date(absence.start_date);
    const endDate = new Date(absence.end_date);
    const durationStr = formatTimeToTravel(durationMinutes);

    const handleClick = () => {
        onViewAbsence(absence);
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div
                    key={`absence-${dayKey}-${absence.id}-${segmentIndex}`}
                    className={cn(
                        "absolute rounded-sm cursor-pointer transition-all hover:brightness-110 border z-10 overflow-hidden min-w-0",
                        (showDurationOnBar || showTypeAndTimeOnBar) && "flex items-center justify-center",
                        colorClasses
                    )}
                    style={{
                        left: `${leftPercent}%`,
                        width: `${width}%`,
                        height: "100%",
                        ...(stripes && { maskImage: "repeating-linear-gradient(-45deg, transparent, transparent 2px, black 2px, black 4px)", WebkitMaskImage: "repeating-linear-gradient(-45deg, transparent, transparent 2px, black 2px, black 4px)" }),
                    }}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    title={absence.absence_type?.name}
                >
                    {width > 5 && (
                        showTypeAndTimeOnBar ? (
                            <div className="flex flex-col items-center justify-center min-w-0 flex-1 overflow-hidden px-0.5">
                                <div className="text-xs font-medium truncate w-full text-center">
                                    {t("absences.absence", "Absence")}
                                </div>
                                <div className="text-[10px] truncate -mt-0.5 w-full text-center">
                                    {formatTimeHHMM(startDate)} - {formatTimeHHMM(endDate)}
                                </div>
                            </div>
                        ) : showDurationOnBar ? (
                            <div className="text-xs font-medium truncate min-w-0 flex-1 overflow-hidden px-0.5">{durationStr}</div>
                        ) : null
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80" side="top" align="center">
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold">
                        {!isSameCalendarDay(startDate, endDate)
                            ? `${getDayName(startDate)} - ${getDayName(endDate)}`
                            : getDayName(startDate)}
                    </h4>
                    <div
                        className={cn(
                            "py-1.5 px-2 rounded-md transition-colors cursor-pointer",
                            "hover:bg-accent hover:text-accent-foreground"
                        )}
                        onClick={handleClick}
                    >
                        <div className="flex items-center gap-2">
                            <Tag
                                text={absence.absence_type?.name ?? "Absence"}
                                color={color}
                            />
                            <span className="text-xs text-muted-foreground">
                                {formatTime(startDate, { useUTC: false })} -{" "}
                                {formatTime(endDate, { useUTC: false })}
                            </span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                            <span className="text-xs text-muted-foreground">
                                {t("employees.timeRecords.duration", "Duration")}: {durationStr}
                            </span>
                            {renderActions && (
                                <div onClick={(e) => e.stopPropagation()}>
                                    {renderActions(absence, () => setIsOpen(false))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default AbsenceTimelinePopover;
