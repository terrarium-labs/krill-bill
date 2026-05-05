import { useTranslation } from "@/hooks/useTranslation";
import { TimeRecord } from "@/types/employees/time-records";
import { Employee } from "@/types/employees/employees";
import { formatDate, formatTimeToTravel } from "@/utils/miscelanea";
import { DeleteModal } from "@/app/components/modals/delete-modal";

export interface TimeRecordDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    timeRecord: TimeRecord | null;
    onConfirm: () => Promise<void>;
    isDeleting: boolean;
}

const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const minutes = durationMs / (1000 * 60);
    return formatTimeToTravel(minutes);
};

export const TimeRecordDeleteModal = ({
    isOpen,
    onClose,
    timeRecord,
    onConfirm,
    isDeleting,
}: TimeRecordDeleteModalProps) => {
    const { t } = useTranslation();

    if (!timeRecord) return null;

    const employee = timeRecord.employee as Employee;
    const employeeName = `${employee.first_name || ""} ${employee.last_name || ""}`.trim();

    return (
        <DeleteModal
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            title={t(
                "employees.timeRecords.deleteTimeRecord",
                "Delete Time Record"
            )}
            description={t(
                "employees.timeRecords.deleteTimeRecordDescription",
                "Are you sure you want to delete this time record? This action cannot be undone."
            )}
            onConfirm={onConfirm}
            isDeleting={isDeleting}
            contentClassName="max-w-md"
        >
            <div className="space-y-2 p-3 rounded-md bg-muted/50 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">
                        {t("employees.timeRecords.employee", "Employee")}:
                    </span>
                    <span className="font-medium">{employeeName}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">
                        {t("employees.timeRecords.period", "Period")}:
                    </span>
                    <span className="font-medium">
                        {formatDate(timeRecord.start_time, { showTime: true })} -{" "}
                        {formatDate(timeRecord.end_time, { showTime: true })}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">
                        {t("employees.timeRecords.duration", "Duration")}:
                    </span>
                    <span className="font-medium">
                        {calculateDuration(
                            timeRecord.start_time,
                            timeRecord.end_time
                        )}
                    </span>
                </div>
            </div>
        </DeleteModal>
    );
};

export default TimeRecordDeleteModal;
