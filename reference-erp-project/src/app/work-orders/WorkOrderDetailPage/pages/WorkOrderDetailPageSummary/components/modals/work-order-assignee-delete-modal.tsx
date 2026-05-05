import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Assignee } from "@/types/field-service/work-orders/assignees";
import EmployeeLabel from "@/app/components/labels/employee-label";

export interface WorkOrderAssigneeDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    assignee: Assignee | null;
    onConfirm: (notes: string) => void | Promise<void>;
}

const WorkOrderAssigneeDeleteModal: React.FC<WorkOrderAssigneeDeleteModalProps> = ({
    open,
    onOpenChange,
    assignee,
    onConfirm,
}) => {
    const { t } = useTranslation();
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setNotes("");
        }
    }, [open]);

    const handleSubmit = async () => {
        if (!assignee) return;
        setSubmitting(true);
        try {
            await onConfirm(notes.trim());
            onOpenChange(false);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle className="text-lg">
                        {t("workOrders.unassignAssignee", "Unassign assignee")}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    {assignee && (
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">
                                {t("workOrders.employee", "Employee")}
                            </label>
                            <div className="rounded-md border bg-muted/30 px-3 py-2">
                                <EmployeeLabel data={assignee.employee} />
                            </div>
                        </div>
                    )}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">
                            {t("workOrders.notes", "Notes")}
                        </label>
                    <Textarea
                        placeholder={t("workOrders.enterNotesForUnassign", "Enter notes (reason for unassign)...")}
                        className="min-h-[100px]"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        disabled={submitting}
                    />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                    >
                        {t("common.cancel", "Cancel")}
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t("common.loading", "Loading...")}
                            </>
                        ) : (
                            t("common.unassign", "Unassign")
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default WorkOrderAssigneeDeleteModal;
