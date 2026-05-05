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
import { File as FileType } from "@/types/general/files";

export interface FileEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    file: FileType | null;
    fileName: string;
    onFileNameChange: (name: string) => void;
    onSave: () => Promise<void>;
    isSaving: boolean;
}

export const FileEditModal = ({
    open,
    onOpenChange,
    file,
    fileName,
    onFileNameChange,
    onSave,
    isSaving,
}: FileEditModalProps) => {
    const { t } = useTranslation();

    if (!file) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>{t("files.editFile", "Edit File")}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Input
                        value={fileName}
                        onChange={(e) => onFileNameChange(e.target.value)}
                        placeholder={t("files.fileNamePlaceholder", "File name")}
                    />
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSaving}
                    >
                        {t("common.cancel", "Cancel")}
                    </Button>
                    <Button
                        type="button"
                        onClick={onSave}
                        disabled={isSaving || !fileName.trim()}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t("common.saving", "Saving...")}
                            </>
                        ) : (
                            t("common.save", "Save")
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FileEditModal;
