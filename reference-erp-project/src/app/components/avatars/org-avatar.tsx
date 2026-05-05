import React, { useRef, useState } from "react";
import { getColorFromString } from "@/utils/miscelanea";
import { cn } from "@/lib/utils";
import { Org } from "@/types/general/org";
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
import { patchOrg } from "@/api/orgs/orgs";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

/**
 * OrgAvatar component - Displays an organization's avatar with their name
 *
 * @param org - The organization object containing name, photo_url, and email
 * @param showName - Whether to display the name next to the avatar (default: true)
 * @param showEmail - Whether to display the email next to the name (default: false)
 * @param showMembers - Whether to display the number of members next to the name (default: false)
 * @param showDescription - Whether to display the description next to the name (default: false)
 * @param size - Size of the avatar: "sm" (6), "md" (8), "lg" (10), "xl" (12), "2xl" (14) (default: "sm")
 * @param variant - Display variant: "truncate" (default, limits text to one line) or "full" (shows full text)
 * @param onClick - Optional click handler function
 * @param className - Additional class name for the container
 * @param children - Optional children to render inside the avatar
 * @param imageEditable - Whether the image can be edited (default: false)
 * @param onImageChange - Optional callback when the image is changed
 */
interface OrgAvatarProps {
  org: Org | null;
  showName?: boolean;
  showEmail?: boolean;
  showMembers?: boolean;
  showDescription?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl";
  variant?: "truncate" | "full";
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  className?: string;
  children?: React.ReactNode;
  imageEditable?: boolean;
  onImageChange?: () => void;
}

export const OrgAvatar: React.FC<OrgAvatarProps> = ({
  org,
  showName = true,
  showEmail = false,
  showMembers = false,
  showDescription = false,
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

  if (!org) {
    return <span className="text-muted-foreground">-</span>;
  }

  const displayName = org.name || "-";
  const avatarFallback = displayName.slice(0, 2).toUpperCase() || "-";

  const handleImageClick = () => {
    if (imageEditable && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !orgId || !org.id) return;

    // Validate that it's an image
    if (!file.type.startsWith("image/")) {
      toast.error(t("common.onlyImageFiles", "Only image files are allowed"));
      return;
    }

    setIsUploading(true);
    try {
      const name = 'org_' + org.id + '_' + Math.random().toString(36).substring(2, 15);
      // Upload file to server
      const contentUrlResponse = await postOrgFilesV2(orgId, 'profile_pictures', name, file.size, file.type, file, null);
      if (!contentUrlResponse.success) {
        throw new Error("Failed to upload file");
      }

      const contentUrl = contentUrlResponse.success.url as string;

      // Update org with new photo URL
      const response = await patchOrg(org.id, {
        photo_url: contentUrl,
      });

      if (response.success) {
        toast.success(t("orgs.photoUpdatedSuccess", "Photo updated successfully"));
        onImageChange?.();
      } else {
        toast.error(t("orgs.photoUpdateError", "Failed to update photo"));
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error(t("orgs.photoUploadError", "Failed to upload photo"));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!orgId || !org.id) return;

    setIsUploading(true);
    try {
      const response = await patchOrg(org.id, {
        photo_url: null,
      });

      if (response.success) {
        toast.success(t("orgs.photoRemovedSuccess", "Photo removed successfully"));
        onImageChange?.();
      } else {
        toast.error(t("orgs.photoRemoveError", "Failed to remove photo"));
      }
    } catch (error) {
      console.error("Error removing photo:", error);
      toast.error(t("orgs.photoRemoveError", "Failed to remove photo"));
    } finally {
      setIsUploading(false);
    }
  };

  const sizeClasses = {
    sm: "h-6 w-6 rounded",
    md: "h-8 w-8 rounded-lg",
    lg: "h-10 w-10 rounded-lg",
    xl: "h-12 w-12 rounded-lg",
    "2xl": "h-14 w-14 rounded-lg",
    "4xl": "h-24 w-24 rounded-lg",
  };

  const borderRadiusClasses = {
    sm: "rounded",
    md: "rounded-lg",
    lg: "rounded-lg",
    xl: "rounded-lg",
    "2xl": "rounded-lg",
    "4xl": "rounded-lg",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-md",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
    "4xl": "text-4xl",
  };

  const fallbackTextClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
    "2xl": "text-2xl",
    "4xl": "text-4xl",
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
          src={org.photo_url || ""}
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
          <Camera className="w-6 h-6 text-white" />
        </div>
      )}
      {isUploading && (
        <div className={cn("absolute inset-0 flex items-center justify-center bg-black/40", borderRadiusClasses[size])}>
          <Loader2 className="w-6 h-6 text-white animate-spin" />
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
            {org.photo_url && (
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
            <span className="pr-2 font-medium">{displayName}</span>
          </span>
          {showEmail && org.email && (
            <span
              className={cn("text-xs text-muted-foreground", textTruncateClass)}
            >
              {org.email}
            </span>
          )}
          {showMembers && org.n_users !== undefined && (
            <span
              className={cn("text-xs text-muted-foreground font-normal", textTruncateClass)}
            >
              {org.n_users} {org.n_users === 1 ? t("orgs.member", "Member") : t("orgs.members", "Members")}
            </span>
          )}
          {showDescription
            ? (org.description && (
                <span
                  className={cn(
                    "text-xs text-muted-foreground font-normal",
                    textTruncateClass
                  )}
                >
                  {org.description}
                </span>
              )) ||
              (org.n_users !== undefined && (
                <span
                  className={cn(
                    "text-xs text-muted-foreground font-normal",
                    textTruncateClass
                  )}
                >
                  {org.n_users} {org.n_users === 1 ? t("orgs.member", "Member") : t("orgs.members", "Members")}
                </span>
              ))
            : undefined}
        </div>
      )}
    </div>
  );
};

export default OrgAvatar;
