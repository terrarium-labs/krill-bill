import { useTranslation } from "@/hooks/useTranslation";
import { TimeRecord } from "@/types/employees/time-records";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { Employee } from "@/types/employees/employees";
import { formatDate, formatTimeToTravel } from "@/utils/miscelanea";

export interface TimeRecordVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    timeRecord: TimeRecord | null;
    verificationStatus: "approved" | "rejected";
    verificationNotes: string;
    onNotesChange: (notes: string) => void;
    onSubmit: () => void;
    isSubmitting: boolean;
}

const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const minutes = durationMs / (1000 * 60);
    return formatTimeToTravel(minutes);
};

export const TimeRecordVerificationModal = ({
    isOpen,
    onClose,
    timeRecord,
    verificationStatus,
    verificationNotes,
    onNotesChange,
    onSubmit,
    isSubmitting,
}: TimeRecordVerificationModalProps) => {
    const { t } = useTranslation();

    if (!timeRecord) return null;

    const employee = timeRecord.employee as Employee;
    const employeeName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim();

    const getStatusTitle = () => {
        switch (verificationStatus) {
            case "approved":
                return t("employees.timeRecords.verifyTimeRecord", "Verify Time Record");
            case "rejected":
                return t("employees.timeRecords.rejectTimeRecord", "Reject Time Record");
            default:
                return t("employees.timeRecords.updateStatus", "Update Status");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>
                        {getStatusTitle()}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2 p-3 rounded-md bg-muted/50 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                {t("employees.timeRecords.employee", "Employee")}:
                            </span>
                            <span className="font-medium">
                                {employeeName}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                {t("employees.timeRecords.period", "Period")}:
                            </span>
                            <span className="font-medium">
                                {formatDate(timeRecord.start_time, { showTime: true })} - {formatDate(timeRecord.end_time, { showTime: true })}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                {t("employees.timeRecords.duration", "Duration")}:
                            </span>
                            <span className="font-medium">
                                {calculateDuration(timeRecord.start_time, timeRecord.end_time)}
                            </span>
                        </div>
                        {timeRecord.notes && (
                            <div className="pt-2 border-t">
                                <span className="text-muted-foreground">
                                    {t("employees.timeRecords.notes", "Notes")}:
                                </span>
                                <p className="mt-1 text-sm whitespace-pre-wrap">
                                    {timeRecord.notes}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="verification_notes">
                            {t("employees.timeRecords.verificationNotes", "Verification Notes")}
                            <span className="text-muted-foreground ml-1">
                                ({t("common.optional", "optional")})
                            </span>
                        </Label>
                        <Textarea
                            id="verification_notes"
                            placeholder={t(
                                "employees.timeRecords.verificationNotesPlaceholder",
                                "Add any notes about this verification..."
                            )}
                            value={verificationNotes}
                            onChange={(e) => onNotesChange(e.target.value)}
                            rows={4}
                            className="resize-none"
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        {t("common.cancel", "Cancel")}
                    </Button>
                    <Button
                        onClick={onSubmit}
                        disabled={isSubmitting}
                        variant={verificationStatus === "approved" ? "default" : "destructive"}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {t("common.submitting", "Submitting...")}
                            </>
                        ) : verificationStatus === "approved" ? (
                            t("common.approve", "Approve")
                        ) : (
                            t("common.reject", "Reject")
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default TimeRecordVerificationModal;

