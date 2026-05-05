import { useMemo } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { TimeRecordSummary } from "@/types/general/time-records";
import { isExplicitNoStatus, isStatusFieldMissing } from "@/app/time-records/utils/summary-status";
import { isFutureDay } from "@/utils/miscelanea";

const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Minimum height for each calendar week row and day tile */
const DAY_ROW_MIN_H = "min-h-[120px]";

function dateToKey(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getMonthWeeks(year: number, month: number) {
    const firstDay = new Date(year, month, 1);
    const dow = firstDay.getDay();
    const startOffset = dow === 0 ? -6 : 1 - dow;
    const calendarStart = new Date(year, month, 1 + startOffset);

    const weeks: { date: Date; key: string; isCurrentMonth: boolean }[][] = [];
    const current = new Date(calendarStart);

    for (let w = 0; w < 6; w++) {
        const week: { date: Date; key: string; isCurrentMonth: boolean }[] = [];
        for (let d = 0; d < 7; d++) {
            const key = dateToKey(current);
            week.push({
                date: new Date(current),
                key,
                isCurrentMonth: current.getMonth() === month,
            });
            current.setDate(current.getDate() + 1);
        }
        if (week.some((day) => day.isCurrentMonth)) {
            weeks.push(week);
        }
    }
    return weeks;
}

/** Same ratio as the time worked column: total worked vs theoretical (minutes). */
function getTimeWorkedPercent(totalMinutes: number, theoreticalMinutes: number): number {
    if (theoreticalMinutes <= 0) {
        return totalMinutes > 0 ? 100 : 0;
    }
    return Math.min(100, Math.round((totalMinutes / theoreticalMinutes) * 100));
}

function getTimeWorkedColor(percent: number) {
    if (percent < 50) {
        return {
            text: "text-red-700 dark:text-red-400",
            gradient: "from-red-500/30 to-transparent",
            border: "border-red-500",
            dot: "bg-red-500",
        };
    }
    if (percent < 80) {
        return {
            text: "text-amber-700 dark:text-amber-400",
            gradient: "from-amber-500/30 to-transparent",
            border: "border-amber-500",
            dot: "bg-amber-500",
        };
    }
    return {
        text: "text-emerald-700 dark:text-emerald-400",
        gradient: "from-emerald-500/30 to-transparent",
        border: "border-emerald-500",
        dot: "bg-emerald-500",
    };
}

function aggregateByDay(summaries: TimeRecordSummary[]) {
    const map = new Map<
        string,
        {
            totalMinutes: number;
            theoreticalMinutes: number;
            /** First summary row for this calendar day (API order); status tooltip uses this object only. */
            firstSummary: TimeRecordSummary | null;
        }
    >();
    for (const s of summaries) {
        const key = dateToKey(new Date(s.day));
        const prev = map.get(key) ?? {
            totalMinutes: 0,
            theoreticalMinutes: 0,
            firstSummary: null as TimeRecordSummary | null,
        };
        prev.totalMinutes += s.total_time_worked * 60;
        prev.theoreticalMinutes += s.theoretical_time_worked * 60;
        if (prev.firstSummary === null) prev.firstSummary = s;
        map.set(key, prev);
    }
    return map;
}

function formatHm(totalMinutes: number) {
    const hours = Math.floor(totalMinutes / 60);
    const mins = Math.floor(totalMinutes % 60);
    return `${hours}h ${mins}min`;
}

function formatBalanceLabel(balanceMinutes: number) {
    if (balanceMinutes === 0) return "0";
    const sign = balanceMinutes > 0 ? "+" : "-";
    return `${sign}${formatHm(Math.abs(balanceMinutes))}`;
}

function capitalizeFirstLetter(value: string): string {
    if (!value) return value;
    return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Colored text from API `status` or `pending` when `status` is omitted (not derived from counts or time %). */
function getDayStatusTooltipFromSummary(
    summary: TimeRecordSummary | null,
    t: TFunction,
): { label: string; className: string } {
    if (!summary) {
        return {
            label: t("timeRecords.summary.statusNone", "—"),
            className: "text-muted-foreground",
        };
    }

    if (isExplicitNoStatus(summary.status)) {
        return {
            label: t("timeRecords.summary.statusNone", "—"),
            className: "text-muted-foreground",
        };
    }

    if (isStatusFieldMissing(summary.status)) {
        if (summary.pending) {
            return {
                label: t("labels.pending", "Pending"),
                className: "text-yellow-600 dark:text-yellow-500",
            };
        }
        return {
            label: t("labels.verified", "Verified"),
            className: "text-green-600 dark:text-green-500",
        };
    }

    const raw = String(summary.status).trim().toLowerCase();
    if (raw === "rejected") {
        return {
            label: t("labels.rejected", "Rejected"),
            className: "text-red-600 dark:text-red-500",
        };
    }
    if (raw === "pending") {
        return {
            label: t("labels.pending", "Pending"),
            className: "text-yellow-600 dark:text-yellow-500",
        };
    }
    if (raw === "verified" || raw === "approved") {
        return {
            label: t("labels.approved", "Approved"),
            className: "text-green-600 dark:text-green-500",
        };
    }
    return {
        label: capitalizeFirstLetter(String(summary.status).trim()),
        className: "text-muted-foreground",
    };
}

type DayCellProps = {
    date: Date;
    totalMinutes: number;
    theoreticalMinutes: number;
    /** First API summary row for this day (tooltip status comes from this object). */
    statusSource: TimeRecordSummary | null;
    isToday: boolean;
    isCurrentMonth: boolean;
    isFuture: boolean;
    onSelect: (date: Date) => void;
};

function DayCell({
    date,
    totalMinutes,
    theoreticalMinutes,
    statusSource,
    isToday,
    isCurrentMonth,
    isFuture,
    onSelect,
}: DayCellProps) {
    const { t } = useTranslation();
    const dayNum = date.getDate();
    const hasData =
        statusSource !== null || theoreticalMinutes > 0 || totalMinutes > 0;
    const statusTooltip = getDayStatusTooltipFromSummary(statusSource, t);
    const percent = getTimeWorkedPercent(totalMinutes, theoreticalMinutes);
    const colors = getTimeWorkedColor(percent);
    const balanceMinutes = totalMinutes - theoreticalMinutes;
    const balancePositive = balanceMinutes > 0;
    const balanceNegative = balanceMinutes < 0;

    if (!isCurrentMonth || isFuture) {
        return (
            <div
                className={cn(
                    "relative flex flex-col items-center border-r border-border last:border-r-0 h-full",
                    DAY_ROW_MIN_H,
                    !isCurrentMonth ? "bg-muted/30" : "bg-muted/10",
                )}
            >
                <div className="flex flex-col items-center gap-0.5 pt-2">
                    <span className="tabular-nums text-muted-foreground/40 text-[10px]">{dayNum}</span>
                </div>
            </div>
        );
    }

    if (!hasData) {
        return (
            <button
                type="button"
                className={cn(
                    "relative flex flex-col border-r border-border last:border-r-0 h-full overflow-hidden text-left",
                    DAY_ROW_MIN_H,
                    "hover:ring-1 hover:ring-ring/30 hover:z-10 transition-colors",
                    isToday && "ring-1 ring-primary/40",
                )}
                onClick={() => onSelect(date)}
            >
                <div className="relative z-1 flex flex-col h-full gap-1.5 p-1.5">
                    <div className="flex flex-col items-center gap-0.5 self-stretch shrink-0 pt-0.5">
                        <span
                            className={cn(
                                "font-semibold tabular-nums leading-none text-xs",
                                isToday
                                    ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
                                    : "text-foreground",
                            )}
                        >
                            {dayNum}
                        </span>
                    </div>
                </div>
            </button>
        );
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "relative flex flex-col border-r border-border last:border-r-0 h-full overflow-hidden text-left",
                        DAY_ROW_MIN_H,
                        "hover:ring-1 hover:ring-ring/30 hover:z-10 transition-colors",
                        isToday && "ring-1 ring-primary/40",
                    )}
                    onClick={() => onSelect(date)}
                >
                    <div
                        className={cn(
                            "absolute inset-x-0 bottom-0 bg-linear-to-b border-t-2 transition-all",
                            colors.gradient,
                            colors.border,
                        )}
                        style={{ height: `${percent}%` }}
                    />

                    <div className="relative z-1 flex flex-col h-full gap-1.5 p-1.5">
                        <div className="flex flex-col items-center gap-0.5 self-stretch shrink-0 pt-0.5">
                            <span
                                className={cn(
                                    "font-semibold tabular-nums leading-none text-xs",
                                    isToday
                                        ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
                                        : "text-foreground",
                                )}
                            >
                                {dayNum}
                            </span>
                        </div>
                        <div className="flex-1 flex flex-col justify-end min-w-0">
                            <div className="flex items-center justify-center gap-1 rounded-md border border-border/50 bg-background/40 px-1.5 py-1.5 backdrop-blur-md min-w-0">
                                <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
                                <span className={cn("text-[10px] tabular-nums font-medium shrink-0", colors.text)}>
                                    {percent}%
                                </span>
                                <span className="text-muted-foreground/60 shrink-0 text-[10px]" aria-hidden>
                                    ·
                                </span>
                                <div
                                    className={cn(
                                        "flex min-w-0 items-center justify-center gap-0.5 text-[10px] tabular-nums font-medium leading-none",
                                        balancePositive && "text-green-600 dark:text-green-500",
                                        balanceNegative && "text-red-600 dark:text-red-500",
                                        !balancePositive &&
                                            !balanceNegative &&
                                            "pl-3 text-muted-foreground",
                                    )}
                                >
                                    {balanceNegative ? (
                                        <ArrowDown className="h-2.5 w-2.5 shrink-0" />
                                    ) : balancePositive ? (
                                        <ArrowUp className="h-2.5 w-2.5 shrink-0 text-green-600 dark:text-green-500" />
                                    ) : null}
                                    <span className="truncate">{formatBalanceLabel(balanceMinutes)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-xs">
                <div className="flex flex-col gap-1">
                    <p className="font-semibold">
                        {date.toLocaleDateString(undefined, {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                        })}
                    </p>
                    <div className="flex items-center gap-1.5">
                        <span className={cn("inline-block h-2 w-2 rounded-full", colors.dot)} />
                        <span>
                            {t("timeRecords.summary.timeWorked", "Time Worked")}: {percent}%
                        </span>
                    </div>
                    <p className="text-muted-foreground">
                        {formatHm(totalMinutes)} / {formatHm(theoreticalMinutes)}
                    </p>
                    <p className="text-muted-foreground">
                        {t("timeRecords.summary.balance", "Balance")}: {formatBalanceLabel(balanceMinutes)}
                    </p>
                    <div className="flex items-center gap-2 pt-0.5">
                        <span className="text-muted-foreground shrink-0">
                            {t("timeRecords.summary.status", "Status")}
                        </span>
                        <span className={cn("font-medium", statusTooltip.className)}>
                            {capitalizeFirstLetter(statusTooltip.label)}
                        </span>
                    </div>
                </div>
            </TooltipContent>
        </Tooltip>
    );
}

export interface TimeRecordsSummaryCalendarProps {
    month: Date;
    timeRecordsSummary: TimeRecordSummary[];
    isLoading: boolean;
    onDaySelect: (date: Date) => void;
}

export default function TimeRecordsSummaryCalendar({
    month,
    timeRecordsSummary,
    isLoading,
    onDaySelect,
}: TimeRecordsSummaryCalendarProps) {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const now = new Date();
    const todayKey = dateToKey(now);

    const byDay = useMemo(() => aggregateByDay(timeRecordsSummary), [timeRecordsSummary]);

    const monthWeeks = useMemo(() => getMonthWeeks(year, monthIndex), [year, monthIndex]);

    if (isLoading) {
        return (
            <div className="flex min-h-[520px] flex-col overflow-hidden rounded-lg border bg-card text-card-foreground">
                <div className="grid shrink-0 grid-cols-7 border-b border-border bg-muted/50">
                    {SHORT_DAYS.map((day) => (
                        <div
                            key={day}
                            className="py-2 text-center text-[10px] font-medium text-muted-foreground"
                        >
                            {day}
                        </div>
                    ))}
                </div>
                <div className="flex min-h-0 flex-1 flex-col divide-y divide-border">
                    {Array.from({ length: 6 }).map((_, wi) => (
                        <div key={wi} className={cn("grid flex-1 grid-cols-7", DAY_ROW_MIN_H)}>
                            {Array.from({ length: 7 }).map((__, di) => (
                                <div
                                    key={di}
                                    className="relative flex h-full flex-col gap-2 border-r border-border p-2 last:border-r-0"
                                >
                                    <Skeleton className="mx-auto mt-0.5 h-6 w-6 shrink-0 rounded-full" />
                                    <div className="flex min-h-0 flex-1 flex-col justify-end">
                                        <Skeleton className="h-7 w-full rounded-md" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-center gap-4 py-2 border-t border-border shrink-0 flex-wrap">
                    <Skeleton className="h-3 w-16 rounded-full" />
                    <Skeleton className="h-3 w-16 rounded-full" />
                    <Skeleton className="h-3 w-20 rounded-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-[520px] flex-col overflow-hidden rounded-lg border bg-card text-card-foreground">
            <div className="flex min-h-0 flex-1 flex-col overflow-auto">
                <div className="grid shrink-0 grid-cols-7 border-b border-border bg-muted/50">
                    {SHORT_DAYS.map((day) => (
                        <div
                            key={day}
                            className="py-2 text-center text-[10px] font-medium text-muted-foreground"
                        >
                            {day}
                        </div>
                    ))}
                </div>
                <div className="flex min-h-0 flex-1 flex-col divide-y divide-border">
                    {monthWeeks.map((week, wi) => (
                        <div key={wi} className={cn("grid flex-1 grid-cols-7", DAY_ROW_MIN_H)}>
                            {week.map((day) => {
                                const agg = byDay.get(day.key);
                                const future = isFutureDay(dateToKey(day.date));
                                return (
                                    <DayCell
                                        key={day.key}
                                        date={day.date}
                                        totalMinutes={agg?.totalMinutes ?? 0}
                                        theoreticalMinutes={agg?.theoreticalMinutes ?? 0}
                                        statusSource={agg?.firstSummary ?? null}
                                        isToday={day.key === todayKey}
                                        isCurrentMonth={day.isCurrentMonth}
                                        isFuture={future}
                                        onSelect={onDaySelect}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-center gap-4 py-2 border-t border-border text-[11px] text-muted-foreground shrink-0 flex-wrap">
                <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-linear-to-b from-red-500/30 to-red-500/5 border-t-2 border-red-500" />
                    {"< 50%"}
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-linear-to-b from-amber-500/30 to-amber-500/5 border-t-2 border-amber-500" />
                    50–79%
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-linear-to-b from-emerald-500/30 to-emerald-500/5 border-t-2 border-emerald-500" />
                    80–100%
                </span>
            </div>
        </div>
    );
}
