import React from "react";
import { getColorFromString } from "@/utils/miscelanea";
import { cn } from "@/lib/utils";
import { OrgUser } from "@/types/general/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Tag from "../tag/tag";
import { useTranslation } from "react-i18next";
import { useOrgMe } from "@/app/contexts/OrgMeContext";

/**
 * OrgUserAvatar component - Displays an organization user's avatar with their name
 * 
 * @param orgUser - The org user object containing user info and relationships (employee, client, supplier)
 * @param showName - Whether to display the name next to the avatar (default: true)
 * @param showEmail - Whether to display the email next to the name (default: false)
 * @param showType - Whether to display the user type(s) as tags (Employee/Client/Supplier) (default: false)
 * @param size - Size of the avatar: "sm" (6), "md" (8), "lg" (10), "xl" (12), "2xl" (14) (default: "sm")
 * @param variant - Display variant: "truncate" (default, limits text to one line) or "full" (shows full text)
 * @param onClick - Optional click handler function
 * @param className - Additional class name for the container
 * @param children - Optional children to render inside the avatar
 */
interface OrgUserAvatarProps {
    orgUser: OrgUser | null;
    showName?: boolean;
    showEmail?: boolean;
    showType?: boolean;
    size?: "sm" | "md" | "lg" | "xl" | "2xl";
    variant?: "truncate" | "full";
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    className?: string;
    iconClassName?: string;
    textClassName?: string;
    children?: React.ReactNode;
}

export const OrgUserAvatar: React.FC<OrgUserAvatarProps> = ({
    orgUser,
    showName = true,
    showEmail = false,
    showType = false,
    size = "sm",
    variant = "truncate",
    onClick,
    className,
    iconClassName,
    textClassName,
    children,
}) => {
    const { t } = useTranslation();
    const { me } = useOrgMe();

    if (!orgUser) {
        return <span className="text-muted-foreground">-</span>;
    }

    const user = orgUser;
    const isCurrentUser = me?.id === user.id;
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    const displayName = fullName || user.email || "-";
    const displayNameWithYou = isCurrentUser ? `${displayName} (You)` : displayName;
    const avatarFallback = displayName?.charAt(0);

    // Determine user type(s)
    const userTypes: string[] = [];
    if (orgUser.employee) userTypes.push(t("admin.iam.users.type.employee", "Employee"));
    if (orgUser.client) userTypes.push(t("admin.iam.users.type.client", "Client"));
    if (orgUser.supplier) userTypes.push(t("admin.iam.users.type.supplier", "Supplier"));

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

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Avatar
                className={cn(
                    iconClassName ? iconClassName : sizeClasses[size],
                    "rounded-full",
                    hasClickHandler && !showName && "cursor-pointer hover:underline"
                )}
                onClick={hasClickHandler && !showName ? onClick : undefined}
            >
                <AvatarImage
                    src={user.photo_url || ""}
                    alt={displayName}
                    className="object-cover"
                />
                <AvatarFallback
                    className={cn(
                        "font-medium rounded-full text-white",
                        iconClassName ? iconClassName : sizeClasses[size],
                        fallbackTextClasses[size]
                    )}
                    style={{ backgroundColor: getColorFromString(displayName) }}
                >
                    {avatarFallback}
                </AvatarFallback>
                {children}
            </Avatar>
            {showName && (
                <div className="min-w-0 flex flex-col">
                    <span
                        className={cn(
                            "flex items-center gap-1 ",
                            textClassName ? textClassName : textSizeClasses[size],
                            textTruncateClass,
                            hasClickHandler && "cursor-pointer hover:underline"
                        )}
                        onClick={hasClickHandler ? onClick : undefined}
                    >
                        <span className="pr-1 font-medium">{displayNameWithYou}</span>
                        {showType && userTypes.length > 0 && (
                            <div className="flex gap-1">
                                {userTypes.map((type, index) => (
                                    <Tag key={index} text={type} />
                                ))}
                            </div>
                        )}
                    </span>
                    {showEmail && user.email && (
                        <span className={cn(
                            "text-muted-foreground",
                            textSizeClasses[size],
                            textTruncateClass)}
                        >
                            {user.email}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default OrgUserAvatar;

