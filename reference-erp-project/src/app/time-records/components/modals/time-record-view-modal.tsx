import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { TimeRecord } from "@/types/employees/time-records";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import IdBadge from "@/app/components/id-badge";
import Tag from "@/app/components/tag/tag";
import { formatDate, formatDateRange } from "@/utils/miscelanea";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";

interface TimeRecordViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeRecord: TimeRecord | null;
  /** Render custom action buttons in the header (right side, next to ID badge). */
  renderActions?: (timeRecord: TimeRecord) => React.ReactNode;
  /** Render custom footer actions (e.g., Reject/Approve). Only shown when provided. */
  renderFooterActions?: (timeRecord: TimeRecord) => React.ReactNode;
  /** Whether to show the employee info (useful when viewing from admin/manager contexts) */
  showEmployeeInfo?: boolean;
}

const getStatusColor = (status: string) => {
  if (status === "approved") return "green";
  if (status === "rejected") return "red";
  return "yellow"; // default to yellow
};

const TimeRecordViewModal: React.FC<TimeRecordViewModalProps> = ({
  open,
  onOpenChange,
  timeRecord,
  renderActions,
  renderFooterActions,
  showEmployeeInfo = true,
}) => {
  const { t } = useTranslation();

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return t("employees.timeRecords.status.approved", "Approved");
      case "rejected":
        return t("employees.timeRecords.status.rejected", "Rejected");
      default:
        return t("employees.timeRecords.status.pending", "Pending");
    }
  };

  if (!timeRecord) return null;

  // Get employee display info
  const employee = timeRecord.employee;

  // Calculate duration
  const calculateDuration = (): { hours: number; minutes: number } => {
    if (!timeRecord.start_time || !timeRecord.end_time) {
      return { hours: 0, minutes: 0 };
    }
    const startTime = new Date(timeRecord.start_time);
    const endTime = new Date(timeRecord.end_time);
    const diffMs = endTime.getTime() - startTime.getTime();
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return { hours, minutes };
  };

  const duration = calculateDuration();
  const formatDuration = () => {
    if (duration.hours === 0 && duration.minutes === 0) {
      return "-";
    }
    if (duration.hours === 0) {
      return `${duration.minutes} ${duration.minutes === 1 ? t("common.minute", "minute") : t("common.minutes", "minutes")}`;
    }
    if (duration.minutes === 0) {
      return `${duration.hours} ${duration.hours === 1 ? t("common.hour", "hour") : t("common.hours", "hours")}`;
    }
    return `${duration.hours} ${duration.hours === 1 ? t("common.hour", "hour") : t("common.hours", "hours")} ${duration.minutes} ${duration.minutes === 1 ? t("common.minute", "minute") : t("common.minutes", "minutes")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full md:max-w-5xl " showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold">
            <span>
              {t("employees.timeRecords.viewTimeRecord", "Time Record Details")}
            </span>
            <div className="flex items-center gap-2">
              <Tag
                text={getStatusText(timeRecord.verification_status)}
                color={getStatusColor(timeRecord.verification_status)}
                className="capitalize"
              />
              <IdBadge id={timeRecord.id} />
              {renderActions?.(timeRecord)}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto max-h-[60vh] px-2 scrollbar-hide mb-16">
          {/* Employee Info */}
          {showEmployeeInfo && employee && (
            <div className="space-y-1">
              <h4 className="font-medium text-sm">{t("employees.timeRecords.employee", "Employee")}</h4>
              <EmployeeAvatar employee={employee} />
            </div>
          )}

          {/* Date & Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <h4 className="font-medium text-sm">{t("employees.timeRecords.date", "Date")}</h4>
              <span className="text-sm">
                {timeRecord.end_time
                  ? formatDateRange(timeRecord.start_time, timeRecord.end_time, {
                      useUTC: false,
                    })
                  : formatDate(timeRecord.start_time, {
                      showTime: true,
                      showYear: true,
                      useUTC: false,
                    })}
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="font-medium text-sm">{t("employees.timeRecords.duration", "Duration")}</h4>
              <span className="text-sm font-semibold">
                {formatDuration()}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <h4 className="font-medium text-sm">{t("employees.timeRecords.notes", "Notes")}</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {timeRecord.notes || "-"}
            </p>
          </div>

          {/* Verification Info (if verified) */}
          {timeRecord.verified_by && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">{t("employees.timeRecords.verifiedBy", "Verified By")}</h4>
                  <EmployeeAvatar employee={timeRecord.verified_by} />
                </div>

                {timeRecord.verified_at && (
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm">{t("employees.timeRecords.verifiedAt", "Verified At")}</h4>
                    <span className="text-sm">
                      {formatDate(new Date(timeRecord.verified_at), {
                        showTime: true,
                        showYear: true,
                        useUTC: false,
                      })}
                    </span>
                  </div>
                )}

                <div className="space-y-1">
                  <h4 className="font-medium text-sm">{t("employees.timeRecords.verificationNotes", "Verification Notes")}</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {timeRecord.verification_notes || "-"}
                  </p>
                </div>
              </div>
            </>
          )}



          {/* Created/Updated timestamps and Last Modified By */}
          {/*
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <h4 className="font-medium text-sm">{t("common.createdAt", "Created At")}</h4>
              <span className="text-sm">
                {formatDate(new Date(timeRecord.created_at), {
                  showTime: true,
                  showYear: true,
                  useUTC: false,
                })}
              </span>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium text-sm">{t("common.updatedAt", "Updated At")}</h4>
              <span className="text-sm">
                {formatDate(new Date(timeRecord.updated_at), {
                  showTime: true,
                  showYear: true,
                  useUTC: false,
                })}
              </span>
            </div>
            {timeRecord.last_modified_by && (
              <>
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">{t("employees.timeRecords.lastModifiedBy", "Last Modified By")}</h4>
                  <EmployeeAvatar employee={timeRecord.last_modified_by} />
                </div>
              </>
            )}
          </div>
          */}

          {/* Footer - Reject / Approve buttons only shown when renderFooterActions is provided */}
          {renderFooterActions && (
            <DialogFooter className="flex-col rounded-b-lg sm:flex-row gap-2 fixed bottom-0 left-0 right-0 bg-background p-4">
              {renderFooterActions(timeRecord)}
            </DialogFooter>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimeRecordViewModal;
