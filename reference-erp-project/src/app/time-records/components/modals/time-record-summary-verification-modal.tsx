import { useTranslation } from "@/hooks/useTranslation";
import { TimeRecordSummary } from "@/types/general/time-records";
import { formatDate } from "@/utils/miscelanea";
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

function sameCalendarDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

export interface TimeRecordSummaryVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    summary: TimeRecordSummary | null;
    /** When set (e.g. from verify snapshot), overrides `summary.day` for the period label. */
    verificationRange?: { from: Date; to: Date };
    verificationStatus: "approved" | "rejected";
    verificationNotes: string;
    onNotesChange: (notes: string) => void;
    onSubmit: () => void;
    isSubmitting: boolean;
}

// Format time to always show "XXh XXmin" format
const formatTimeAlways = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}h ${mins}min`;
};

export const TimeRecordSummaryVerificationModal = ({
    isOpen,
    onClose,
    summary,
    verificationRange,
    verificationStatus,
    verificationNotes,
    onNotesChange,
    onSubmit,
    isSubmitting,
}: TimeRecordSummaryVerificationModalProps) => {
    const { t } = useTranslation();

    const periodLabel = (() => {
        if (verificationRange) {
            const { from, to } = verificationRange;
            if (sameCalendarDay(from, to)) {
                return formatDate(from, {
                    showTime: false,
                    showDayName: true,
                    showMonthName: true,
                    showYear: true,
                });
            }
            return `${formatDate(from, { showTime: false, showDayName: false, showMonthName: true, showYear: true })} – ${formatDate(to, { showTime: false, showDayName: false, showMonthName: true, showYear: true })}`;
        }
        if (summary?.day) {
            return new Date(summary.day).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        }
        return "";
    })();

    const periodFieldLabel =
        verificationRange && !sameCalendarDay(verificationRange.from, verificationRange.to)
            ? t("timeRecords.summary.period", "Period")
            : t("timeRecords.summary.day", "Day");

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>
                        {verificationStatus === "approved"
                            ? t("employees.timeRecords.verifyTimeRecord", "Verify Time Records")
                            : t("employees.timeRecords.rejectTimeRecord", "Reject Time Records")}
                    </DialogTitle>
                </DialogHeader>

                {summary && (
                    <div className="space-y-4">
                        <div className="space-y-2 p-3 rounded-md bg-muted/50 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{periodFieldLabel}:</span>
                                <span className="font-medium text-right">{periodLabel}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    {t("timeRecords.summary.timeWorked", "Time Worked")}:
                                </span>
                                <span className="font-medium">
                                    {formatTimeAlways(summary.total_time_worked)} / {formatTimeAlways(summary.theoretical_time_worked)}
                                </span>
                            </div>
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
                )}

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

export default TimeRecordSummaryVerificationModal;

