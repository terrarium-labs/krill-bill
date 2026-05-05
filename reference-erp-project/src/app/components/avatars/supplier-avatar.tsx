import React, { useRef, useState } from "react";
import { getColorFromString } from "@/utils/miscelanea";
import { cn } from "@/lib/utils";
import { Supplier } from "@/types/suppliers/supplier";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, Trash } from "lucide-react";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useParams } from "react-router-dom";
import { postOrgFilesV2 } from "@/api/orgs/files/files";
import { patchSupplier } from "@/api/suppliers/suppliers";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

/**
 * SupplierAvatar component - Displays a supplier's avatar with their trade name
 * 
 * @param supplier - The supplier object containing trade_name, photo_url, and email
 * @param showName - Whether to display the trade name next to the avatar (default: true)
 * @param showNameExtra - Whether to display the extra name next to the trade name in parentheses (default: false)
 * @param showEmail - Whether to display the email next to the name (default: false)
 * @param size - Size of the avatar: "sm" (6), "md" (8), "lg" (10), "xl" (12), "2xl" (14) (default: "sm")
 * @param variant - Display variant: "truncate" (default, limits text to one line) or "full" (shows full text)
 * @param onClick - Optional click handler function
 * @param className - Additional class name for the container
 * @param children - Optional children to render inside the avatar
 * @param imageEditable - Whether the image can be edited (default: false)
 * @param onImageChange - Optional callback when the image is changed
 */
interface SupplierAvatarProps {
    supplier: Supplier | null;
    showName?: boolean;
    showNameExtra?: boolean;
    showEmail?: boolean;
    size?: "sm" | "md" | "lg" | "xl" | "2xl";
    variant?: "truncate" | "full";
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    className?: string;
    children?: React.ReactNode;
    imageEditable?: boolean;
    onImageChange?: () => void;
}

export const SupplierAvatar: React.FC<SupplierAvatarProps> = ({
    supplier,
    showName = true,
    showNameExtra = false,
    showEmail = false,
    size = "sm",
    variant = "truncate",
    onClick,
    className,
    children,
    imageEditable = false,
    onImageChange,
}) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    if (!supplier) {
        return <span className="text-muted-foreground">-</span>;
    }

    const displayName = supplier.trade_name || "-";
    const avatarFallback = displayName.slice(0, 1).toUpperCase() || "-";

    const handleImageClick = () => {
        if (imageEditable && !isUploading) {
            fileInputRef.current?.click();
        }
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !orgId || !supplier.id) return;

        // Validate that it's an image
        if (!file.type.startsWith("image/")) {
            toast.error(t("common.onlyImageFiles", "Only image files are allowed"));
            return;
        }

        setIsUploading(true);
        try {
            const name = 'prof_' + supplier.id + '_' + Math.random().toString(36).substring(2, 15);
            // Get uploader from server
            const contentUrlResponse = await postOrgFilesV2(orgId, 'profile_pictures', name, file.size, file.type, file, null);
            if (!contentUrlResponse.success) {
                throw new Error("Failed to upload file");
            }

            const contentUrl = contentUrlResponse.success.url as string;

            // Update supplier with new photo URL
            const response = await patchSupplier(orgId, supplier.id, {
                photo_url: contentUrl,
            });

            if (response.success) {
                toast.success(t("suppliers.photoUpdatedSuccess", "Photo updated successfully"));
                onImageChange?.();
            } else {
                toast.error(t("suppliers.photoUpdateError", "Failed to update photo"));
            }
        } catch (error) {
            console.error("Error uploading photo:", error);
            toast.error(t("suppliers.photoUploadError", "Failed to upload photo"));
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemovePhoto = async () => {
        if (!orgId || !supplier.id) return;

        setIsUploading(true);
        try {
            const response = await patchSupplier(orgId, supplier.id, {
                photo_url: null,
            });

            if (response.success) {
                toast.success(t("suppliers.photoRemovedSuccess", "Photo removed successfully"));
                onImageChange?.();
            } else {
                toast.error(t("suppliers.photoRemoveError", "Failed to remove photo"));
            }
        } catch (error) {
            console.error("Error removing photo:", error);
            toast.error(t("suppliers.photoRemoveError", "Failed to remove photo"));
        } finally {
            setIsUploading(false);
        }
    };

    const sizeClasses = {
        sm: "h-6 w-6 rounded",
        md: "h-8 w-8 rounded",
        lg: "h-10 w-10 rounded",
        xl: "h-12 w-12 rounded-lg",
        "2xl": "h-14 w-14 rounded-lg",
    };

    const borderRadiusClasses = {
        sm: "rounded",
        md: "rounded",
        lg: "rounded",
        xl: "rounded-lg",
        "2xl": "rounded-lg",
    };

    const textSizeClasses = {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
        xl: "text-xl",
        "2xl": "text-2xl",
    };

    const fallbackTextClasses = {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
        xl: "text-xl",
        "2xl": "text-2xl font-bold",
    };

    const hasClickHandler = !!onClick;
    const textTruncateClass = variant === "truncate" ? "line-clamp-1" : "";

    const avatarElement = (
        <div
            className="relative"
            onMouseEnter={() => imageEditable && setIsHovering(true)}
            onMouseLeave={() => imageEditable && setIsHovering(false)}
        >
            <Avatar
                className={cn(
                    sizeClasses[size],
                    hasClickHandler && !showName && "cursor-pointer hover:underline",
                    imageEditable && "cursor-pointer",
                    imageEditable && isHovering && "shadow-lg transition-shadow duration-200"
                )}
                onClick={imageEditable ? handleImageClick : hasClickHandler && !showName ? onClick : undefined}
            >
                <AvatarImage
                    src={supplier.photo_url || ""}
                    alt={displayName}
                    className="object-cover"
                />
                <AvatarFallback
                    className={cn(
                        "font-medium text-white",
                        sizeClasses[size],
                        fallbackTextClasses[size]
                    )}
                    style={{ backgroundColor: getColorFromString(displayName) }}
                >
                    {avatarFallback}
                </AvatarFallback>
                {children}
            </Avatar>
            {imageEditable && isHovering && !isUploading && (
                <div className={cn("absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none", borderRadiusClasses[size])}>
                    <Camera className="w-5 h-5 text-white" />
                </div>
            )}
            {isUploading && (
                <div className={cn("absolute inset-0 flex items-center justify-center bg-black/40", borderRadiusClasses[size])}>
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
            )}
            {imageEditable && (
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                />
            )}
        </div>
    );

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {imageEditable ? (
                <ContextMenu>
                    <ContextMenuTrigger asChild>
                        {avatarElement}
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                        <ContextMenuItem onClick={handleImageClick} disabled={isUploading}>
                            <Camera className="w-4 h-4" />
                            {t("common.changePhoto", "Change photo")}
                        </ContextMenuItem>
                        {supplier.photo_url && (
                            <ContextMenuItem
                                onClick={handleRemovePhoto}
                                disabled={isUploading}
                                variant="destructive"
                            >
                                <Trash className="w-4 h-4" />
                                {t("common.removePhoto", "Remove photo")}
                            </ContextMenuItem>
                        )}
                    </ContextMenuContent>
                </ContextMenu>
            ) : (
                avatarElement
            )}
            {showName && (
                <div className="flex-1 min-w-0 flex flex-col">
                    <span
                        className={cn(
                            "flex items-center",
                            textSizeClasses[size],
                            textTruncateClass,
                            hasClickHandler && !imageEditable && "cursor-pointer hover:underline"
                        )}
                        onClick={hasClickHandler && !imageEditable ? onClick : undefined}
                    >
                        <span className="pr-2 font-medium">{displayName}{showNameExtra && supplier.supplier_name ? ` (${supplier.supplier_name})` : ""}</span>
                    </span>
                    {showEmail && supplier.email && (
                        <span className={cn("text-xs text-muted-foreground", textTruncateClass)}>
                            {supplier.email}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

export default SupplierAvatar;
