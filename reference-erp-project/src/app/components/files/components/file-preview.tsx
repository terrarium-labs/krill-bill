import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { File } from "@/types/general/files";
import { AttachedFile } from "@/app/chat/components/chat-input";
import { getFileTypeInfo } from "@/utils/miscelanea";

interface FilePreviewProps {
    files: (File | AttachedFile)[];
    className?: string;
    variant?: "message" | "input";
}

// Helper to determine if a file is an image
const isImageFile = (file: File | AttachedFile): boolean => {
    if ('type' in file && file.type) {
        return file.type === 'image' || file.file?.type.startsWith('image/');
    }
    const name = 'name' in file ? file.name : file.file?.name || '';
    return /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(name);
};

// Get file URL for preview
const getFileUrl = (file: File | AttachedFile): string | null => {
    if ('url' in file) {
        return file.url;
    }
    if ('file' in file && file.file) {
        return URL.createObjectURL(file.file);
    }
    return null;
};

// Get file name
const getFileName = (file: File | AttachedFile): string => {
    if ('name' in file && typeof file.name === 'string') {
        return file.name;
    }
    if ('file' in file && file.file) {
        return file.file.name;
    }
    return 'Unknown file';
};

export const FilePreview = ({ files, className }: FilePreviewProps) => {
    if (!files || files.length === 0) return null;

    return (
        <div className={cn("flex flex-wrap gap-2 mt-2", className)}>
            {files.map((file, index) => {
                const fileName = getFileName(file);
                const fileUrl = getFileUrl(file);
                const isImage = isImageFile(file);
                const fileTypeInfo = getFileTypeInfo(fileName);
                const fileId = 'id' in file ? file.id : `temp-${index}`;

                if (isImage && fileUrl) {
                    // Image thumbnail
                    return (
                        <div
                            key={fileId}
                            className="w-10 h-10 rounded-lg overflow-hidden border border-border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => fileUrl ? window.open(fileUrl, '_blank') : null}
                            title={fileName}>
                            <img
                                src={fileUrl}
                                alt={fileName}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    );
                }

                // Generic file with icon
                return (
                    <div
                        key={fileId}
                        className="relative group rounded-lg overflow-hidden border border-border bg-muted/30 hover:bg-muted/50 transition-colors flex flex-row items-center gap-3 p-2 h-10 w-52 cursor-pointer"
                        onClick={() => fileUrl ? window.open(fileUrl, '_blank') : null}
                        title={fileName}>
                        <div className={cn("rounded-md p-1 shrink-0 h-6 w-6 flex items-center justify-center", fileTypeInfo.color)}>
                            <Icon icon={fileTypeInfo.icon} className="h-4 w-4 shrink-0 text-white" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <div className="text-xs font-medium text-muted-foreground">
                                {fileTypeInfo.label}
                            </div>
                            <div className="text-xs text-foreground truncate group-hover:underline">
                                {fileName}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
