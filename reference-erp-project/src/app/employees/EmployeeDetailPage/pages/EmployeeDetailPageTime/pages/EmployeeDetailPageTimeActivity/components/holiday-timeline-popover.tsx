import { useState } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslation } from "@/hooks/useTranslation";
import { Holiday } from "@/types/general/holidays";
import { formatTimeToTravel, getColorClasses } from "@/utils/miscelanea";
import { cn } from "@/lib/utils";
import Tag from "@/app/components/tag/tag";

interface HolidayTimelinePopoverProps {
    holidays: Holiday[];
    dayKey: number;
    /** Optional suffix for unique key when multiple popovers exist per day (e.g. expanded rows) */
    keySuffix?: string;
    /** When true, adds diagonal stripes to the bar (e.g. for unfolded day row) */
    stripes?: boolean;
    /** Duration in minutes (e.g. total day minutes for full-day holiday). Used when showDurationOnBar is true */
    durationMinutes?: number;
    /** When true, displays duration on the bar (e.g. folded day row or unfolded individual row) */
    showDurationOnBar?: boolean;
    /** When true, show "Holiday" + holiday name(s) on bar instead of duration */
    showTypeAndTimeOnBar?: boolean;
}

const HolidayTimelinePopover = ({ holidays, dayKey, keySuffix, stripes, durationMinutes = 0, showDurationOnBar, showTypeAndTimeOnBar }: HolidayTimelinePopoverProps) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const colorClasses = getColorClasses("blue");

    if (holidays.length === 0) return null;

    const durationStr = showDurationOnBar ? formatTimeToTravel(durationMinutes) : "";

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div
                    key={`holiday-${dayKey}${keySuffix ?? ""}`}
                    className={cn(
                        "absolute inset-0 rounded-sm cursor-pointer transition-all hover:brightness-110 border z-10 overflow-hidden min-w-0",
                        (showDurationOnBar || showTypeAndTimeOnBar) && "flex items-center justify-center",
                        colorClasses
                    )}
                    style={stripes ? { maskImage: "repeating-linear-gradient(-45deg, transparent, transparent 2px, black 2px, black 4px)", WebkitMaskImage: "repeating-linear-gradient(-45deg, transparent, transparent 2px, black 2px, black 4px)" } : undefined}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    title={holidays.map((h) => h.name).join(", ")}
                >
                    {showTypeAndTimeOnBar ? (
                        <div className="flex flex-col items-center justify-center min-w-0 flex-1 overflow-hidden px-0.5">
                            <div className="text-xs font-medium truncate w-full text-center">
                                {t("workplaces.holidays", "Holiday")}
                            </div>
                            <div className="text-[10px] truncate -mt-0.5 w-full text-center">
                                {holidays.map((h) => h.name).join(", ")}
                            </div>
                        </div>
                    ) : showDurationOnBar && durationStr ? (
                        <div className="text-xs font-medium truncate">{durationStr}</div>
                    ) : null}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80" side="top" align="center">
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold">
                        {new Date(holidays[0].holiday_date + "T12:00:00Z").toLocaleDateString(undefined, { weekday: "long" })}
                    </h4>
                    <div className="space-y-1.5">
                        {holidays.map((holiday) => (
                            <div
                                key={holiday.id}
                                className="flex flex-col gap-0.5 py-1.5 px-2 rounded-md"
                            >
                                <div className="flex items-center gap-2">
                                    <Tag
                                        text={t("workplaces.holidays", "Holiday")}
                                        color="blue"
                                    />
                                    <span className="text-sm font-medium">
                                        {holiday.name}
                                    </span>
                                </div>
                                {holiday.description && (
                                    <p className="text-xs text-muted-foreground pl-0">
                                        {holiday.description}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default HolidayTimelinePopover;
