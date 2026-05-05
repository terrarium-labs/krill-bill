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

export interface TimeRecordBulkActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    actionType: "approve" | "reject" | null;
    notes: string;
    onNotesChange: (notes: string) => void;
    onConfirm: () => void;
    isProcessing: boolean;
}

export const TimeRecordBulkActionModal = ({
    isOpen,
    onClose,
    actionType,
    notes,
    onNotesChange,
    onConfirm,
    isProcessing,
}: TimeRecordBulkActionModalProps) => {
    const { t } = useTranslation();

    if (!actionType) return null;

    const isReject = actionType === "reject";

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>
                        {actionType === "approve"
                            ? t("timeRecords.verifyAllTimeRecords", "Verify All Time Records")
                            : t("timeRecords.rejectAllTimeRecords", "Reject All Time Records")}
                    </DialogTitle>
                    <DialogDescription>
                        {actionType === "approve"
                            ? t(
                                "timeRecords.confirmApproveAll",
                                "Are you sure you want to approve all time records?"
                            )
                            : t(
                                "timeRecords.confirmRejectAll",
                                "Are you sure you want to reject all time records?"
                            )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                    <label htmlFor="bulk-notes" className="text-sm font-medium">
                        {t("employees.timeRecords.notes", "Notes")}
                        <span className="text-muted-foreground ml-1">
                            ({t("common.optional", "optional")})
                        </span>
                    </label>
                    <Textarea
                        id="bulk-notes"
                        placeholder={t(
                            "employees.timeRecords.notesPlaceholder",
                            "Add any notes about this verification..."
                        )}
                        value={notes}
                        onChange={(e) => onNotesChange(e.target.value)}
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
                        disabled={isProcessing}
                        variant={isReject ? "destructive" : "default"}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {t("common.processing", "Processing...")}
                            </>
                        ) : actionType === "approve" ? (
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

export default TimeRecordBulkActionModal;
