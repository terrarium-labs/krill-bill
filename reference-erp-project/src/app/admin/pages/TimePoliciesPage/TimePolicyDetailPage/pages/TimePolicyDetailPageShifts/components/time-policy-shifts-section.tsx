import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2 } from "lucide-react";
import { TimePolicyType, TimeSlot, TimeSlotRange } from "@/types/general/time-policies";
import { cn } from "@/lib/utils";
import { RATES_COLORS, formatDateRange, getColorClasses } from "@/utils/miscelanea";

const DAYS_OF_WEEK = [
    { key: 1, label: "Monday", short: "Mon" },
    { key: 2, label: "Tuesday", short: "Tue" },
    { key: 3, label: "Wednesday", short: "Wed" },
    { key: 4, label: "Thursday", short: "Thu" },
    { key: 5, label: "Friday", short: "Fri" },
    { key: 6, label: "Saturday", short: "Sat" },
    { key: 7, label: "Sunday", short: "Sun" },
];

export type ShiftsSectionShiftView = "default" | "on_call" | "special";

function sortTimeSlotRanges(ranges: TimeSlotRange[]): TimeSlotRange[] {
    const order: Record<TimePolicyType, number> = {
        default: 0,
        on_call: 1,
        special: 2,
    };
    return [...ranges].sort((a, b) => {
        const ta = order[a.type] ?? 99;
        const tb = order[b.type] ?? 99;
        if (ta !== tb) return ta - tb;
        return new Date(a.from_date).getTime() - new Date(b.from_date).getTime();
    });
}

interface TimePolicyShiftsRangeBlockProps {
    /**
     * `default` and `on_call` always show all seven weekday rows (empty days included).
     * `special` only shows rows that have at least one slot (after holiday filter).
     */
    rangeType: TimePolicyType;
    /** Shown above the grid for special ranges only (date span). */
    rangeSubtitle?: string;
    /** Stronger header + spacing when each special range sits in its own panel. */
    specialRangeSection?: boolean;
    timeSlots: TimeSlot[];
    isHoliday: boolean;
    onEditTimeSlot?: (timeSlot: TimeSlot) => void;
    onDeleteTimeSlot?: (timeSlot: TimeSlot) => void;
}

const TimePolicyShiftsRangeBlock: React.FC<TimePolicyShiftsRangeBlockProps> = ({
    rangeType,
    rangeSubtitle,
    specialRangeSection,
    timeSlots,
    isHoliday,
    onEditTimeSlot,
    onDeleteTimeSlot,
}) => {
    const { t } = useTranslation();

    const timeToMinutes = (timeStr: string): number => {
        if (timeStr.includes("T")) {
            const d = new Date(timeStr);
            if (!Number.isNaN(d.getTime())) {
                return d.getHours() * 60 + d.getMinutes();
            }
        }
        const [hours, minutes] = timeStr.split(":").map(Number);
        return (hours ?? 0) * 60 + (minutes ?? 0);
    };

    const timeSlotsByDayFull = DAYS_OF_WEEK.map((day) => ({
        day,
        slots: timeSlots
            .filter((slot) => slot.day_of_week === day.key)
            .filter((slot) => (isHoliday ? slot.is_holiday === true : slot.is_holiday !== true))
            .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time)),
    }));

    const showFullWeekLikeDefault = rangeType === "default" || rangeType === "on_call";

    const timeSlotsByDay = showFullWeekLikeDefault
        ? timeSlotsByDayFull
        : timeSlotsByDayFull.filter(({ slots }) => slots.length > 0);

    const filteredTimeSlots = timeSlots.filter((slot) =>
        isHoliday ? slot.is_holiday === true : slot.is_holiday !== true
    );

    const getTimeSlotColor = (slotName: string): string => {
        const uniqueSlotNames = Array.from(new Set(filteredTimeSlots.map((slot) => slot.name))).sort();
        const colorIndex = uniqueSlotNames.indexOf(slotName) % RATES_COLORS.length;
        return RATES_COLORS[colorIndex];
    };

    const formatTime = (timeStr: string): string => {
        if (!timeStr) return "";
        if (timeStr.includes("T")) {
            const d = new Date(timeStr);
            if (!Number.isNaN(d.getTime())) {
                const h = String(d.getHours()).padStart(2, "0");
                const m = String(d.getMinutes()).padStart(2, "0");
                return `${h}:${m}`;
            }
        }
        return timeStr.substring(0, 5);
    };

    const formatDuration = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0 && mins > 0) {
            return `${hours}h ${mins}min`;
        } else if (hours > 0) {
            return `${hours}h`;
        } else {
            return `${mins}min`;
        }
    };

    const getConsecutiveSegments = (slots: TimeSlot[]) => {
        const segments: Array<{
            start: number;
            end: number;
            isDefault: boolean;
            timeSlot?: TimeSlot;
        }> = [];

        const totalMinutes = 24 * 60;

        if (slots.length === 0) {
            segments.push({
                start: 0,
                end: totalMinutes,
                isDefault: true,
            });
        } else {
            const sortedSlots = [...slots].sort(
                (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
            );

            let currentMinute = 0;

            sortedSlots.forEach((slot) => {
                const slotStart = timeToMinutes(slot.start_time);
                const slotEnd = timeToMinutes(slot.end_time);

                if (currentMinute < slotStart) {
                    segments.push({
                        start: currentMinute,
                        end: slotStart,
                        isDefault: true,
                    });
                }

                segments.push({
                    start: slotStart,
                    end: slotEnd,
                    isDefault: false,
                    timeSlot: slot,
                });

                currentMinute = slotEnd;
            });

            if (currentMinute < totalMinutes) {
                segments.push({
                    start: currentMinute,
                    end: totalMinutes,
                    isDefault: true,
                });
            }
        }

        return segments;
    };

    return (
        <div className="w-full space-y-3">
            {rangeSubtitle ? (
                <p
                    className={
                        specialRangeSection
                            ? "text-base font-semibold text-foreground"
                            : "text-sm font-medium text-muted-foreground"
                    }
                >
                    {rangeSubtitle}
                </p>
            ) : null}
            <div>
                <div className="space-y-2">
                    {timeSlotsByDay.map(({ day, slots }) => {
                        const segments = getConsecutiveSegments(slots);
                        const totalMinutes = 24 * 60;

                        return (
                            <div key={day.key} className="flex items-center gap-3">
                                <div className="w-16 text-sm font-medium text-muted-foreground">
                                    {day.short}
                                </div>

                                <div className="w-20 text-xs text-muted-foreground text-left">
                                    00:00
                                </div>

                                <div className="flex-1 relative h-8 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="flex h-full">
                                        {segments.map((segment, index) => {
                                            const width = ((segment.end - segment.start) / totalMinutes) * 100;
                                            const colorName = segment.isDefault
                                                ? null
                                                : getTimeSlotColor(segment.timeSlot!.name);
                                            const colorClasses = segment.isDefault
                                                ? getColorClasses("gray")
                                                : getColorClasses(colorName!);

                                            const segmentContent = (
                                                <div
                                                    className={`relative ${colorClasses} cursor-pointer transition-all hover:brightness-110 flex items-center justify-center group ${index < segments.length - 1
                                                        ? "border-r border-gray-300 dark:border-gray-600"
                                                        : ""
                                                        }`}
                                                    style={{ width: `${width}%` }}
                                                >
                                                    {segment.isDefault ? (
                                                        <div className="text-xs font-medium truncate">
                                                            -
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center">
                                                            <div className="text-xs font-medium truncate">
                                                                {segment.timeSlot?.name}
                                                            </div>
                                                            <div className="text-[10px] truncate -mt-0.5">
                                                                {formatTime(segment.timeSlot!.start_time)} -{" "}
                                                                {formatTime(segment.timeSlot!.end_time)}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );

                                            if (segment.isDefault) {
                                                return (
                                                    <HoverCard key={`${day.key}-segment-${index}`} openDelay={200}>
                                                        <HoverCardTrigger asChild>
                                                            {segmentContent}
                                                        </HoverCardTrigger>
                                                        <HoverCardContent className="w-64" side="top">
                                                            <div className="space-y-2">
                                                                <div className="text-sm font-semibold">
                                                                    {t("timePolicies.shifts.unscheduled", "Unscheduled Time")}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {t(
                                                                        "timePolicies.shifts.unscheduledDescription",
                                                                        "This time period has no scheduled shift."
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </HoverCardContent>
                                                    </HoverCard>
                                                );
                                            }

                                            if (segment.timeSlot) {
                                                return (
                                                    <HoverCard key={`${day.key}-segment-${index}`} openDelay={200}>
                                                        <HoverCardTrigger asChild>
                                                            {segmentContent}
                                                        </HoverCardTrigger>
                                                        <HoverCardContent className="w-64" side="top">
                                                            <div className="space-y-3">
                                                                <div className="space-y-2">
                                                                    <div className="text-sm font-semibold">
                                                                        {segment.timeSlot.name}
                                                                    </div>
                                                                    <div className="text-sm font-medium text-muted-foreground">
                                                                        {formatTime(segment.timeSlot.start_time)} -{" "}
                                                                        {formatTime(segment.timeSlot.end_time)}
                                                                    </div>
                                                                    {segment.timeSlot.description && (
                                                                        <div className="text-sm text-muted-foreground">
                                                                            {segment.timeSlot.description}
                                                                        </div>
                                                                    )}
                                                                    <div className="space-y-1">
                                                                        <div className="flex justify-between items-center text-sm">
                                                                            <span className="text-muted-foreground">
                                                                                {t("timePolicies.shifts.breakTime", "Break Time")}
                                                                            </span>
                                                                            <span className="font-semibold">
                                                                                {formatDuration(segment.timeSlot.break_time_duration)}
                                                                            </span>
                                                                        </div>
                                                                        {segment.timeSlot.is_holiday && (
                                                                            <div className="flex justify-between items-center text-sm">
                                                                                <span className="text-muted-foreground">
                                                                                    {t("timePolicies.holiday", "Holiday")}
                                                                                </span>
                                                                                <span>{t("common.yes", "Yes")}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {(onEditTimeSlot || onDeleteTimeSlot) && (
                                                                    <div className="flex gap-2">
                                                                        {onEditTimeSlot && (
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                className="flex-1"
                                                                                onClick={() => onEditTimeSlot(segment.timeSlot!)}
                                                                            >
                                                                                <Edit className="h-3 w-3 mr-1" />
                                                                                {t("common.edit", "Edit")}
                                                                            </Button>
                                                                        )}
                                                                        {onDeleteTimeSlot && (
                                                                            <Button
                                                                                variant="destructive"
                                                                                size="sm"
                                                                                className="flex-1"
                                                                                onClick={() => onDeleteTimeSlot(segment.timeSlot!)}
                                                                            >
                                                                                <Trash2 className="h-3 w-3 mr-1" />
                                                                                {t("common.delete", "Delete")}
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </HoverCardContent>
                                                    </HoverCard>
                                                );
                                            }

                                            return segmentContent;
                                        })}
                                    </div>
                                </div>

                                <div className="w-20 text-xs text-muted-foreground text-right">
                                    23:59
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredTimeSlots.length > 0 && (
                    <div className="mt-8">
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            {Array.from(new Map(filteredTimeSlots.map((slot) => [slot.name, slot])).values())
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map((slot) => {
                                    const colorName = getTimeSlotColor(slot.name);
                                    const colorClasses = getColorClasses(colorName);
                                    return (
                                        <div key={slot.name} className="flex items-center gap-2">
                                            <div className={`w-4 h-4 rounded border ${colorClasses}`} />
                                            <span className="text-sm">{slot.name}</span>
                                        </div>
                                    );
                                })}
                            <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded ${getColorClasses("gray")}`} />
                                <span className="text-sm">
                                    {t("timePolicies.shifts.unscheduled", "Unscheduled")}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export interface TimePolicyShiftsSectionProps {
    shiftView: ShiftsSectionShiftView;
    timeSlotRanges: TimeSlotRange[];
    emptyMessage: string;
    onAddTimeSlot?: (isHoliday: boolean) => void;
    onEditTimeSlot?: (timeSlot: TimeSlot) => void;
    onDeleteTimeSlot?: (timeSlot: TimeSlot) => void;
}

const TimePolicyShiftsSection: React.FC<TimePolicyShiftsSectionProps> = ({
    shiftView,
    timeSlotRanges,
    emptyMessage,
    onAddTimeSlot,
    onEditTimeSlot,
    onDeleteTimeSlot,
}) => {
    const { t } = useTranslation();
    const [isHoliday, setIsHoliday] = useState(false);

    const sortedRanges = useMemo(() => sortTimeSlotRanges(timeSlotRanges ?? []), [timeSlotRanges]);

    /** Special shifts never use holiday slots; toggle is hidden and filtering stays on weekdays. */
    const effectiveHolidayFilter = shiftView === "special" ? false : isHoliday;

    const sectionTitle = useMemo(() => {
        const kind =
            shiftView === "default"
                ? t("timePolicies.shifts.scheduledKindDefault", "Default")
                : shiftView === "on_call"
                  ? t("timePolicies.shifts.scheduledKindOnCall", "On call")
                  : t("timePolicies.shifts.scheduledKindSpecial", "Special");
        return t("timePolicies.shifts.scheduledSectionTitle", "Scheduled {{kind}} shifts", { kind });
    }, [shiftView, t]);

    return (
        <div className="flex flex-col gap-6">

            <div className="flex flex-row flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold leading-snug sm:text-xl">{sectionTitle}</h2>
                <div className="flex flex-wrap items-center justify-end gap-2">
                    {(shiftView === "default" || shiftView === "on_call") && (
                        <div className="flex items-center gap-2 mr-2">
                            <Switch id="shifts-section-holiday" checked={isHoliday} onCheckedChange={setIsHoliday} />
                            <label htmlFor="shifts-section-holiday" className="text-sm font-medium cursor-pointer">
                                {t("timePolicies.holiday", "Holiday")}
                            </label>
                        </div>
                    )}
                    {onAddTimeSlot && (
                        <Button
                            type="button"
                            onClick={() => onAddTimeSlot(shiftView === "special" ? false : isHoliday)}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            {t("timePolicies.shifts.add", "Add Shift")}
                        </Button>
                    )}
                </div>
            </div>

            {sortedRanges.length === 0 ? (
                shiftView === "special" ? (
                    <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                ) : (
                    <div className="flex flex-col gap-6">
                        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                        <div className="min-w-0">
                            <TimePolicyShiftsRangeBlock
                                rangeType={shiftView === "default" ? "default" : "on_call"}
                                specialRangeSection={false}
                                timeSlots={[]}
                                isHoliday={effectiveHolidayFilter}
                                onEditTimeSlot={onEditTimeSlot}
                                onDeleteTimeSlot={onDeleteTimeSlot}
                            />
                        </div>
                    </div>
                )
            ) : (
                <div className="flex flex-col">
                    {sortedRanges.map((range, idx) => {
                        const rangeKey = `${range.type}-${range.from_date}-${range.to_date}-${idx}`;
                        const rangeSubtitle =
                            range.type === "special"
                                ? formatDateRange(range.from_date, range.to_date, { dateOnly: true })
                                : undefined;
                        return (
                            <div
                                key={rangeKey}
                                className={cn(
                                    "min-w-0",
                                    idx > 0 && "border-t border-border pt-10 mt-10",
                                )}
                            >
                                <TimePolicyShiftsRangeBlock
                                    rangeType={range.type}
                                    rangeSubtitle={rangeSubtitle}
                                    specialRangeSection={shiftView === "special"}
                                    timeSlots={range.time_slots ?? []}
                                    isHoliday={effectiveHolidayFilter}
                                    onEditTimeSlot={onEditTimeSlot}
                                    onDeleteTimeSlot={onDeleteTimeSlot}
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TimePolicyShiftsSection;
