import { useTranslation } from "react-i18next";
import { Copy, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { AlertTitle } from "@/components/ui/alert";

interface ApiKeyViewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    token: string;
    onClose: () => void;
}

const ApiKeyViewModal = ({
    open,
    onOpenChange,
    token,
    onClose,
}: ApiKeyViewModalProps) => {
    const { t } = useTranslation();

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success(t("apiKeys.copySuccess", "API key copied to clipboard"));
    };

    const handleClose = () => {
        onOpenChange(false);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                        {t("apiKeys.newTokenTitle", "This is your API key")}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                            value={token}
                            readOnly
                            className="font-mono text-xs sm:text-sm flex-1 min-w-0"
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copyToClipboard(token)}
                        >
                            <Copy className="h-4 w-4 mr-2 sm:mr-0" />
                            <span className="sm:hidden">{t("apiKeys.copyKey", "Copy key")}</span>
                        </Button>
                    </div>
                    <div className="text-muted-foreground text-sm p-2 bg-amber-500/10 rounded-md flex flex-col gap-2">
                        <AlertTitle className="text-amber-500 flex items-center gap-2">
                            <TriangleAlert className="h-4 w-4 text-amber-500"  />
                            {t("apiKeys.newTokenDescriptionTitle", "Important")}
                        </AlertTitle>
                        {t("apiKeys.newTokenDescription", "This key not be shown again. Ensure you copy it before closing this dialog and save it in a secure place.")}
                    </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button onClick={handleClose} className="w-full sm:w-auto">
                        {t("apiKeys.tokenSaved", "I've copied my key")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ApiKeyViewModal; 