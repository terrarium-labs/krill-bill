import React, { useRef, useState } from "react";
import { getColorFromString } from "@/utils/miscelanea";
import { cn } from "@/lib/utils";
import Employee from "@/types/employees/employees";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Tag from "../tag/tag";
import { useOrgMe } from "@/app/contexts/OrgMeContext";
import { Camera, Loader2, Trash } from "lucide-react";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useParams } from "react-router-dom";
import { postOrgFilesV2 } from "@/api/orgs/files/files";
import { patchEmployee } from "@/api/employees/employees";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * EmployeeAvatar component - Displays an employee's avatar with their name
 * 
 * @param employee - The employee object containing first_name, last_name, email, and photo_url
 * @param showName - Whether to display the name next to the avatar (default: true)
 * @param showJobTitle - Whether to display the job title next to the name (default: false)
 * @param showEmail - Whether to display the email next to the name (default: false)
 * @param size - Size of the avatar: "sm" (6), "md" (8), "lg" (10) (default: "sm")
 * @param variant - Display variant: "truncate" (default, limits text to one line) or "full" (shows full text)
 * @param onClick - Optional click handler function
 * @param className - Additional class name for the container
 * @param children - Optional children to render inside the avatar
 * @param imageEditable - Whether the image can be edited (default: false)
 * @param onImageChange - Optional callback when the image is changed
 */
interface EmployeeAvatarProps {
    employee: Employee | null;
    showName?: boolean;
    showJobTitle?: boolean;
    showEmail?: boolean;
    size?: "sm" | "md" | "lg" | "xl" | "2xl";
    variant?: "truncate" | "full";
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    className?: string;
    textClassName?: string;
    children?: React.ReactNode;
    imageEditable?: boolean;
    onImageChange?: () => void;
    onHover?: boolean;
}

export const EmployeeAvatar: React.FC<EmployeeAvatarProps> = ({
    employee,
    showName = true,
    showJobTitle = false,
    showEmail = false,
    size = "sm",
    variant = "truncate",
    onClick,
    className,
    children,
    imageEditable = false,
    onImageChange,
    onHover = false,
    textClassName,
}) => {
    const { me } = useOrgMe();
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    if (!employee) {
        return <span className="text-muted-foreground">-</span>;
    }

    const isCurrentUser = me?.employee?.id === employee.id;
    const fullName = `${employee.first_name || ""} ${employee.last_name || ""}`.trim();
    const displayName = fullName || employee.email || "-";
    const displayNameWithYou = isCurrentUser ? `${displayName} (You)` : displayName;
    const avatarFallback = displayName?.charAt(0);
    const jobTitle = employee.job_title?.name ? <Tag text={employee.job_title.name} /> : null;

    const handleImageClick = () => {
        if (imageEditable && !isUploading) {
            fileInputRef.current?.click();
        }
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !orgId || !employee.id) return;

        // Validate that it's an image
        if (!file.type.startsWith("image/")) {
            toast.error(t("common.onlyImageFiles", "Only image files are allowed"));
            return;
        }

        setIsUploading(true);
        try {
            const name = 'prof_' + employee.id + '_' + Math.random().toString(36).substring(2, 15);
            // Get uploader from server
            const contentUrlResponse = await postOrgFilesV2(orgId, 'profile_pictures', name, file.size, file.type, file, null);
            if (!contentUrlResponse.success) {
                throw new Error("Failed to upload file");
            }

            const contentUrl = contentUrlResponse.success.url as string;

            // Update employee with new photo URL
            const response = await patchEmployee(orgId, employee.id, {
                photo_url: contentUrl,
            });

            if (response.success) {
                toast.success(t("employees.photoUpdatedSuccess", "Photo updated successfully"));
                onImageChange?.();
            } else {
                toast.error(t("employees.photoUpdateError", "Failed to update photo"));
            }
        } catch (error) {
            console.error("Error uploading photo:", error);
            toast.error(t("employees.photoUploadError", "Failed to upload photo"));
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemovePhoto = async () => {
        if (!orgId || !employee.id) return;

        setIsUploading(true);
        try {
            const response = await patchEmployee(orgId, employee.id, {
                photo_url: null,
            });

            if (response.success) {
                toast.success(t("employees.photoRemovedSuccess", "Photo removed successfully"));
                onImageChange?.();
            } else {
                toast.error(t("employees.photoRemoveError", "Failed to remove photo"));
            }
        } catch (error) {
            console.error("Error removing photo:", error);
            toast.error(t("employees.photoRemoveError", "Failed to remove photo"));
        } finally {
            setIsUploading(false);
        }
    };

    const sizeClasses = {
        sm: "h-6 w-6",
        md: "h-8 w-8",
        lg: "h-10 w-10",
        xl: "h-12 w-12",
        "2xl": "h-14 w-14",
    };

    const textSizeClasses = {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
        xl: "text-xl",
        "2xl": "text-2xl",
    };

    const fallbackTextClasses = {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
        xl: "text-lg",
        "2xl": "text-2xl",
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
                    "rounded-full",
                    hasClickHandler && !showName && "cursor-pointer hover:underline",
                    imageEditable && "cursor-pointer",
                    imageEditable && isHovering && "shadow-lg transition-shadow duration-200"
                )}
                onClick={imageEditable ? handleImageClick : hasClickHandler && !showName ? onClick : undefined}
            >
                <AvatarImage
                    src={employee.photo_url || ""}
                    alt={displayName}
                    className="object-cover"
                />
                <AvatarFallback
                    className={cn(
                        "font-medium rounded-full text-white",
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
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none rounded-full">
                    <Camera className="w-5 h-5 text-white" />
                </div>
            )}
            {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
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

    const wrappedAvatar = onHover ? (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    {avatarElement}
                </TooltipTrigger>
                <TooltipContent>
                    {displayNameWithYou}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    ) : avatarElement;

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {imageEditable ? (
                <ContextMenu>
                    <ContextMenuTrigger asChild>
                        {wrappedAvatar}
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                        <ContextMenuItem onClick={handleImageClick} disabled={isUploading}>
                            <Camera className="w-4 h-4" />
                            {t("common.changePhoto", "Change photo")}
                        </ContextMenuItem>
                        {employee.photo_url && (
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
                wrappedAvatar
            )}
            {showName && (
                <div className="flex-1 min-w-0 flex flex-col">
                    <span
                        className={cn(
                            "flex items-center ",
                            textClassName || textSizeClasses[size],
                            textTruncateClass,
                            hasClickHandler && !imageEditable && "cursor-pointer hover:underline"
                        )}
                        onClick={hasClickHandler && !imageEditable ? onClick : undefined}
                    >
                        <span className="pr-2 font-medium">{displayNameWithYou}</span>
                        {showJobTitle && jobTitle}
                    </span>
                    {showEmail && employee.email && (
                        <span className={cn("text-xs text-muted-foreground", textTruncateClass)}>
                            {employee.email}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

export default EmployeeAvatar;