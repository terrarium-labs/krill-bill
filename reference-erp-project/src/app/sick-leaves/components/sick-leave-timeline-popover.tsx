import { useState, ReactNode } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslation } from "@/hooks/useTranslation";
import { formatTime, formatTimeToTravel, formatTimeHHMM, getColorClasses } from "@/utils/miscelanea";
import { SickLeave } from "@/types/employees/sick-leaves";
import { cn } from "@/lib/utils";
import Tag from "@/app/components/tag/tag";

const isSameCalendarDay = (date1: Date, date2: Date): boolean =>
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();

const getDayName = (date: Date): string =>
    date.toLocaleDateString(undefined, { weekday: "long" });

interface SickLeaveTimelinePopoverProps {
    sickLeave: SickLeave;
    width: number;
    leftPercent: number;
    durationMinutes: number;
    onViewSickLeave: (sickLeave: SickLeave) => void;
    /** Custom render function for actions. Receives the sick leave and a callback to close the popover */
    renderActions?: (sickLeave: SickLeave, closePopover: () => void) => ReactNode;
    dayKey: number;
    segmentIndex: number;
    /** When true, adds diagonal stripes to the bar (e.g. for unfolded day row) */
    stripes?: boolean;
    /** When true, displays duration on the bar (e.g. folded day row or unfolded individual row) */
    showDurationOnBar?: boolean;
    /** When true, show "Sick Leave" + time range (HH:MM - HH:MM) on bar instead of duration */
    showTypeAndTimeOnBar?: boolean;
}

const SickLeaveTimelinePopover = ({
    sickLeave,
    width,
    leftPercent,
    durationMinutes,
    onViewSickLeave,
    renderActions,
    dayKey,
    segmentIndex,
    stripes,
    showDurationOnBar,
    showTypeAndTimeOnBar,
}: SickLeaveTimelinePopoverProps) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const colorClasses = getColorClasses("blue");

    const startDate = new Date(sickLeave.start_date);
    const endDate = new Date(sickLeave.end_date);
    const durationStr = formatTimeToTravel(durationMinutes);

    const handleClick = () => {
        onViewSickLeave(sickLeave);
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div
                    key={`sickleave-${dayKey}-${sickLeave.id}-${segmentIndex}`}
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
                    title={sickLeave.name || t("sickLeaves.title", "Sick Leave")}
                >
                    {width > 5 && (
                        showTypeAndTimeOnBar ? (
                            <div className="flex flex-col items-center justify-center min-w-0 flex-1 overflow-hidden px-0.5">
                                <div className="text-xs font-medium truncate w-full text-center">
                                    {t("sickLeaves.title", "Sick Leave")}
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
                                text={t("sickLeaves.title", "Sick Leave")}
                                color="blue"
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
                                    {renderActions(sickLeave, () => setIsOpen(false))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default SickLeaveTimelinePopover;
