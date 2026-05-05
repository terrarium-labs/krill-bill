import React from "react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AbsenceCounter } from "@/types/general/absences";

interface AbsencePolicyCounterUnsafeEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    counter?: AbsenceCounter | null;
}

const AbsencePolicyCounterUnsafeEditModal: React.FC<
    AbsencePolicyCounterUnsafeEditModalProps
> = ({ open, onOpenChange, onConfirm, counter }) => {
    const { t } = useTranslation();

    const handleCancel = () => {
        onOpenChange(false);
    };

    const handleConfirm = () => {
        onOpenChange(false);
        onConfirm();
    };

    return (
        <AlertDialog open={open} onOpenChange={(o) => onOpenChange(o)}>
            <AlertDialogContent className="sm:max-w-[425px]">
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {t(
                            "absence-policies.counters.unsafeEditTitle",
                            "Edit absence counter"
                        )}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {t(
                            "absence-policies.counters.unsafeEditDescription",
                            "You are about to edit an absence policy counter. Changes can affect existing calculations and data already saved for this policy (e.g. balances and usage). This may break systems or corrupt stored values. Are you sure you want to continue?"
                        )}
                        {counter?.name && (
                            <span className="mt-2 block font-medium text-foreground">
                                {t("absence-policies.counters.counter", "Counter")}: {counter.name}
                            </span>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex gap-2 sm:gap-2 justify-end">
                    <Button variant="outline" onClick={handleCancel}>
                        {t("common.cancel", "Cancel")}
                    </Button>
                    <Button onClick={handleConfirm}>
                        {t("absence-policies.counters.unsafeEditConfirm", "Continue")}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default AbsencePolicyCounterUnsafeEditModal;
