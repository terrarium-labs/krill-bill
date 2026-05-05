import { useTranslation } from "react-i18next";
import { OnCallShift } from "@/types/field-service/on-call/on-call-shifts";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { formatDate } from "@/utils/miscelanea";

export interface OnCallShiftDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: OnCallShift | null;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export const OnCallShiftDeleteModal = ({
  isOpen,
  onClose,
  shift,
  onConfirm,
  isDeleting,
}: OnCallShiftDeleteModalProps) => {
  const { t } = useTranslation();

  if (!shift) return null;

  const groupName = shift.group?.name ?? "";
  const startDateStr = formatDate(shift.start_date, {
    showTime: false,
    showYear: true,
    useUTC: true,
    showDayName: false,
  });
  const endDateStr = formatDate(shift.end_date, {
    showTime: false,
    showYear: true,
    useUTC: true,
    showDayName: false,
  });
  const dateRange =
    shift.start_date === shift.end_date
      ? startDateStr
      : `${startDateStr} – ${endDateStr}`;
  const employeeCount =
    (shift.employees?.length ?? 0) + (shift.exception_employees?.length ?? 0);

  return (
    <DeleteModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t("on-call.shifts.deleteConfirmTitle", "Delete shift?")}
      description={t(
        "on-call.shifts.deleteConfirmDescription",
        "This action cannot be undone. Are you sure you want to delete this shift?"
      )}
      onConfirm={onConfirm}
      isDeleting={isDeleting}
      contentClassName="max-w-md"
    >
      <div className="space-y-2 p-3 rounded-md bg-muted/50 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            {t("on-call.groups.title", "Group")}:
          </span>
          <span className="font-medium">{groupName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            {t("on-call.shifts.dateRange", "Date range")}:
          </span>
          <span className="font-medium">{dateRange}</span>
        </div>
        {employeeCount > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {t("on-call.shifts.employees", "Employees")}:
            </span>
            <span className="font-medium">{employeeCount}</span>
          </div>
        )}
      </div>
    </DeleteModal>
  );
};

export default OnCallShiftDeleteModal;
