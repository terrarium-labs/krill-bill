import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
    BookOpen,
    Clock,
    Euro,
    GraduationCap,
    Info,
    LayoutList,
    Loader2,
    CalendarIcon,
    FilterX,
    Users,
} from "lucide-react";
import type { DateRange } from "react-day-picker";

import { getTrainingsInsights } from "@/api/trainings/trainings";
import { useOrg } from "@/app/contexts/OrgContext";
import type { EnrollmentStatus, TrainingInsights } from "@/types/trainings/trainings";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDateForAPI, formatDecimal, formatPercentage } from "@/utils/miscelanea";

const STATUS_DISPLAY_ORDER: EnrollmentStatus[] = [
    "completed",
    "in_progress",
    "enrolled",
    "failed",
    "withdrew",
];

interface TrainingInsightsSectionProps {
    orgId: string | undefined;
    /** When set, insights are limited to this training (API `training_id`). */
    trainingId?: string;
    /**
     * Training detail fields for capacity / budget display on the detail insights card
     * (`current / max` enrollments, `spent / budget` cost). Only used when `trainingId` is set.
     */
    trainingMaxParticipants?: number | null;
    trainingEnrolledCount?: number | null;
    trainingBudget?: number | null;
    /** Bump to refetch after mutations (create / delete training, z.). */
    refreshKey?: number;
}

interface StatCellProps {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: React.ReactNode;
    className?: string;
    /** Shown beside the label only when the KPI has substantive data to explain. */
    infoTooltip?: React.ReactNode;
    infoAriaLabel?: string;
}

const StatCell = ({ icon: Icon, label, value, className, infoTooltip, infoAriaLabel }: StatCellProps) => (
    <div
        className={cn(
            "flex min-w-23 flex-1 flex-col justify-center gap-0.5 px-3 py-2 sm:min-w-0 sm:px-4 sm:py-2.5",
            className
        )}
    >
        <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground sm:gap-1.5 sm:text-sm">
            <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
            <span className="truncate">{label}</span>
            {infoTooltip ? (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            className="inline-flex shrink-0 rounded-full p-0.5 text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            aria-label={infoAriaLabel}
                        >
                            <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs">
                        {infoTooltip}
                    </TooltipContent>
                </Tooltip>
            ) : null}
        </div>
        <div className="text-lg font-medium tabular-nums tracking-tight sm:text-xl">{value}</div>
    </div>
);

const TrainingInsightsSection = ({
    orgId,
    trainingId,
    trainingMaxParticipants,
    trainingEnrolledCount,
    trainingBudget,
    refreshKey = 0,
}: TrainingInsightsSectionProps) => {
    const { t } = useTranslation();
    const { org } = useOrg();
    const currency = org?.currency ?? "EUR";

    const [insights, setInsights] = useState<TrainingInsights | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    const fromDate =
        dateRange?.from && dateRange?.to ? formatDateForAPI(dateRange.from) : undefined;
    const toDate =
        dateRange?.from && dateRange?.to ? formatDateForAPI(dateRange.to) : undefined;

    const fetchInsights = useCallback(async () => {
        if (!orgId) return;
        setLoading(true);
        try {
            const response = await getTrainingsInsights(
                orgId,
                fromDate,
                toDate,
                trainingId ?? null,
            );
            if (response.success && response.success.insights) {
                setInsights(response.success.insights);
            } else {
                setInsights(null);
                toast.error(
                    t("trainings.insights.error", "Could not load training insights")
                );
            }
        } catch {
            setInsights(null);
            toast.error(t("trainings.insights.error", "Could not load training insights"));
        } finally {
            setLoading(false);
        }
    }, [orgId, t, fromDate, toDate, trainingId]);

    useEffect(() => {
        void fetchInsights();
    }, [fetchInsights, refreshKey]);

    const statusLabel = useCallback(
        (status: string) => {
            const key = `trainings.insights.status.${status}` as const;
            const defaults: Record<string, string> = {
                enrolled: "Enrolled",
                in_progress: "In progress",
                completed: "Completed",
                failed: "Failed",
                withdrew: "Withdrew",
            };
            return t(key, defaults[status] ?? status.replace(/_/g, " "));
        },
        [t]
    );

    const sortedStatusEntries = insights
        ? (() => {
              const byStatus = insights.enrollments_by_status ?? {};
              const entries = Object.entries(byStatus).filter(
                  ([, n]) => typeof n === "number" && n > 0
              ) as [string, number][];
              const orderIdx = new Map(STATUS_DISPLAY_ORDER.map((s, i) => [s, i]));
              return entries.sort((a, b) => {
                  const ia = orderIdx.get(a[0] as EnrollmentStatus) ?? 100;
                  const ib = orderIdx.get(b[0] as EnrollmentStatus) ?? 100;
                  return ia !== ib ? ia - ib : b[1] - a[1];
              });
          })()
        : [];

    if (!orgId) {
        return null;
    }

    if (loading && !insights) {
        return (
            <Card className="w-full shadow-none">
                <div className="flex flex-col gap-3 border-b border-border px-4 sm:flex-row sm:items-center sm:justify-between">
                    <Skeleton className="h-4 w-24" />
                    <div className="flex flex-wrap items-center gap-2 justify-end">
                        <Skeleton className="h-8 w-40" />
                        <Skeleton className="h-8 w-36" />
                    </div>
                </div>
                <div className="flex w-full divide-x divide-border overflow-x-auto">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="min-w-23 flex-1 px-3 py-2 sm:min-w-0 sm:px-4">
                            <Skeleton className="mb-1 h-3 w-20" />
                            <Skeleton className="h-6 w-12" />
                        </div>
                    ))}
                </div>
            </Card>
        );
    }

    if (!insights) {
        return null;
    }

    const hoursLabel =
        insights.total_hours_delivered === 0
            ? "—"
            : `${formatDecimal(insights.total_hours_delivered, {
                  minFractionDigits: 0,
                  maxFractionDigits: 1,
              })} ${t("trainings.insights.hoursSuffix", "h")}`;

    const dateRangeLabel =
        dateRange?.from && dateRange?.to
            ? `${dateRange.from.toLocaleDateString()} – ${dateRange.to.toLocaleDateString()}`
            : t("trainings.insights.allDates", "All dates");

    const completedEnrollmentCount =
        typeof insights.enrollments_by_status?.completed === "number"
            ? insights.enrollments_by_status.completed
            : 0;

    const showEnrollmentCapacity =
        Boolean(trainingId) && trainingMaxParticipants != null;
    const enrollmentsValue: ReactNode = showEnrollmentCapacity ? (
        <span className="inline-flex items-baseline gap-x-1">
            <span>{trainingEnrolledCount ?? 0}</span>
            <span className="text-xs font-normal text-muted-foreground/60 sm:text-sm">/</span>
            <span className="text-xs font-normal text-muted-foreground tabular-nums sm:text-sm">
                {trainingMaxParticipants}
            </span>
        </span>
    ) : (
        insights.total_enrollments
    );

    const showCostBudget = Boolean(trainingId) && trainingBudget != null;
    const costValue: ReactNode = showCostBudget ? (
        <span className="inline-flex min-w-0 flex-wrap items-baseline gap-x-1">
            <span className="min-w-0 break-words">{formatCurrency(insights.total_cost, currency)}</span>
            <span className="text-xs font-normal text-muted-foreground/60 sm:text-sm">/</span>
            <span className="text-xs font-normal text-muted-foreground tabular-nums sm:text-sm">
                {formatCurrency(trainingBudget, currency)}
            </span>
        </span>
    ) : (
        formatCurrency(insights.total_cost, currency)
    );

    return (
        <Card className="w-full overflow-hidden shadow-none py-2">
            <div className="flex flex-col gap-3 border-b border-border px-4 sm:flex-row sm:items-center sm:justify-between pb-2">
                <div className="text-sm font-medium text-foreground">
                    {t("trainings.insights.title", "Insights")}
                </div>
                <div className="flex min-w-0 flex-wrap items-center justify-start gap-x-3 gap-y-2 sm:justify-end">
                    {sortedStatusEntries.length > 0 ? (
                        <div
                            className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground/90 sm:max-w-[min(100%,28rem)] sm:justify-end"
                            aria-label={t("trainings.insights.byStatus", "Enrollments by status")}
                        >
                            {sortedStatusEntries.map(([status, count]) => (
                                <span key={status} className="shrink-0 tabular-nums">
                                    <span className="text-muted-foreground">{statusLabel(status)}</span>
                                    <span className="mx-1 text-muted-foreground/40">·</span>
                                    <span className="font-medium">{count}</span>
                                </span>
                            ))}
                        </div>
                    ) : null}
                    <div className="flex shrink-0 items-center gap-1">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1.5 shadow-none font-normal text-muted-foreground"
                                >
                                    <CalendarIcon className="h-3.5 w-3.5" />
                                    <span className="max-w-[200px] truncate">{dateRangeLabel}</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto overflow-hidden p-0" align="end">
                                <Calendar
                                    className="w-full"
                                    captionLayout="dropdown"
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                        {dateRange?.from && dateRange?.to ? (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 text-muted-foreground"
                                onClick={() => setDateRange(undefined)}
                                aria-label={t("trainings.insights.clearDateRange", "Clear date range")}
                            >
                                <FilterX className="h-4 w-4" />
                            </Button>
                        ) : null}
                        {loading ? (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                        ) : null}
                    </div>
                </div>
            </div>

            <TooltipProvider delayDuration={200}>
                <div className="flex w-full divide-x divide-border overflow-x-auto">
                    {trainingId ? (
                        <StatCell
                            icon={LayoutList}
                            label={t("trainings.insights.sessions", "Sessions")}
                            value={insights.total_sessions ?? 0}
                            infoAriaLabel={t(
                                "trainings.insights.kpiHint.sessions",
                                "About sessions",
                            )}
                            infoTooltip={
                                (insights.total_sessions ?? 0) > 0 ? (
                                    <p>
                                        {t(
                                            "trainings.insights.kpiHelp.sessions",
                                            "Sessions defined for this training.",
                                        )}
                                    </p>
                                ) : undefined
                            }
                        />
                    ) : (
                        <StatCell
                            icon={GraduationCap}
                            label={t("trainings.insights.trainings", "Trainings")}
                            value={insights.total_trainings}
                            infoAriaLabel={t(
                                "trainings.insights.kpiHint.trainings",
                                "About trainings",
                            )}
                            infoTooltip={
                                insights.total_trainings > 0 ? (
                                    <p>
                                        {t(
                                            "trainings.insights.kpiHelp.trainings",
                                            "Distinct trainings with at least one enrollment in this scope.",
                                        )}
                                    </p>
                                ) : undefined
                            }
                        />
                    )}
                    <StatCell
                        icon={Users}
                        label={t("trainings.insights.enrollments", "Enrollments")}
                        value={enrollmentsValue}
                        infoAriaLabel={t("trainings.insights.kpiHint.enrollments", "About enrollments")}
                        infoTooltip={
                            showEnrollmentCapacity ? (
                                <p>
                                    {t(
                                        "trainings.insights.kpiHelp.enrollmentsCapacity",
                                        "Current enrollments on this training vs maximum participants (same as training details). Other figures in this card still follow the selected date range where applicable.",
                                    )}
                                </p>
                            ) : insights.total_enrollments > 0 ? (
                                <p>
                                    {t(
                                        "trainings.insights.kpiHelp.enrollments",
                                        "Total enrollment records (filtered by enrollment date when a range is set)."
                                    )}
                                </p>
                            ) : undefined
                        }
                    />
                    <StatCell
                        icon={BookOpen}
                        label={t("trainings.insights.completionRate", "Completion")}
                        value={formatPercentage(insights.completion_rate)}
                        infoAriaLabel={t(
                            "trainings.insights.kpiHint.completion",
                            "About completion rate"
                        )}
                        infoTooltip={
                            insights.total_enrollments > 0 ? (
                                <div className="space-y-1.5">
                                    <p>
                                        {t(
                                            "trainings.insights.kpiHelp.completion",
                                            'Share of enrollments with status "completed" in this scope.'
                                        )}
                                    </p>
                                    {completedEnrollmentCount > 0 ? (
                                        <>
                                            <p className="text-muted-foreground">
                                                {t(
                                                    "trainings.insights.completionBreakdownLead",
                                                    "By training requirement:"
                                                )}
                                            </p>
                                            <div className="flex justify-between gap-6 tabular-nums">
                                                <span className="text-muted-foreground">
                                                    {t(
                                                        "trainings.insights.mandatoryCompletion",
                                                        "Mandatory"
                                                    )}
                                                </span>
                                                <span className="font-medium">
                                                    {formatPercentage(
                                                        insights.mandatory_completion_rate
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex justify-between gap-6 tabular-nums">
                                                <span className="text-muted-foreground">
                                                    {t(
                                                        "trainings.insights.optionalCompletion",
                                                        "Optional"
                                                    )}
                                                </span>
                                                <span className="font-medium">
                                                    {formatPercentage(
                                                        insights.optional_completion_rate
                                                    )}
                                                </span>
                                            </div>
                                        </>
                                    ) : null}
                                </div>
                            ) : undefined
                        }
                    />
                    <StatCell
                        icon={Clock}
                        label={t("trainings.insights.hours", "Hours")}
                        value={hoursLabel}
                        infoAriaLabel={t("trainings.insights.kpiHint.hours", "About hours")}
                        infoTooltip={
                            insights.total_hours_delivered > 0 ? (
                                <p>
                                    {t(
                                        "trainings.insights.kpiHelp.hours",
                                        "Sum of each training’s duration (hours) across enrollments in this scope."
                                    )}
                                </p>
                            ) : undefined
                        }
                    />
                    <StatCell
                        icon={Euro}
                        label={t("trainings.insights.totalCost", "Cost (done)")}
                        value={costValue}
                        infoAriaLabel={t("trainings.insights.kpiHint.cost", "About cost")}
                        infoTooltip={
                            showCostBudget || insights.total_cost > 0 ? (
                                <div className="space-y-1.5">
                                    {insights.total_cost > 0 ? (
                                        <p>
                                            {t(
                                                "trainings.insights.kpiHelp.cost",
                                                'Sum of cost per participant for enrollments with status "completed" in this scope.'
                                            )}
                                        </p>
                                    ) : null}
                                    {showCostBudget ? (
                                        <p>
                                            {t(
                                                "trainings.insights.kpiHelp.costBudget",
                                                "Denominator is the training budget. Numerator is realized cost for completed enrollments in this scope.",
                                            )}
                                        </p>
                                    ) : null}
                                </div>
                            ) : undefined
                        }
                    />
                </div>
            </TooltipProvider>

            {!trainingId && insights.top_categories.length > 0 ? (
                <div className="border-t border-border px-4 py-3">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {t("trainings.insights.topCategories", "Top categories")}
                    </p>
                    <ol className="space-y-1.5 text-sm">
                        {insights.top_categories.map((row, index) => (
                            <li
                                key={row.category_id}
                                className="flex items-baseline justify-between gap-3"
                            >
                                <span className="min-w-0 truncate text-muted-foreground">
                                    <span className="mr-2 tabular-nums text-muted-foreground/70">
                                        {index + 1}.
                                    </span>
                                    {row.category_name}
                                </span>
                                <span className="shrink-0 tabular-nums font-medium text-foreground">
                                    {row.count}
                                </span>
                            </li>
                        ))}
                    </ol>
                </div>
            ) : null}
        </Card>
    );
};

export default TrainingInsightsSection;
