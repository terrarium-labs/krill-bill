import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, List, BarChart3 } from "lucide-react";
import { TimeRecord } from "@/types/employees/time-records";
import { TimeSlot, flattenDefaultTimeSlots } from "@/types/general/time-policies";
import { formatTimeToTravel, getColorClasses, formatDateForAPI } from "@/utils/miscelanea";
import { useParams } from "react-router";
import { useEmployee } from "@/app/dashboard/contexts/DashboardEmployeeContext";
import { getEmployeeTimeRecords } from "@/api/employees/time-records/time-records";
import { getTimePolicy } from "@/api/orgs/time-policies/time-policies";
import { toast } from "sonner";
import Tag from "@/app/components/tag/tag";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";

interface TodayFeedContainerProps {
    onEditTimeRecord?: (timeRecord: TimeRecord) => void;
    onDeleteTimeRecord?: (timeRecord: TimeRecord) => void;
    refreshTrigger?: number;
}

// Parse time slot time (HH:MM / HH:MM:SS / ISO datetime) to minutes from midnight
const timeSlotToMinutes = (timeStr: string): number => {
    if (timeStr.includes("T")) {
        const d = new Date(timeStr);
        if (!Number.isNaN(d.getTime())) {
            return d.getHours() * 60 + d.getMinutes();
        }
    }
    const [hours, minutes] = timeStr.split(":").map(Number);
    return (hours ?? 0) * 60 + (minutes ?? 0);
};

// Format time for display
const formatTime = (timeStr: string): string => {
    const date = new Date(timeStr);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

// Calculate duration in minutes
const getDurationInMinutes = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = Math.max(0, end.getTime() - start.getTime());
    return durationMs / (1000 * 60);
};

const TodayFeedContainer = ({
    refreshTrigger
}: TodayFeedContainerProps) => {
    const { t } = useTranslation();
    const { employee } = useEmployee();
    const { orgId } = useParams<{ orgId: string }>();
    const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
    const [todayTimeSlots, setTodayTimeSlots] = useState<TimeSlot[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState<"list" | "timeline">("list");

    // Fetch today's time records and time policy
    const fetchTodayData = async () => {
        if (!orgId || !employee) return;

        setIsLoading(true);
        const today = new Date();
        const todayStr = formatDateForAPI(today);
        const tomorrowStr = formatDateForAPI(new Date(today.getTime() + 24 * 60 * 60 * 1000));

        try {
            // Fetch time records for today
            const recordsResponse = await getEmployeeTimeRecords(orgId, employee.id, todayStr, tomorrowStr, "", undefined, undefined);
            if (recordsResponse.success && recordsResponse.success.time_records) {
                setTimeRecords(recordsResponse.success.time_records);
            }

            // Fetch time policy if available
            if (employee.org_time_policy?.id) {
                const policyResponse = await getTimePolicy(orgId, employee.org_time_policy.id);
                if (policyResponse.success && policyResponse.success.time_policy) {
                    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
                    const slots = flattenDefaultTimeSlots(
                        policyResponse.success.time_policy.time_slot_ranges
                    ).filter((slot: TimeSlot) => slot.day_of_week === dayOfWeek && !slot.is_holiday);
                    setTodayTimeSlots(slots);
                }
            }
        } catch (error) {
            toast.error(t("dashboard.errorFetchingTimeData", "Error fetching time data"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTodayData();
    }, [orgId, employee, refreshTrigger]);

    // Calculate expected hours from time slots
    const expectedMinutes = todayTimeSlots.reduce((total, slot) => {
        const start = timeSlotToMinutes(slot.start_time);
        const end = timeSlotToMinutes(slot.end_time);
        return total + (end - start);
    }, 0);

    // Calculate actual worked minutes
    const workedMinutes = timeRecords.reduce((total, record) => {
        return total + getDurationInMinutes(record.start_time, record.end_time);
    }, 0);

    // Calculate difference
    const differenceMinutes = workedMinutes - expectedMinutes;

    // Get verification color
    const getVerificationColor = (status: string | null): string => {
        if (status === "approved") return "green";
        if (status === "rejected") return "red";
        return "yellow"; // pending or null
    };

    // Create segments for timeline visualization
    const getTimeSlotSegments = (slots: TimeSlot[]) => {
        const segments: Array<{
            start: number;
            end: number;
            timeSlot: TimeSlot;
        }> = [];

        slots.forEach((slot) => {
            const startMinutes = timeSlotToMinutes(slot.start_time);
            const endMinutes = timeSlotToMinutes(slot.end_time);

            segments.push({
                start: startMinutes,
                end: endMinutes,
                timeSlot: slot,
            });
        });

        return segments;
    };

    // Render timeline view (only expected schedule)
    const renderTimelineView = () => {
        const timeSlotSegments = getTimeSlotSegments(todayTimeSlots);
        const totalMinutes = 24 * 60;

        return (
            <div className="space-y-3">
                {/* Timeline */}
                <div className="flex items-center gap-3">
                    {/* Start time label */}
                    <div className="w-12 text-xs text-muted-foreground text-left">
                        00:00
                    </div>

                    {/* Timeline container - Only showing expected schedule */}
                    <div className={`flex-1 relative h-12 rounded-md border overflow-hidden ${getColorClasses("gray")}`}>
                        {timeSlotSegments.length > 0 ? (
                            timeSlotSegments.map((segment, index) => {
                                const width = ((segment.end - segment.start) / totalMinutes) * 100;
                                const slotColorClasses = getColorClasses("blue");
                                const slot = segment.timeSlot;
                                const duration = formatTimeToTravel(
                                    timeSlotToMinutes(slot.end_time) - timeSlotToMinutes(slot.start_time)
                                );

                                return (
                                    <HoverCard key={`slot-${index}`}>
                                        <HoverCardTrigger asChild>
                                            <div
                                                className={`absolute ${slotColorClasses} border opacity-60 hover:opacity-80 cursor-pointer transition-opacity`}
                                                style={{
                                                    left: `${(segment.start / totalMinutes) * 100}%`,
                                                    width: `${width}%`,
                                                    height: '100%',
                                                }}
                                            >
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-xs font-medium truncate px-1">
                                                        {duration}
                                                    </span>
                                                </div>
                                            </div>
                                        </HoverCardTrigger>
                                        <HoverCardContent className="w-64" side="top">
                                            <div className="space-y-2">
                                                <div className="font-semibold text-sm">
                                                    {t("dashboard.expectedSchedule", "Expected Schedule")}
                                                </div>
                                                <div className="space-y-1 text-sm">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-muted-foreground">
                                                            {t("dashboard.from", "From")}:
                                                        </span>
                                                        <span className="font-medium">
                                                            {slot.start_time.slice(0, 5)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-muted-foreground">
                                                            {t("dashboard.to", "To")}:
                                                        </span>
                                                        <span className="font-medium">
                                                            {slot.end_time.slice(0, 5)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between pt-1 border-t">
                                                        <span className="text-muted-foreground">
                                                            {t("dashboard.duration", "Duration")}:
                                                        </span>
                                                        <span className="font-medium">
                                                            {duration}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </HoverCardContent>
                                    </HoverCard>
                                );
                            })
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                                {t("dashboard.noExpectedSchedule", "No expected schedule for today")}
                            </div>
                        )}
                    </div>

                    {/* End time label */}
                    <div className="w-12 text-xs text-muted-foreground text-right">
                        24:00
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-lg border ${getColorClasses("blue")} opacity-60`} />
                        <span>{t("dashboard.expectedHours", "Expected hours")}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Card className="shadow-none border-border">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {t("dashboard.todaySchedule", "Schedule for today")}
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        {/* Summary */}
                        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                            <div className="text-center">
                                <div className="text-xs text-muted-foreground mb-1">
                                    {t("dashboard.expected", "Expected")}
                                </div>
                                <div className="text-lg font-semibold">
                                    {formatTimeToTravel(expectedMinutes)}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-muted-foreground mb-1">
                                    {t("dashboard.worked", "Worked")}
                                </div>
                                <div className="text-lg font-semibold">
                                    {formatTimeToTravel(workedMinutes)}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-muted-foreground mb-1">
                                    {t("dashboard.difference", "Difference")}
                                </div>
                                <div
                                    className={`text-lg font-semibold ${differenceMinutes > 0 ? 'text-green-600' :
                                        differenceMinutes < 0 ? 'text-red-600' :
                                            'text-foreground'
                                        }`}
                                >
                                    {differenceMinutes > 0 ? '+' : ''}{formatTimeToTravel(Math.abs(differenceMinutes))}
                                </div>
                            </div>
                        </div>

                        {/* Expected Time Slots */}
                        {todayTimeSlots.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium text-muted-foreground">
                                        {t("dashboard.expectedSchedule", "Expected Schedule")}
                                    </h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setViewMode(viewMode === "list" ? "timeline" : "list")}
                                        className="h-8"
                                    >
                                        {viewMode === "list" ? (
                                            <>
                                                <BarChart3 className="h-3.5 w-3.5 mr-1" />
                                                {t("dashboard.timelineView", "Timeline")}
                                            </>
                                        ) : (
                                            <>
                                                <List className="h-3.5 w-3.5 mr-1" />
                                                {t("dashboard.listView", "List")}
                                            </>
                                        )}
                                    </Button>
                                </div>
                                {viewMode === "list" ? (
                                    <div className="space-y-1">
                                        {todayTimeSlots.map((slot, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800"
                                            >
                                                <span className="text-sm">
                                                    {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatTimeToTravel(
                                                        timeSlotToMinutes(slot.end_time) - timeSlotToMinutes(slot.start_time)
                                                    )}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    renderTimelineView()
                                )}
                            </div>
                        )}

                        {/* Actual Time Records */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground">
                                {t("dashboard.recordedTime", "Recorded Time")}
                            </h4>
                            {timeRecords.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-6 border border-dashed rounded-lg">
                                    <p className="text-sm text-muted-foreground">
                                        {t("dashboard.noTimeRecordsToday", "No time records yet today")}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {timeRecords.map((record) => (
                                        <div
                                            key={record.id}
                                            className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className="text-sm font-medium">
                                                        {formatTime(record.start_time)} - {formatTime(record.end_time)}
                                                    </span>
                                                    <Tag
                                                        text={formatTimeToTravel(
                                                            getDurationInMinutes(record.start_time, record.end_time)
                                                        )}
                                                        color="blue"
                                                        className="text-xs"
                                                    />
                                                    <Tag
                                                        text={
                                                            record.verification_status === "approved"
                                                                ? t("timeRecords.status.approved", "Approved")
                                                                : record.verification_status === "rejected"
                                                                    ? t("timeRecords.status.rejected", "Rejected")
                                                                    : t("timeRecords.status.pending", "Pending")
                                                        }
                                                        color={getVerificationColor(record.verification_status)}
                                                        className="text-xs"
                                                    />
                                                </div>
                                                {record.notes && (
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {record.notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default TodayFeedContainer;

