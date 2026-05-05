import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDate, formatDecimal } from "@/utils/miscelanea";
import { AbsenceTracker } from "@/types/employees/absences";
import { Infinity } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountersViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tracker: AbsenceTracker[] | null;
}

function formatValue(
  value: number,
  unit: AbsenceTracker["unit"],
  t: (key: string, fallback: string) => string
): string {
  const u =
    unit === "days"
      ? value === 1
        ? t("common.day", "day")
        : t("common.days", "days")
      : value === 1
        ? t("common.hour", "hour")
        : t("common.hours", "hours");
  return `${formatDecimal(value, { minFractionDigits: 0, maxFractionDigits: 1 })} ${u}`;
}

const SIZE = 28;
const STROKE = 2.5;

function ProgressCircle({
  value,
  size = SIZE,
  stroke = STROKE,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, value)) / 100);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("shrink-0 -rotate-90", className)}
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-muted-foreground/25"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-primary"
      />
    </svg>
  );
}

const CountersViewModal = ({
  open,
  onOpenChange,
  tracker,
}: CountersViewModalProps) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg max-h-[85vh] flex flex-col"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {t("employees.absences.countersSummary", "Counters Summary")}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 min-h-0 -mx-1 px-1">
          {tracker && tracker.length > 0 ? (
            <div className="space-y-1">
              {tracker.map((item) => {
                const unlimited = item.is_unlimited || item.total === -1;
                const totalNum = unlimited ? 0 : item.total;
                const usedNum = item.used;
                const remainingNum = item.remaining;
                const usagePercent =
                  unlimited || totalNum <= 0
                    ? 0
                    : Math.min(100, (usedNum / totalNum) * 100);
                const hasExpiry =
                  item.expiration_date != null &&
                  String(item.expiration_date).trim() !== "";
                let expirationDate: Date | null = null;
                if (hasExpiry) {
                  const s = String(item.expiration_date).trim();
                  const dateOnly = s.slice(0, 10);
                  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
                    expirationDate = new Date(dateOnly + "T12:00:00Z");
                  } else {
                    const parsed = new Date(s);
                    if (Number.isFinite(parsed.getTime())) {
                      const y = parsed.getUTCFullYear();
                      const m = String(parsed.getUTCMonth() + 1).padStart(
                        2,
                        "0"
                      );
                      const d = String(parsed.getUTCDate()).padStart(2, "0");
                      expirationDate = new Date(
                        `${y}-${m}-${d}T12:00:00Z`
                      );
                    }
                  }
                }
                const expiryTime = expirationDate?.getTime();
                const calendarDaysUntilExpiry =
                  hasExpiry &&
                    typeof expiryTime === "number" &&
                    Number.isFinite(expiryTime)
                    ? Math.round((expiryTime - Date.now()) / 864e5)
                    : null;
                const soonToExpire =
                  hasExpiry &&
                  calendarDaysUntilExpiry != null &&
                  calendarDaysUntilExpiry >= 0 &&
                  calendarDaysUntilExpiry <= 60;
                const notExpired =
                  calendarDaysUntilExpiry != null && calendarDaysUntilExpiry >= 0;
                const hasQuantityExpiring = (item.days_that_expire ?? 0) > 0;
                const showExpiry =
                  hasExpiry && notExpired && hasQuantityExpiring;

                return (
                  <div
                    key={item.counter.id}
                    className="py-3 border-b border-border last:border-b-0 last:pb-0"
                  >
                    {/* Title row with progress + used/remaining */}
                    <div className="flex items-center gap-2 mb-2">
                      {!unlimited && totalNum > 0 ? (
                        <ProgressCircle value={usagePercent} />
                      ) : (
                        <div className="size-7 shrink-0 rounded-full border border-muted flex items-center justify-center">
                          <Infinity className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      )}
                      <span className="font-medium text-sm">
                        {item.counter.name}
                        {item.unit === "hours" && (
                          <span className="text-muted-foreground font-normal ml-1">
                            ({t("employees.absences.hours", "Hours")})
                          </span>
                        )}
                      </span>
                      <div className="ml-auto text-sm tabular-nums shrink-0">
                        <span className="font-medium">
                          {item.used || 0}
                        </span>
                        <span className="mx-1">/</span>
                        <span>
                          {unlimited || remainingNum === -1 ? (
                            <><Infinity className="h-4 w-4 inline" /> {item.unit}</>
                          ) : (
                            formatValue((item.total + (item.adjustment ?? 0) + (item.days_that_expire ?? 0)), item.unit, t)
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Stats: From policy + Extra days */}
                    <div className="flex flex-col gap-1.5 pl-9 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">
                          {t("employees.absences.fromPolicy", "From policy")}
                        </span>
                        <span className="tabular-nums shrink-0">
                          {unlimited ? (
                            <>
                              <Infinity className="h-4 w-4 inline" />{" "}
                              {item.unit === "hours"
                                ? t("common.hours", "hours")
                                : t("common.days", "days")}
                            </>
                          ) : (
                            formatValue(item.total, item.unit, t)
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">
                          {t("employees.absences.extraDays", "Extra days")}
                        </span>
                        <span className={`tabular-nums shrink-0 ${(item.adjustment ?? 0) > 0 ? 'text-green-600 dark:text-green-400' : ''}`}>
                          {formatValue(item.adjustment ?? 0, item.unit, t)}
                        </span>
                      </div>
                    </div>

                    {/* Expiry: only when not yet expired and days_that_expire > 0 */}
                    {showExpiry && (
                      <div className="pl-9 mt-1.5 text-sm flex items-center justify-between gap-4">
                        <div
                          className={cn(
                            "flex flex-col gap-0.5 min-w-0",
                            soonToExpire
                              ? "text-amber-700 dark:text-amber-400"
                              : "text-muted-foreground"
                          )}
                        >
                          <div className="flex items-center">
                            <span>
                              {t(
                                "employees.absences.accumulatedFromLastCycle",
                                "Accumulated from last cycle"
                              )}
                            </span>
                          </div>
                          <span className="text-xs opacity-80">
                            ({t("employees.absences.expiresAt", "expires at")}{" "}
                            {formatDate(item.expiration_date!, {
                              showTime: false,
                              showDay: true,
                              showMonth: true,
                              showYear: true,
                            })})
                          </span>
                        </div>
                        <span
                          className={cn(
                            "tabular-nums shrink-0",
                            soonToExpire
                              ? "text-amber-700 dark:text-amber-400"
                              : "text-muted-foreground"
                          )}
                        >
                          {formatValue(
                            item.days_that_expire!,
                            item.unit,
                            t
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {t("employees.absences.noCounters", "No counters available")}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4 mt-auto shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close", "Close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CountersViewModal;
