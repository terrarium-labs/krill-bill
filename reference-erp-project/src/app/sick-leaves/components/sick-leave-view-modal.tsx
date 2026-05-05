import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { SickLeave } from "@/types/employees/sick-leaves";
import { formatDate } from "@/utils/miscelanea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import IdBadge from "@/app/components/id-badge";
import EmployeeLabel from "@/app/components/labels/employee-label";
import FilesSection from "@/app/components/files/files-section";

interface SickLeaveViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sickLeave: SickLeave | null;
  /** Render custom action buttons in the header (right side, next to ID badge). */
  renderActions?: (sickLeave: SickLeave) => React.ReactNode;
  /** Render custom footer actions. Only shown when provided. */
  renderFooterActions?: (sickLeave: SickLeave) => React.ReactNode;
  /** The ID of the employee to view the sick leave for. */
  employeeId?: string;
}

const SickLeaveViewModal: React.FC<SickLeaveViewModalProps> = ({
  open,
  onOpenChange,
  sickLeave,
  renderActions,
  renderFooterActions,
  employeeId,
}) => {
  const { t } = useTranslation();

  const format = (dateString: string) =>
    formatDate(new Date(dateString), {
      showTime: true,
      showYear: true,
      useUTC: true,
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full md:max-w-3xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold">
            <span>{t("sickLeaves.viewTitle", "Sick Leave Details")}</span>
            {sickLeave && (
              <div className="flex items-center gap-2">
                <IdBadge id={sickLeave.id} />
                {renderActions?.(sickLeave)}
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        {!sickLeave ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">
              {t("sickLeaves.notFound", "Sick leave not found")}
            </p>
          </div>
        ) : (
          <div className="space-y-6 overflow-y-auto max-h-[60vh] px-2 scrollbar-hide">
            <div className="grid grid-cols-1 md:grid-cols-2 col-span-1 md:col-span-2">
              {/* Employee - only show when not viewing own absences */}
              {employeeId !== "me" && sickLeave.employee && (
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">{t("absences.employee", "Employee")}</h4>
                  <EmployeeLabel data={sickLeave.employee} link />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1 md:col-span-1">
                <h4 className="font-medium text-sm">
                  {t("sickLeaves.titleLabel", "Title")}
                </h4>
                <span className="text-sm">{sickLeave.name || "-"}</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-medium text-sm">
                  {t("sickLeaves.startDate", "From date")}
                </h4>
                <span className="text-sm">{format(sickLeave.start_date)}</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-medium text-sm">
                  {t("sickLeaves.endDate", "To date")}
                </h4>
                <span className="text-sm">{format(sickLeave.end_date)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="font-medium text-sm">
                {t("sickLeaves.description", "Description")}
              </h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {sickLeave.description || "-"}
              </p>
            </div>

            <Separator />

            <FilesSection
              entity_id={sickLeave.id}
              showBreadcrumbs={true}
              showSearch={true}
              showCreateFolder={false}
              showUpload={true}
            />

            {renderFooterActions && (
              <>
                <Separator />
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  {renderFooterActions(sickLeave)}
                </DialogFooter>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SickLeaveViewModal;
