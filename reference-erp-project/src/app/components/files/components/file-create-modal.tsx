import { useTranslation } from "react-i18next";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export interface FileCreateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    folderName: string;
    onFolderNameChange: (name: string) => void;
    onCreate: () => Promise<void>;
    isCreating: boolean;
}

export const FileCreateModal = ({
    open,
    onOpenChange,
    folderName,
    onFolderNameChange,
    onCreate,
    isCreating,
}: FileCreateModalProps) => {
    const { t } = useTranslation();

    const handleClose = () => {
        onOpenChange(false);
        onFolderNameChange("");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>{t("files.createFolder", "Create Folder")}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Input
                        value={folderName}
                        onChange={(e) => onFolderNameChange(e.target.value)}
                        placeholder={t("files.folderNamePlaceholder", "Folder name")}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && folderName.trim() && !isCreating) {
                                onCreate();
                            }
                        }}
                    />
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={isCreating}
                    >
                        {t("common.cancel", "Cancel")}
                    </Button>
                    <Button
                        type="button"
                        onClick={onCreate}
                        disabled={isCreating || !folderName.trim()}
                    >
                        {isCreating ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t("common.creating", "Creating...")}
                            </>
                        ) : (
                            t("common.create", "Create")
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FileCreateModal;
