import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDecimal } from "@/utils/miscelanea";
import { AbsenceTracker } from "@/types/employees/absences";
import { CalendarDays, Clock } from "lucide-react";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { useState } from "react";
import CountersViewModal from "./counters-view-modal";

interface CountersSummaryCardProps {
  tracker: AbsenceTracker[] | null;
  onEdit?: () => void;
  showEdit?: boolean;
}

const CountersSummaryCard = ({ tracker, onEdit, showEdit = false }: CountersSummaryCardProps) => {
  const { t } = useTranslation();
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Calculate total, returning separate days and hours
  const calculateDuration = (field: 'total' | 'used' | 'remaining'): { days: number; hours: number } => {
    if (!tracker || tracker.length === 0) return { days: 0, hours: 0 };
    
    let totalDays = 0;
    let totalHours = 0;
    
    tracker.forEach((t) => {
      let value = t[field];
      
      // Skip if value is null or negative (negative indicates infinite)
      if (value === null || value < 0) {
        return;
      }
      
      // For 'total' and 'remaining' fields, also skip unlimited counters
      if ((field === 'total' || field === 'remaining') && t.is_unlimited) {
        return;
      }
      
      // For 'total' field, include adjustment and days_that_expire (if not expired)
      if (field === 'total') {
        // Add adjustment
        value += (t.adjustment ?? 0);
        
        // Add days_that_expire if not expired
        const hasExpiry = t.expiration_date != null && String(t.expiration_date).trim() !== "";
        if (hasExpiry) {
          let expirationDate: Date | null = null;
          const s = String(t.expiration_date).trim();
          const dateOnly = s.slice(0, 10);
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
            expirationDate = new Date(dateOnly + "T12:00:00Z");
          } else {
            const parsed = new Date(s);
            if (Number.isFinite(parsed.getTime())) {
              const y = parsed.getUTCFullYear();
              const m = String(parsed.getUTCMonth() + 1).padStart(2, "0");
              const d = String(parsed.getUTCDate()).padStart(2, "0");
              expirationDate = new Date(`${y}-${m}-${d}T12:00:00Z`);
            }
          }
          
          const expiryTime = expirationDate?.getTime();
          const calendarDaysUntilExpiry =
            hasExpiry && typeof expiryTime === "number" && Number.isFinite(expiryTime)
              ? Math.round((expiryTime - Date.now()) / 864e5)
              : null;
          const notExpired = calendarDaysUntilExpiry != null && calendarDaysUntilExpiry >= 0;
          
          if (notExpired) {
            value += (t.days_that_expire ?? 0);
          }
        }
      }
      
      if (t.unit === "days") {
        totalDays += value;
      } else if (t.unit === "hours") {
        totalHours += value;
      }
    });
    
    // Convert excess hours to days
    const daysFromHours = Math.floor(totalHours / 24);
    const remainingHours = totalHours % 24;
    
    return {
      days: totalDays + daysFromHours,
      hours: remainingHours,
    };
  };

  const totalDuration = calculateDuration('total');
  const usedDuration = calculateDuration('used');
  const remainingDuration = calculateDuration('remaining');

  // Check if ALL counters are unlimited (only then show ∞)
  const allCountersUnlimited = tracker && tracker.length > 0 && tracker.every(t => t.is_unlimited || t.total === -1);

  // Format duration similar to DurationLabel: "X days Xh" or just "X days" or just "Xh"
  const formatDuration = ({ days, hours }: { days: number; hours: number }) => {
    const parts: string[] = [];
    
    if (days > 0) {
      parts.push(
        `${formatDecimal(days, { minFractionDigits: 0, maxFractionDigits: 0 })} ${days === 1 ? t("common.day", "day") : t("common.days", "days")}`
      );
    }
    if (hours > 0) {
      parts.push(`${formatDecimal(hours, { minFractionDigits: 0, maxFractionDigits: 1 })}h`);
    }
    
    // If no parts, show "0 days"
    if (parts.length === 0) {
      parts.push(`0 ${t("common.days", "days")}`);
    }
    
    return parts.join(" ");
  };

  return (
    <Card className="w-full shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          {t("employees.absences.counters", "Counters")}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {allCountersUnlimited ? "∞" : formatDuration(totalDuration)}
            </span>
            <CustomActionsDropdown
              items={[
                {
                  label: t("common.view", "View"),
                  icon: "eye",
                  onClick: () => setIsViewModalOpen(true),
                },
                ...(showEdit && onEdit
                  ? [
                      {
                        label: t("common.edit", "Edit"),
                        icon: "edit",
                        onClick: onEdit,
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        </CardTitle>
      </CardHeader>

      {/* Body */}
      <div className="grid grid-cols-2 divide-x">
        {/* Used Column */}
        <div className="flex flex-col items-start justify-center pl-4 py-3 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{t("employees.absences.used", "Used")}</span>
          </div>
          <div className="text-2xl font-medium">
            {formatDuration(usedDuration)}
          </div>
        </div>

        {/* Remaining Column */}
        <div className="flex flex-col items-start justify-center pl-4 py-3 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span>{t("employees.absences.remaining", "Remaining")}</span>
          </div>
          <div className="text-2xl font-medium">
            {allCountersUnlimited ? "∞" : formatDuration(remainingDuration)}
          </div>
        </div>
      </div>

      {/* View Modal */}
      <CountersViewModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        tracker={tracker}
      />
    </Card>
  );
};

export default CountersSummaryCard;
