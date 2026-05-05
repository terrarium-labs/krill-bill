import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2 } from "lucide-react";
import { HourlyRateJobTitle, TimeFrame } from "@/types/general/hourly-rates";
import IdBadge from "@/app/components/id-badge";
import { RATES_COLORS, getColorClasses } from "@/utils/miscelanea";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import CurrencyLabel from "@/app/components/labels/currency-label";

interface HourlyRateJobTitleScheduleCardProps {
    rateJobTitle: HourlyRateJobTitle;
    onAddTimeframe?: (isHoliday: boolean) => void;
    onEditTimeframe?: (timeframe: TimeFrame) => void;
    onDeleteTimeframe?: (timeframe: TimeFrame) => void;
    onEditJobTitle?: () => void;
    onDeleteJobTitle?: () => void;
}

const DAYS_OF_WEEK = [
    { key: 1, label: "Monday", short: "Mon" },
    { key: 2, label: "Tuesday", short: "Tue" },
    { key: 3, label: "Wednesday", short: "Wed" },
    { key: 4, label: "Thursday", short: "Thu" },
    { key: 5, label: "Friday", short: "Fri" },
    { key: 6, label: "Saturday", short: "Sat" },
    { key: 7, label: "Sunday", short: "Sun" },
];

const HourlyRateJobTitleScheduleCard: React.FC<HourlyRateJobTitleScheduleCardProps> = ({
    rateJobTitle,
    onAddTimeframe,
    onEditTimeframe,
    onDeleteTimeframe,
    onEditJobTitle,
    onDeleteJobTitle,
}) => {
    const { t } = useTranslation();
    const [isHoliday, setIsHoliday] = useState(false);

    // Parse time string (HH:MM:SS or HH:MM) to minutes from midnight
    const timeToMinutes = (timeStr: string): number => {
        const [hours, minutes] = timeStr.split(":").map(Number);
        return hours * 60 + minutes;
    };

    // Group timeframes by day, filtered by holiday toggle
    const timeframesByDay = DAYS_OF_WEEK.map((day) => ({
        day,
        timeframes: rateJobTitle.time_frames
            .filter((tf) => tf.day_of_week === day.key)
            .filter((tf) => isHoliday ? (tf.is_holiday === true) : (tf.is_holiday !== true))
            .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time)),
    }));

    // Get filtered timeframes based on holiday toggle
    const filteredTimeframes = rateJobTitle.time_frames.filter((tf) =>
        isHoliday ? (tf.is_holiday === true) : (tf.is_holiday !== true)
    );

    // Get unique timeframe configurations for color assignment
    const getTimeframeColor = (price: number): string => {
        const uniquePrices = Array.from(
            new Set(filteredTimeframes.map((tf) => tf.price))
        ).sort((a, b) => a - b);
        const colorIndex = uniquePrices.indexOf(price) % RATES_COLORS.length;
        return RATES_COLORS[colorIndex];
    };

    // Format time for display
    const formatTime = (timeStr: string): string => {
        return timeStr.substring(0, 5); // Get HH:MM
    };

    // Create consecutive segments for each day
    const getConsecutiveSegments = (timeframes: TimeFrame[]) => {
        const segments: Array<{
            start: number;
            end: number;
            price: number;
            isDefault: boolean;
            timeframe?: TimeFrame;
        }> = [];

        const totalMinutes = 24 * 60; // 1440 minutes in a day

        if (timeframes.length === 0) {
            // No timeframes, entire day is default
            segments.push({
                start: 0,
                end: totalMinutes,
                price: rateJobTitle.default_pvp,
                isDefault: true,
            });
        } else {
            // Sort timeframes by start time
            const sortedTimeframes = [...timeframes].sort(
                (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
            );

            let currentMinute = 0;

            sortedTimeframes.forEach((tf) => {
                const tfStart = timeToMinutes(tf.start_time);
                const tfEnd = timeToMinutes(tf.end_time);

                // Add default segment before this timeframe if there's a gap
                if (currentMinute < tfStart) {
                    segments.push({
                        start: currentMinute,
                        end: tfStart,
                        price: rateJobTitle.default_pvp,
                        isDefault: true,
                    });
                }

                // Add the timeframe segment
                segments.push({
                    start: tfStart,
                    end: tfEnd,
                    price: tf.price,
                    isDefault: false,
                    timeframe: tf,
                });

                currentMinute = tfEnd;
            });

            // Add default segment after the last timeframe if needed
            if (currentMinute < totalMinutes) {
                segments.push({
                    start: currentMinute,
                    end: totalMinutes,
                    price: rateJobTitle.default_pvp,
                    isDefault: true,
                });
            }
        }

        return segments;
    };

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-md font-semibold flex items-center gap-2">
                    {rateJobTitle.job_title.name}
                    <IdBadge id={rateJobTitle.job_title.id} hideIcon={true} />
                </CardTitle>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 mr-2">
                        <Switch
                            id={`holiday-toggle-${rateJobTitle.id}`}
                            checked={isHoliday}
                            onCheckedChange={setIsHoliday}
                        />
                        <label
                            htmlFor={`holiday-toggle-${rateJobTitle.id}`}
                            className="text-sm font-medium cursor-pointer"
                        >
                            {t("hourlyRates.holiday", "Holiday")}
                        </label>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAddTimeframe?.(isHoliday)}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        {t("hourlyRates.addTimeframe", "Add Timeframe")}
                    </Button>
                    <CustomActionsDropdown
                        items={[
                            {
                                label: t("common.edit", "Edit"),
                                icon: "edit",
                                onClick: onEditJobTitle!,
                            },
                            {
                                label: t("common.delete", "Delete"),
                                icon: "trash-2",
                                onClick: onDeleteJobTitle!,
                                variant: "destructive",
                            },
                        ]}
                    />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {timeframesByDay.map(({ day, timeframes }) => {
                        const segments = getConsecutiveSegments(timeframes);
                        const totalMinutes = 24 * 60;

                        return (
                            <div key={day.key} className="flex items-center gap-3">
                                {/* Day label */}
                                <div className="w-16 text-sm font-medium text-muted-foreground">
                                    {day.short}
                                </div>

                                {/* Time labels */}
                                <div className="w-20 text-xs text-muted-foreground text-left">
                                    00:00
                                </div>

                                {/* Timeline container with consecutive segments */}
                                <div className="flex-1 relative h-8 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="flex h-full">
                                        {segments.map((segment, index) => {
                                            const width = ((segment.end - segment.start) / totalMinutes) * 100;
                                            const colorName = segment.isDefault
                                                ? null
                                                : getTimeframeColor(segment.price);
                                            const colorClasses = segment.isDefault
                                                ? getColorClasses("gray")
                                                : getColorClasses(colorName!);

                                            const segmentContent = (
                                                <div
                                                    key={`${day.key}-segment-${index}`}
                                                    className={`relative ${colorClasses} cursor-pointer transition-all hover:brightness-110 flex items-center justify-center group ${index < segments.length - 1
                                                        ? "border-r border-gray-300 dark:border-gray-600"
                                                        : ""
                                                        }`}
                                                    style={{ width: `${width}%` }}
                                                >
                                                    {/* Segment content */}
                                                    <CurrencyLabel data={segment.price} className="text-xs font-medium px-1 truncate" />
                                                </div>
                                            );

                                            // Wrap default segments with HoverCard showing job title info
                                            if (segment.isDefault) {
                                                return (
                                                    <HoverCard key={`${day.key}-segment-${index}`} openDelay={200}>
                                                        <HoverCardTrigger asChild>
                                                            {segmentContent}
                                                        </HoverCardTrigger>
                                                        <HoverCardContent className="w-64" side="top">
                                                            <div className="space-y-3">
                                                                <div className="space-y-2">
                                                                    <div className="text-sm font-semibold">
                                                                        {rateJobTitle.job_title.name}
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <div className="flex justify-between items-center text-sm">
                                                                            <span className="text-muted-foreground">{t("hourlyRates.defaultPrice", "Default Price")}</span>
                                                                            <span className="font-semibold">
                                                                                <CurrencyLabel data={rateJobTitle.default_pvp} />
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center text-sm">
                                                                            <span className="text-muted-foreground">{t("hourlyRates.minQuantity", "Min quantity")}</span>
                                                                            <span>{rateJobTitle.min_quantity} min</span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center text-sm">
                                                                            <span className="text-muted-foreground">{t("hourlyRates.stepQuantity", "Step quantity")}</span>
                                                                            <span>{rateJobTitle.step_quantity} min</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="flex-1"
                                                                        onClick={onEditJobTitle}
                                                                    >
                                                                        <Edit className="h-3 w-3 mr-1" />
                                                                        {t("common.edit", "Edit")}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </HoverCardContent>
                                                    </HoverCard>
                                                );
                                            }

                                            // Wrap non-default segments with HoverCard showing timeframe info
                                            if (segment.timeframe) {
                                                return (
                                                    <HoverCard key={`${day.key}-segment-${index}`} openDelay={200}>
                                                        <HoverCardTrigger asChild>
                                                            {segmentContent}
                                                        </HoverCardTrigger>
                                                        <HoverCardContent className="w-64" side="top">
                                                            <div className="space-y-3">
                                                                <div className="space-y-2">
                                                                    <div className="text-sm font-medium">
                                                                        {formatTime(segment.timeframe.start_time)} - {formatTime(segment.timeframe.end_time)}
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <div className="flex justify-between items-center text-sm">
                                                                            <span className="text-muted-foreground">{t("hourlyRates.price", "Price")}</span>
                                                                            <span className="font-semibold">
                                                                                <CurrencyLabel data={segment.timeframe.price} />
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center text-sm">
                                                                            <span className="text-muted-foreground">{t("hourlyRates.minQuantity", "Min quantity")}</span>
                                                                            <span>{segment.timeframe.min_quantity} min</span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center text-sm">
                                                                            <span className="text-muted-foreground">{t("hourlyRates.stepQuantity", "Step quantity")}</span>
                                                                            <span>{segment.timeframe.step_quantity} min</span>
                                                                        </div>
                                                                        {segment.timeframe.is_holiday && (
                                                                            <div className="flex justify-between items-center text-sm">
                                                                                <span className="text-muted-foreground">{t("hourlyRates.holiday", "Holiday")}</span>
                                                                                <span>{t("common.yes", "Yes")}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="flex-1"
                                                                        onClick={() => onEditTimeframe?.(segment.timeframe!)}
                                                                    >
                                                                        <Edit className="h-3 w-3 mr-1" />
                                                                        {t("common.edit", "Edit")}
                                                                    </Button>
                                                                    <Button
                                                                        variant="destructive"
                                                                        size="sm"
                                                                        className="flex-1"
                                                                        onClick={() => onDeleteTimeframe?.(segment.timeframe!)}
                                                                    >
                                                                        <Trash2 className="h-3 w-3 mr-1" />
                                                                        {t("common.delete", "Delete")}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </HoverCardContent>
                                                    </HoverCard>
                                                );
                                            }

                                            return segmentContent;
                                        })}
                                    </div>
                                </div>

                                {/* End time label */}
                                <div className="w-20 text-xs text-muted-foreground text-right">
                                    23:59
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                {filteredTimeframes.length > 0 && (
                    <div className="mt-6 pt-4 border-t">
                        <div className="text-sm font-medium mb-2">
                            {t("hourlyRates.priceRanges", "Price Ranges")}
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {Array.from(new Set(filteredTimeframes.map((tf) => tf.price)))
                                .sort((a, b) => a - b)
                                .map((price) => {
                                    const colorName = getTimeframeColor(price);
                                    const colorClasses = getColorClasses(colorName);
                                    return (
                                        <div key={price} className="flex items-center gap-2">
                                            <div
                                                className={`w-4 h-4 rounded border ${colorClasses}`}
                                            />
                                            <span className="text-sm"><CurrencyLabel data={price} /></span>
                                        </div>
                                    );
                                })}
                            <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded ${getColorClasses("gray")}`} />
                                <span className="text-sm">
                                    <CurrencyLabel data={rateJobTitle.default_pvp} /> {t("hourlyRates.default", "(default)")}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default HourlyRateJobTitleScheduleCard;

