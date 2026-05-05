import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ShieldAlert, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SensitiveDataWarningModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    confirmText?: string;
}

const SensitiveDataWarningModal = ({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    confirmText,
}: SensitiveDataWarningModalProps) => {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-amber-500" />
                        {title || t("sensitive.warning", "Sensitive Data Warning")}
                    </DialogTitle>
                    <DialogDescription>
                        {description || t("sensitive.description", "You are about to view sensitive information. Please ensure you are in a private environment and that no unauthorized persons can see your screen.")}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        {t("common.cancel", "Cancel")}
                    </Button>
                    <Button onClick={onConfirm}>
                        <Eye className="h-4 w-4" />
                        {confirmText || t("sensitive.confirm", "View Data")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SensitiveDataWarningModal;

