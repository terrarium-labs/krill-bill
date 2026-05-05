import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

import { useTranslation } from "@/hooks/useTranslation";
import { getEmployeeAbsence } from "@/api/employees/absences/absences";
import { Absence } from "@/types/employees/absences";
import { IconLabel } from "@/app/components/custom-labels";
import { formatDate, formatDateRange, formatDecimal } from "@/utils/miscelanea";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import IdBadge from "@/app/components/id-badge";
import FilesSection from "@/app/components/files/files-section";
import Tag from "@/app/components/tag/tag";
import EmployeeLabel from "@/app/components/labels/employee-label";

interface AbsenceViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  employeeId: string;
  absenceId: string | null;
  /** Render custom action buttons in the header (right side, next to ID badge). */
  renderActions?: (absence: Absence) => React.ReactNode;
  /** Render custom footer actions (typically Approve/Reject for pending absences). Only shown when provided. */
  renderFooterActions?: (absence: Absence) => React.ReactNode;
}

const AbsenceViewModal: React.FC<AbsenceViewModalProps> = ({
  open,
  onOpenChange,
  orgId,
  employeeId,
  absenceId,
  renderActions,
  renderFooterActions,
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [absence, setAbsence] = useState<Absence | null>(null);

  // Fetch absence data when modal opens
  useEffect(() => {
    const fetchAbsence = async () => {
      if (!open || !orgId || !employeeId || !absenceId) return;

      setIsLoading(true);
      try {
        const response = await getEmployeeAbsence(orgId, employeeId, absenceId);
        if (response.success) {
          setAbsence(response.success.absence);
        }
      } catch (error) {
        console.error("Error fetching absence:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchAbsence();
    } else {
      setAbsence(null);
    }
  }, [open, orgId, employeeId, absenceId]);

  // Calculate duration based on dates
  const calculateDuration = (): { value: number; unit: string } => {
    if (!absence) return { value: 0, unit: "days" };

    const startDate = new Date(absence.start_date);
    const endDate = new Date(absence.end_date);
    // Unit may be available in extended counter data, default to "days"
    const unit = (absence.absence_counter as any)?.unit || "days";

    if (unit === "hours") {
      const timeDiff = endDate.getTime() - startDate.getTime();
      const hours = timeDiff / (1000 * 60 * 60);
      return { value: Number(hours.toFixed(1)), unit: "hours" };
    } else {
      // Days calculation using UTC
      const startDay = new Date(startDate);
      startDay.setUTCHours(0, 0, 0, 0);
      const endDay = new Date(endDate);
      endDay.setUTCHours(0, 0, 0, 0);
      const daysDiff =
        (endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24);

      const startHour = startDate.getUTCHours();
      const endHour = endDate.getUTCHours();

      let duration = 1;

      if (daysDiff === 0 && endHour === 12) {
        duration = 0.5;
      } else if (endHour === 12) {
        duration = daysDiff + 0.5;
      } else if (startHour === 12 && endHour === 23) {
        duration = daysDiff + 0.5;
      } else if (startHour === 0 && endHour === 23) {
        duration = daysDiff + 1;
      } else {
        duration = Math.ceil(daysDiff + 1);
      }

      return { value: duration, unit: "days" };
    }
  };

  const duration = calculateDuration();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full md:max-w-5xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold">
            <span>{t("absences.viewAbsence", "Absence Details")}</span>
            {absence && (
              <div className="flex items-center gap-2">
                <Tag
                  text={absence.status}
                  className="capitalize"
                />
                <IdBadge id={absence.id} />
                {renderActions?.(absence)}
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : absence ? (
          <div className="space-y-6 overflow-y-auto max-h-[70vh] px-2 scrollbar-hide mb-6">
            {/* Main Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Employee - only show when not viewing own absences */}
              {employeeId !== "me" && absence.employee && (
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">{t("absences.employee", "Employee")}</h4>
                  <EmployeeLabel data={absence.employee} link="?tab=absences" />
                </div>
              )}

              {/* Counter and Absence Type merged: [Icon] CounterName - AbsenceTypeName */}
              <div className="space-y-1">
                <h4 className="font-medium text-sm">
                  {t("absences.counter", "Counter")} / {t("absences.absenceType", "Absence Type")}
                </h4>
                <IconLabel
                  icon={absence.absence_type?.icon_url}
                  text={`${absence.absence_counter?.name ?? "-"} - ${absence.absence_type?.name ?? "-"}`}
                  color={absence.absence_type?.color}
                />
              </div>
            </div>

            {/* Date & Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <h4 className="font-medium text-sm">{t("absences.date", "Date")}</h4>
                <span className="text-sm">
                  {formatDateRange(absence.start_date, absence.end_date, {
                    useUTC: true,
                  })}
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="font-medium text-sm">{t("absences.duration", "Duration")}</h4>
                <span className="text-sm">
                  {formatDecimal(duration.value)}{" "}
                  {duration.unit === "days"
                    ? duration.value === 1
                      ? t("absences.day", "day")
                      : t("absences.days", "days")
                    : duration.value === 1
                      ? t("absences.hour", "hour")
                      : t("absences.hours", "hours")}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <h4 className="font-medium text-sm">{t("absences.notes", "Notes")}</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {absence.notes || "-"}
              </p>
            </div>

            {/* Response Info (if responded) */}
            {absence.responded_by && (
              <>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm">{t("absences.respondedBy", "Responded By")}</h4>
                    <EmployeeLabel data={absence.responded_by} link />
                  </div>

                  {absence.responded_at && (
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">{t("absences.respondedAt", "Responded At")}</h4>
                      <span className="text-sm">
                        {formatDate(new Date(absence.responded_at), {
                          showTime: true,
                          showYear: true,
                          useUTC: false,
                        })}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <h4 className="font-medium text-sm">{t("absences.reason", "Reason")}</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {absence.reason || "-"}
                    </p>
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Files */}
            <FilesSection
              entity_id={absence.id}
              showBreadcrumbs={true}
              showSearch={true}
              showCreateFolder={false}
              showUpload={true}
            />

            {/* Footer - Reject / Approve buttons only shown when renderFooterActions is provided */}
            {renderFooterActions && (
              <DialogFooter className="flex-col rounded-b-lg sm:flex-row gap-2 fixed bottom-0 left-0 right-0 bg-background p-4">
                {renderFooterActions(absence)}
              </DialogFooter>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">
              {t("absences.notFound", "Absence not found")}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AbsenceViewModal;
