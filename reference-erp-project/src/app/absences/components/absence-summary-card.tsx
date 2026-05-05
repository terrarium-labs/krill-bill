import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDate } from "@/utils/miscelanea";
import { AbsenceCounterType } from "@/types/employees/absences";

interface AbsenceSummaryCardProps {
  startDate: Date;
  endDate: Date;
  duration: number;
  counter: AbsenceCounterType | null;
}

/**
 * Shared component displaying calculated absence dates and duration.
 * Shows start date, end date, and duration in a styled card.
 */
const AbsenceSummaryCard: React.FC<AbsenceSummaryCardProps> = ({
  startDate,
  endDate,
  duration,
  counter,
}) => {
  const { t } = useTranslation();

  if (!counter || !startDate || duration <= 0) {
    return null;
  }

  // Convert duration to total seconds (duration is in days or hours depending on counter.unit)
  const totalSeconds =
    counter.unit === "days"
      ? Math.round(duration * 24 * 60 * 60)
      : Math.round(duration * 60 * 60);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);

  const fullDays = Math.floor(h / 24);
  const remainingHours = h % 24;

  const parts: string[] = [];
  if (fullDays > 0) {
    parts.push(
      `${fullDays} ${fullDays === 1 ? t("absences.day", "day") : t("absences.days", "days")}`
    );
  }
  if (remainingHours > 0) parts.push(`${remainingHours}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  const durationFormatted = parts.join(" ");

  return (
    <div className="rounded-lg border bg-muted/50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="text-sm font-medium">
            {t("absences.startDate", "Start Date")}
          </p>
          <p className="text-sm text-muted-foreground break-words">
            {formatDate(startDate, {
              showTime: true,
              showYear: true,
              useUTC: false,
            })}
          </p>
        </div>
        <div className="space-y-1 flex-1 min-w-0">
          <p className="text-sm font-medium">
            {t("absences.endDate", "End Date")}
          </p>
          <p className="text-sm text-muted-foreground break-words">
            {formatDate(endDate, {
              showTime: true,
              showYear: true,
              useUTC: false,
            })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <p className="text-xs text-muted-foreground">
            {t("absences.duration", "Duration")}
          </p>
          <p className="text-sm font-semibold whitespace-nowrap">
            {durationFormatted}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AbsenceSummaryCard;
