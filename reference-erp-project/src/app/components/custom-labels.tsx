import { cn } from "@/lib/utils";

import { getColorClasses } from "@/utils/miscelanea";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { FlagComponent } from "@/app/components/flag-component";
import React from "react";
import { useIcon } from "@/hooks/use-icon";
import type { IconType } from "@/types/miscelanea";

{/**
 * IconLabel component
 * @param icon - The icon to display (string for Iconify/Lucide or React component)
 * @param text - The text to display
 * @param color - The color to display
 * @param className - The class name to apply
 * @param textClassName - The class name to apply to the text
 * @param showEmptyColor - Whether to show the color when the icon is empty
 * @param size - Size of the icon and text: "sm" (6), "md" (8), "lg" (10), "xl" (12), "2xl" (14) (default: "sm")
 * @param variant - Display variant: "truncate" (default, truncates text with ellipsis) or "full" (shows full text)
 */}
interface IconLabelProps {
    icon?: IconType | null;
    text?: string | null;
    color?: string | null;
    className?: string;
    textClassName?: string;
    showEmptyColor?: boolean;
    size?: "sm" | "md" | "lg" | "xl" | "2xl";
    variant?: "truncate" | "full";
}
export const IconLabel = ({ icon, text, color, className, textClassName = "", showEmptyColor = true, size = "sm", variant = "truncate" }: IconLabelProps) => {
    const renderIcon = useIcon();
    const iconSizeClasses = {
        sm: "w-6! h-6!",
        md: "w-8! h-8!",
        lg: "w-10! h-10!",
        xl: "w-12! h-12!",
        "2xl": "w-14! h-14!",
    };

    const textSizeClasses = {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
        xl: "text-xl",
        "2xl": "text-2xl",
    };

    const textTruncateClass = variant === "truncate" ? "truncate" : "";
    const containerTruncateClass = variant === "truncate" ? "min-w-0" : "";

    return (
        <div className={cn("flex items-center gap-2", containerTruncateClass, className)}>
            {icon ? (
                renderIcon(
                    icon,
                    cn(
                        iconSizeClasses[size],
                        "p-1 rounded-md shrink-0",
                        getColorClasses(color ?? 'gray')
                    )
                )
            ) : showEmptyColor ? (
                <div
                    className={cn(
                        iconSizeClasses[size],
                        "p-1 rounded-md shrink-0",
                        getColorClasses(color ?? 'gray')
                    )}
                />
            ) : null}
            {text ? (
                <span className={cn(textSizeClasses[size], "font-medium", textTruncateClass, variant === "truncate" && "min-w-0", textClassName)}>
                    {text}
                </span>
            ) : null}
        </div>
    );
};

/**
 * IconInfoItem component - A reusable info display component with icon, label, and value
 * Supports multiple modes: basic text, copyable, links, country flags, and custom children
 * 
 * @param icon - Icon to display (string for Iconify/Lucide icon name, or React component)
 * @param label - Label text shown above the value
 * @param value - Value to display (string, number, or null)
 * @param children - Custom ReactNode content (overrides value if provided)
 * @param copyable - Whether to show a copy button
 * @param link - Whether to render value as a link
 * @param linkValue - The href for the link (required if link=true)
 * @param flag - Whether to show a country flag
 * @param countryCode - The country code for the flag (required if flag=true)
 * @param emptyText - Text to show when value is null (defaults to "—")
 * @param onEmptyClick - Function to call when empty state is clicked (shows "Edit" link)
 * @param className - Additional class name for the container
 * @param navigateTo - Internal navigation path (uses React Router Link)
 */
interface IconInfoItemProps {
    icon: IconType;
    label: string;
    value?: string | number | null;
    children?: React.ReactNode;
    copyable?: boolean;
    link?: boolean;
    linkValue?: string;
    flag?: boolean;
    countryCode?: string;
    emptyText?: string;
    onEmptyClick?: () => void;
    className?: string;
    navigateTo?: string;
}

export const IconInfoItem: React.FC<IconInfoItemProps> = ({
    icon,
    label,
    value,
    children,
    copyable = false,
    link = false,
    linkValue = "",
    flag = false,
    countryCode = "",
    emptyText = "—",
    onEmptyClick,
    className,
    navigateTo,
}) => {
    const renderIcon = useIcon();
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const hasValue = value !== null && value !== undefined && value !== "";
    const displayValue = hasValue ? String(value) : null;

    // Render the value content
    const renderContent = () => {
        // If children are provided, use them directly
        if (children) {
            return <div className="text-sm font-medium">{children}</div>;
        }

        // No value case
        if (!hasValue) {
            if (onEmptyClick) {
                return (
                    <p
                        onClick={onEmptyClick}
                        className="hover:underline text-sm cursor-pointer text-blue-500 truncate"
                    >
                        Edit
                    </p>
                );
            }
            return <span className="text-sm text-muted-foreground">{emptyText}</span>;
        }

        // Link case (external or internal navigation)
        if (link && linkValue && displayValue) {
            return (
                <Link
                    to={linkValue}
                    className="hover:underline text-blue-500 text-sm truncate"
                    target="_blank"
                >
                    {displayValue}
                </Link>
            );
        }

        // Internal navigation case
        if (navigateTo && displayValue) {
            return (
                <Link
                    to={navigateTo}
                    className="hover:underline text-blue-500 text-sm truncate"
                >
                    {displayValue}
                </Link>
            );
        }

        // Flag case
        if (flag && countryCode && displayValue) {
            return (
                <div className="flex items-center gap-2">
                    <FlagComponent country={countryCode} countryName={displayValue} />
                    <p className="text-sm font-normal text-foreground wrap-break-words truncate">
                        {displayValue}
                    </p>
                </div>
            );
        }

        // Default text case
        return (
            <p className="text-sm font-normal text-foreground wrap-break-words truncate">
                {displayValue}
            </p>
        );
    };

    return (
        <div className={cn("flex items-start gap-3 group", className)}>
            {renderIcon(icon, "w-4 h-4 text-muted-foreground mt-0.5 shrink-0")}
            <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">{label}</p>
                <div className="flex items-center gap-2">
                    {renderContent()}
                </div>
            </div>
            {copyable && hasValue && displayValue && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6! w-6! p-0"
                    onClick={() => copyToClipboard(displayValue)}
                >
                    <Copy className="w-3! h-3!" />
                </Button>
            )}
        </div>
    );
};

