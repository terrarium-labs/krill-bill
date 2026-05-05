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
import { OvertimeRule } from "@/types/general/time-policies";
import { RATES_COLORS, getColorClasses } from "@/utils/miscelanea";
import { useTimePolicy } from "../../../../context/TimePolicyContext";

interface TimePolicyOvertimeRulesSectionProps {
    overtimeRules: OvertimeRule[];
    onAddOvertimeRule?: (isHoliday: boolean) => void;
    onEditOvertimeRule?: (overtimeRule: OvertimeRule) => void;
    onDeleteOvertimeRule?: (overtimeRule: OvertimeRule) => void;
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

const TimePolicyOvertimeRulesSection: React.FC<TimePolicyOvertimeRulesSectionProps> = ({
    overtimeRules,
    onAddOvertimeRule,
    onEditOvertimeRule,
    onDeleteOvertimeRule,
}) => {
    const { t } = useTranslation();
    const [isHoliday, setIsHoliday] = useState(false);
    const { timePolicy } = useTimePolicy();

    // Parse time string (HH:MM:SS or HH:MM) to minutes from midnight
    const timeToMinutes = (timeStr: string): number => {
        const [hours, minutes] = timeStr.split(":").map(Number);
        return hours * 60 + minutes;
    };

    // Group overtime rules by day, filtered by holiday toggle
    const overtimeRulesByDay = DAYS_OF_WEEK.map((day) => ({
        day,
        rules: overtimeRules
            .filter((rule) => rule.day_of_week === day.key)
            .filter((rule) => isHoliday ? (rule.is_holiday === true) : (rule.is_holiday !== true))
            .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time)),
    }));

    // Get filtered overtime rules based on holiday toggle
    const filteredOvertimeRules = overtimeRules.filter((rule) =>
        isHoliday ? (rule.is_holiday === true) : (rule.is_holiday !== true)
    );

    // Get unique rule configurations for color assignment
    const getOvertimeRuleColor = (ruleName: string): string => {
        const uniqueRuleNames = Array.from(
            new Set(filteredOvertimeRules.map((rule) => rule.name))
        ).sort();
        const colorIndex = uniqueRuleNames.indexOf(ruleName) % RATES_COLORS.length;
        return RATES_COLORS[colorIndex];
    };

    // Format time for display
    const formatTime = (timeStr: string): string => {
        return timeStr.substring(0, 5); // Get HH:MM
    };

    // Create consecutive segments for each day
    const getConsecutiveSegments = (rules: OvertimeRule[]) => {
        const segments: Array<{
            start: number;
            end: number;
            isDefault: boolean;
            overtimeRule?: OvertimeRule;
        }> = [];

        const totalMinutes = 24 * 60; // 1440 minutes in a day

        if (rules.length === 0) {
            // No rules, entire day is without overtime
            segments.push({
                start: 0,
                end: totalMinutes,
                isDefault: true,
            });
        } else {
            // Sort rules by start time
            const sortedRules = [...rules].sort(
                (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
            );

            let currentMinute = 0;

            sortedRules.forEach((rule) => {
                const ruleStart = timeToMinutes(rule.start_time);
                const ruleEnd = timeToMinutes(rule.end_time);

                // Add no-overtime segment before this rule if there's a gap
                if (currentMinute < ruleStart) {
                    segments.push({
                        start: currentMinute,
                        end: ruleStart,
                        isDefault: true,
                    });
                }

                // Add the rule segment
                segments.push({
                    start: ruleStart,
                    end: ruleEnd,
                    isDefault: false,
                    overtimeRule: rule,
                });

                currentMinute = ruleEnd;
            });

            // Add no-overtime segment after the last rule if needed
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
        <Card className="w-full border-none shadow-none p-0 m-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 m-0">
                <CardTitle className="text-md font-semibold flex items-center gap-2">
                    {t("timePolicies.overtimeRules.schedule", "Overtime Rules Schedule")}
                </CardTitle>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 mr-2">
                        <Switch
                            id="holiday-toggle"
                            checked={isHoliday}
                            onCheckedChange={setIsHoliday}
                        />
                        <label
                            htmlFor="holiday-toggle"
                            className="text-sm font-medium cursor-pointer"
                        >
                            {t("timePolicies.holiday", "Holiday")}
                        </label>
                    </div>
                    <Button
                        onClick={() => onAddOvertimeRule?.(isHoliday)}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        {t("timePolicies.overtimeRules.add", "Add Overtime Rule")}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0 m-0">
                <div className="space-y-2">
                    {overtimeRulesByDay.map(({ day, rules }) => {
                        const segments = getConsecutiveSegments(rules);
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
                                                : getOvertimeRuleColor(segment.overtimeRule!.name);
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
                                                    {segment.isDefault ? (
                                                        <div className="text-xs font-medium truncate">
                                                            {timePolicy?.default_overtime_multiplier ? `${timePolicy?.default_overtime_multiplier}x` : '-'}
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center">
                                                            <div className="text-xs font-medium truncate">
                                                                {segment.overtimeRule?.multiplier}x
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );

                                            // Wrap default segments with HoverCard
                                            if (segment.isDefault) {
                                                return (
                                                    <HoverCard key={`${day.key}-segment-${index}`} openDelay={200}>
                                                        <HoverCardTrigger asChild>
                                                            {segmentContent}
                                                        </HoverCardTrigger>
                                                        <HoverCardContent className="w-64" side="top">
                                                            <div className="space-y-2">
                                                                <div className="text-sm font-semibold">
                                                                    {t("timePolicies.overtimeRules.noOvertime", "Default Multiplier")}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {t("timePolicies.overtimeRules.noOvertimeDescription", "This time period has the default multiplier set in the time policy.")}
                                                                </div>
                                                            </div>
                                                        </HoverCardContent>
                                                    </HoverCard>
                                                );
                                            }

                                            // Wrap rule segments with HoverCard showing rule info
                                            if (segment.overtimeRule) {
                                                return (
                                                    <HoverCard key={`${day.key}-segment-${index}`} openDelay={200}>
                                                        <HoverCardTrigger asChild>
                                                            {segmentContent}
                                                        </HoverCardTrigger>
                                                        <HoverCardContent className="w-64" side="top">
                                                            <div className="space-y-3">
                                                                <div className="space-y-2">
                                                                    <div className="text-sm font-semibold">
                                                                        {segment.overtimeRule.name}
                                                                    </div>
                                                                    <div className="text-sm font-medium text-muted-foreground">
                                                                        {formatTime(segment.overtimeRule.start_time)} - {formatTime(segment.overtimeRule.end_time)}
                                                                    </div>
                                                                    {segment.overtimeRule.description && (
                                                                        <div className="text-sm text-muted-foreground">
                                                                            {segment.overtimeRule.description}
                                                                        </div>
                                                                    )}
                                                                    <div className="space-y-1">
                                                                        <div className="flex justify-between items-center text-sm">
                                                                            <span className="text-muted-foreground">{t("timePolicies.overtimeRules.multiplier", "Multiplier")}</span>
                                                                            <span className="font-semibold">
                                                                                {segment.overtimeRule.multiplier}x
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center text-sm">
                                                                            <span className="text-muted-foreground">{t("timePolicies.overtimeRules.maxHours", "Max Hours")}</span>
                                                                            <span className="font-semibold">
                                                                                {segment.overtimeRule.max_hours}h
                                                                            </span>
                                                                        </div>
                                                                        {segment.overtimeRule.is_holiday && (
                                                                            <div className="flex justify-between items-center text-sm">
                                                                                <span className="text-muted-foreground">{t("timePolicies.holiday", "Holiday")}</span>
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
                                                                        onClick={() => onEditOvertimeRule?.(segment.overtimeRule!)}
                                                                    >
                                                                        <Edit className="h-3 w-3 mr-1" />
                                                                        {t("common.edit", "Edit")}
                                                                    </Button>
                                                                    <Button
                                                                        variant="destructive"
                                                                        size="sm"
                                                                        className="flex-1"
                                                                        onClick={() => onDeleteOvertimeRule?.(segment.overtimeRule!)}
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
                {filteredOvertimeRules.length > 0 && (
                    <div className="mt-6 pt-4 border-t">
                        <div className="text-sm font-medium mb-2">
                            {t("timePolicies.overtimeRules.legend", "Overtime Rules")}
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {Array.from(new Map(filteredOvertimeRules.map((rule) => [rule.name, rule])).values())
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map((rule) => {
                                    const colorName = getOvertimeRuleColor(rule.name);
                                    const colorClasses = getColorClasses(colorName);
                                    return (
                                        <div key={rule.name} className="flex items-center gap-2">
                                            <div
                                                className={`w-4 h-4 rounded border ${colorClasses}`}
                                            />
                                            <span className="text-sm">{rule.name} ({rule.multiplier}x)</span>
                                        </div>
                                    );
                                })}
                            <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded ${getColorClasses("gray")}`} />
                                <span className="text-sm">
                                    {t("timePolicies.overtimeRules.noOvertime", "Default Multiplier")} ({timePolicy?.default_overtime_multiplier ? `${timePolicy?.default_overtime_multiplier}x` : '-'})
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default TimePolicyOvertimeRulesSection;

