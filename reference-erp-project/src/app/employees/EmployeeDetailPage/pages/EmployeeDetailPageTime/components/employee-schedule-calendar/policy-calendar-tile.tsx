import { useTranslation } from "react-i18next";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  formatTimeSlotTime,
  type PolicySlotLineDisplay,
} from "@/app/employees/EmployeeDetailPage/pages/EmployeeDetailPageTime/utils/policy-day-display";
import { cn } from "@/lib/utils";

export type PolicyCalendarTileSize = "default" | "sm";

interface PolicyCalendarTileProps {
  slot: PolicySlotLineDisplay;
  sourceLabel: string;
  tileSize?: PolicyCalendarTileSize;
  /** Optional extra note below slot details (e.g. on-call stay-alert copy). */
  tooltipHint?: string;
}

function formatDurationMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}min`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${mins}min`;
}

/**
 * Time policy slot chip: matches on-call day tiles — name first (truncates), time range at the end (shrink-0).
 * Hover uses the same card pattern as admin time policy shifts (no edit/delete actions).
 */
export function PolicyCalendarTile({
  slot,
  sourceLabel,
  tileSize = "default",
  tooltipHint,
}: PolicyCalendarTileProps) {
  const { t } = useTranslation();
  const ts = slot.timeSlot;
  const startFmt = formatTimeSlotTime(ts.start_time);
  const endFmt = formatTimeSlotTime(ts.end_time);

  const trigger = (
    <div
      className={cn(
        "w-full text-left rounded border transition-colors min-w-0",
        "flex items-center cursor-pointer font-medium",
        slot.colorClasses,
        tileSize === "sm"
          ? "px-1.5 py-0.5 text-[10px] leading-tight min-h-8"
          : "px-2 py-1 text-xs min-h-8"
      )}
    >
      <span className="flex items-center gap-1 min-w-0 w-full">
        <span className="truncate min-w-0">{slot.name}</span>
        <span className="text-muted-foreground shrink-0">({slot.timeRange})</span>
      </span>
    </div>
  );

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
      <HoverCardContent className="w-64" side="top">
        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{sourceLabel}</p>
            <div className="text-sm font-semibold">{ts.name}</div>
            <div className="text-sm font-medium text-muted-foreground">
              {startFmt} – {endFmt}
            </div>
            {ts.description ? (
              <div className="text-sm text-muted-foreground">{ts.description}</div>
            ) : null}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  {t("timePolicies.shifts.breakTime", "Break Time")}
                </span>
                <span className="font-semibold">
                  {formatDurationMinutes(ts.break_time_duration)}
                </span>
              </div>
              {ts.is_holiday ? (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    {t("timePolicies.holiday", "Holiday")}
                  </span>
                  <span>{t("common.yes", "Yes")}</span>
                </div>
              ) : null}
            </div>
          </div>
          {tooltipHint ? (
            <p className="text-[10px] text-muted-foreground/90 border-t border-border pt-2 leading-snug">
              {tooltipHint}
            </p>
          ) : null}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
