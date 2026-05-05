import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { File as FileType } from "@/types/general/files";

export interface FileDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    file: FileType | null;
    onConfirm: () => Promise<void>;
    isDeleting: boolean;
}

export const FileDeleteModal = ({
    open,
    onOpenChange,
    file,
    onConfirm,
    isDeleting,
}: FileDeleteModalProps) => {
    const { t } = useTranslation();

    if (!file) return null;

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t("files.deleteFile", "Delete File")}
            description={
                <>
                    {t(
                        "files.deleteFileConfirmation",
                        "Are you sure you want to delete this file? This action cannot be undone."
                    )}
                    <div className="mt-2 p-2 bg-muted rounded">
                        <strong>{file.name}</strong>
                        {file.is_dir && (
                            <span className="text-muted-foreground">
                                {" "}
                                (Folder)
                            </span>
                        )}
                    </div>
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default FileDeleteModal;
