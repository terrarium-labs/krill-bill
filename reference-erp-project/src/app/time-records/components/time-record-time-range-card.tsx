import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDate, formatTimeToTravel } from "@/utils/miscelanea";

interface TimeRecordTimeRangeCardProps {
    startTime: Date;
    endTime?: Date | null;
}

// Calculate duration in minutes and format it
const calculateDuration = (startTime: Date, endTime: Date): string => {
    const durationMs = endTime.getTime() - startTime.getTime();
    const minutes = durationMs / (1000 * 60);
    return formatTimeToTravel(minutes);
};

/**
 * Shared component displaying calculated time record start/end times and duration.
 * Shows start time, end time, and duration in a styled card.
 */
const TimeRecordTimeRangeCard: React.FC<TimeRecordTimeRangeCardProps> = ({
    startTime,
    endTime,
}) => {
    const { t } = useTranslation();

    if (!startTime) {
        return null;
    }

    // Calculate duration only if end time is valid
    const hasValidEndTime = endTime && endTime.getTime() > startTime.getTime();
    const duration = hasValidEndTime ? calculateDuration(startTime, endTime) : null;

    return (
        <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between gap-4">
                <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-sm font-medium">
                        {t("employees.timeRecords.startTime", "Start Time")}
                    </p>
                    <p className="text-sm text-muted-foreground break-words">
                        {formatDate(startTime, {
                            showTime: true,
                            showYear: true,
                            useUTC: false,
                        })}
                    </p>
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-sm font-medium">
                        {t("employees.timeRecords.endTime", "End Time")}
                    </p>
                    <p className="text-sm text-muted-foreground break-words">
                        {endTime
                            ? formatDate(endTime, {
                                showTime: true,
                                showYear: true,
                                useUTC: false,
                            })
                            : "-"}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <p className="text-xs text-muted-foreground">
                        {t("employees.timeRecords.duration", "Duration")}
                    </p>
                    <p className="text-sm font-semibold whitespace-nowrap">
                        {duration ?? "-"}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TimeRecordTimeRangeCard;
