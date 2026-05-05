import { ClockAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type EmployeeScheduleCalendarLegendProps = {
  /** When true, show policy schedule-type swatches (default / on-call / special). */
  hasTimePolicy: boolean;
  /** Extra classes for the container (e.g. rounded-b when inside a card). */
  className?: string;
};

/**
 * Read-only key for schedule colors — same layout pattern as {@link TimeRecordsSummaryCalendar} legend.
 */
export function EmployeeScheduleCalendarLegend({
  hasTimePolicy,
  className,
}: EmployeeScheduleCalendarLegendProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4 py-2 border-t border-border text-[11px] text-muted-foreground shrink-0 flex-wrap bg-card",
        className
      )}
    >
      {hasTimePolicy && (
        <>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-linear-to-b from-green-500/30 to-green-500/5 border-t-2 border-green-500" />
            {t("on-call.legendWorkShift", "Work Shift")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-linear-to-b from-purple-500/30 to-purple-500/5 border-t-2 border-purple-500" />
            {t("on-call.legendSpecialShift", "Special Shift")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-linear-to-b from-orange-500/30 to-orange-500/5 border-t-2 border-orange-500" />
            {t("on-call.legendOnCallShift", "OnCall Shift")}
          </span>
        </>
      )}
      <span className="flex items-center gap-1.5">
        <ClockAlert className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        {t(
          "employeesDetail.scheduleLegendAssignedOnCall",
          "Assigned on-call availability shift"
        )}
      </span>
    </div>
  );
}
