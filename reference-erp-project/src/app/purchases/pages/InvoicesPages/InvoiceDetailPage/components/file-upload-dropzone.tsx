import { useTranslation } from "react-i18next";
import { useCallback, useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Image as ImageIcon, Loader2, ZoomIn, ZoomOut, Maximize, RotateCw, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { postOrgFilesUploader } from "@/api/orgs/files/files";
import { uploadFile } from "@/lib/uploaders_timbal";
import { useParams } from "react-router-dom";
import { useInvoice } from "../../contexts/InvoiceContext";

interface FileUploadDropzoneProps {
    disabled?: boolean;
}

// Enhanced Image Viewer Component
const ImageViewer = ({ src, alt = "Image preview" }: { src: string; alt?: string }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [rotation, setRotation] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const handleZoomIn = () => {
        setScale((prev) => Math.min(prev + 0.25, 5));
    };

    const handleZoomOut = () => {
        setScale((prev) => Math.max(prev - 0.25, 0.5));
    };

    const handleReset = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
        setRotation(0);
    };

    const handleRotate = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale((prev) => Math.max(0.5, Math.min(5, prev + delta)));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        // Ignore right-click to allow context menu
        if (e.button === 2) return;
        
        if (scale > 1) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y,
            });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && scale > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement && containerRef.current) {
            containerRef.current.requestFullscreen();
        } else if (document.fullscreenElement) {
            document.exitFullscreen();
        }
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full bg-background rounded-lg overflow-hidden group"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
        >
            {/* Control Bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomOut}
                    disabled={scale <= 0.5}
                    className="h-8 w-8"
                >
                    <ZoomOut className="h-4 w-4" />
                </Button>

                <span className="px-3 text-sm font-medium min-w-16 text-center">
                    {Math.round(scale * 100)}%
                </span>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomIn}
                    disabled={scale >= 5}
                    className="h-8 w-8"
                >
                    <ZoomIn className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1" />

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRotate}
                    className="h-8 w-8"
                >
                    <RotateCw className="h-4 w-4" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="h-8 w-8"
                >
                    <Maximize className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1" />

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="h-8 px-3 text-xs"
                >
                    Reset
                </Button>
            </div>

            {/* Image Container */}
            <div
                className={cn(
                    "w-full h-full flex items-center justify-center",
                    isDragging ? "cursor-grabbing" : scale > 1 ? "cursor-grab" : "cursor-default"
                )}
            >
                <img
                    ref={imageRef}
                    src={src}
                    alt={alt}
                    className="max-w-full max-h-full object-contain select-none transition-transform duration-200"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                    }}
                    draggable={false}
                />
            </div>
        </div>
    );
};

const FileUploadDropzone = ({ disabled = false }: FileUploadDropzoneProps) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const { invoice, setData } = useInvoice();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Get data from context
    const value = invoice.main_file;
    const entityId = invoice.id;
    const onChange = (fileUrl: string | null) => setData({ main_file: fileUrl });

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (!orgId || acceptedFiles.length === 0 || disabled) return;

        const file = acceptedFiles[0]; // Only take the first file
        setIsUploading(true);
        setUploadProgress(0);

        try {
            // Get uploader credentials
            const uploaderResponse = await postOrgFilesUploader(orgId, {
                entity_id: entityId,
                name: file.name,
                content_type: file.type,
                content_length: file.size,
            });

            if (!uploaderResponse.success) {
                toast.error(t('invoices.fileUploadFailed', 'Failed to upload file'));
                return;
            }

            // Upload file
            const contentUrl = await uploadFile(
                uploaderResponse.success.uploader,
                file,
                (progress: number) => {
                    setUploadProgress(progress);
                }
            );

            onChange(contentUrl as string);
            toast.success(t('invoices.fileUploadedSuccess', 'File uploaded successfully'));
        } catch (error) {
            console.error("Error uploading file:", error);
            toast.error(t('invoices.fileUploadError', 'Error uploading file'));
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    }, [orgId, onChange, disabled, t]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
        },
        multiple: false,
        disabled: disabled || isUploading,
        maxSize: 50 * 1024 * 1024, // 50MB max
    });

    // If file is uploaded, show preview with dropdown menu
    if (value && !isUploading) {
        const isPdf = value.toLowerCase().endsWith('.pdf');
        
        return (
            <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-lg">
                {/* Dropdown Menu for Delete */}
                <div className="absolute top-2 right-2 z-10">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                disabled={disabled}
                                className="h-8 w-8 bg-background/95 backdrop-blur-sm hover:bg-background shadow-sm"
                            >
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                                onClick={() => onChange(null)}
                                className="text-destructive focus:text-destructive cursor-pointer"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t('invoices.removeFile', 'Remove file')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* File Preview */}
                {isPdf ? (
                    <iframe
                        src={value}
                        className="w-full h-full rounded-lg"
                    >
                    </iframe>
                ) : (
                    <ImageViewer src={value} alt="Invoice preview" />
                )}
            </div>
        );
    }

    // Show dropzone or uploading state
    return (
        <div
            {...getRootProps()}
            className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                disabled && "opacity-50 cursor-not-allowed",
                isUploading && "cursor-wait",
                "flex h-full min-h-[12rem] min-w-52 flex-1 flex-col items-center justify-center"
            )}
        >
            <input {...getInputProps()} />

            {isUploading ? (
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <div className="space-y-1">
                        <p className="text-sm font-medium">
                            {t('invoices.uploading', 'Uploading...')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {uploadProgress}%
                        </p>
                    </div>
                    <div className="w-full max-w-xs h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-3">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div className="space-y-1">
                        <p className="text-sm font-medium">
                            {isDragActive
                                ? t('invoices.dropFileHere', 'Drop file here')
                                : t('invoices.dragDropFile', 'Drag & drop file here')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {t('invoices.orClickToSelect', 'or click to select')}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>PDF</span>
                        <span>•</span>
                        <ImageIcon className="h-4 w-4" />
                        <span>PNG, JPG, WEBP</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUploadDropzone;
