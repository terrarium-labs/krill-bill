import { useTranslation } from "react-i18next";
import { Absence } from "@/types/employees/absences";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface AbsenceVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    absence: Absence | null;
    verificationStatus: "approved" | "rejected" | "cancelled";
    verificationReason: string;
    onReasonChange: (reason: string) => void;
    onSubmit: () => void;
    isSubmitting: boolean;
}

export const AbsenceVerificationModal = ({
    isOpen,
    onClose,
    absence,
    verificationStatus,
    verificationReason,
    onReasonChange,
    onSubmit,
    isSubmitting,
}: AbsenceVerificationModalProps) => {
    const { t } = useTranslation();

    if (!absence) return null;

    const getStatusTitle = () => {
        switch (verificationStatus) {
            case "approved":
                return t("absences.approveAbsence", "Approve Absence");
            case "rejected":
                return t("absences.rejectAbsence", "Reject Absence");
            case "cancelled":
                return t("absences.cancelAbsence", "Cancel Absence");
            default:
                return t("absences.updateStatus", "Update Status");
        }
    };

    const employee = absence.employee;
    const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
    const displayName = fullName || employee.email || '-';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle >
                        {getStatusTitle()}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="text-sm">
                            <span className="font-medium">{t("absences.employee", "Employee")}: </span>
                            <span>{displayName}</span>
                        </div>
                        <div className="text-sm">
                            <span className="font-medium">{t("absences.absenceType", "Absence Type")}: </span>
                            <span>{absence.absence_type.name}</span>
                        </div>
                        <div className="text-sm">
                            <span className="font-medium">{t("absences.period", "Period")}: </span>
                            <span>
                                {format(new Date(absence.start_date), "MMM dd, yyyy")} - {format(new Date(absence.end_date), "MMM dd, yyyy")}
                            </span>
                        </div>
                        {absence.notes && (
                            <div className="text-sm">
                                <span className="font-medium">{t("absences.notes", "Notes")}: </span>
                                <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{absence.notes}</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="reason" className="text-sm font-medium">
                            {t("absences.notes", "Notes")} {verificationStatus === "rejected" && "*"}
                        </label>
                        <Textarea
                            id="reason"
                            placeholder={t("absences.notesPlaceholder", "Add any notes about this verification...")}
                            value={verificationReason}
                            onChange={(e) => onReasonChange(e.target.value)}
                            rows={4}
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
                        disabled={isSubmitting || (verificationStatus === "rejected" && !verificationReason.trim())}
                        variant={verificationStatus === "rejected" ? "destructive" : "default"}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {t("common.submitting", "Submitting...")}
                            </>
                        ) : (
                            t("common.confirm", "Confirm")
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AbsenceVerificationModal;