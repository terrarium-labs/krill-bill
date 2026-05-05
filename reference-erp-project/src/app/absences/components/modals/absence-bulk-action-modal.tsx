import { useTranslation } from "react-i18next";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface AbsenceBulkActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    actionType: "approve" | "reject" | null;
    reason: string;
    onReasonChange: (reason: string) => void;
    onConfirm: () => void;
    isProcessing: boolean;
}

export const AbsenceBulkActionModal = ({
    isOpen,
    onClose,
    actionType,
    reason,
    onReasonChange,
    onConfirm,
    isProcessing,
}: AbsenceBulkActionModalProps) => {
    const { t } = useTranslation();

    if (!actionType) return null;

    const isReject = actionType === "reject";
    const isDisabled = isProcessing || (isReject && !reason.trim());

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>
                        {actionType === "approve"
                            ? t("absences.approveAllAbsences", "Approve All Absences")
                            : t("absences.rejectAllAbsences", "Reject All Absences")}
                    </DialogTitle>
                    <DialogDescription>
                        {actionType === "approve"
                            ? t(
                                "absences.confirmApproveAll",
                                "Are you sure you want to approve all absences?"
                            )
                            : t(
                                "absences.confirmRejectAll",
                                "Are you sure you want to reject all absences?"
                            )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                    <label htmlFor="bulk-reason" className="text-sm font-medium">
                        {t("absences.reason", "Reason")} {isReject && "*"}
                    </label>
                    <Textarea
                        id="bulk-reason"
                        placeholder={t(
                            "absences.reasonPlaceholder",
                            "Add a reason for this decision..."
                        )}
                        value={reason}
                        onChange={(e) => onReasonChange(e.target.value)}
                        rows={4}
                        disabled={isProcessing}
                    />
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isProcessing}
                    >
                        {t("common.cancel", "Cancel")}
                    </Button>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        disabled={isDisabled}
                        variant={isReject ? "destructive" : "default"}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {t("common.processing", "Processing...")}
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

export default AbsenceBulkActionModal;