import { cn } from "@/lib/utils";

import { getColorClasses } from "@/utils/miscelanea";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIcon } from "@/hooks/use-icon";
import type { IconType } from "@/types/miscelanea";

/**
 * Type for data item
 */
export interface IconLabelDataItem {
    icon?: IconType | null;
    text?: string | null;
    color?: string | null;
}

{/**
 * IconLabel component
 * @param data - Can be: string (text only), object {icon, text, color}, or array of objects (for grouped display)
 * @param className - The class name to apply
 * @param textClassName - The class name to apply to the text
 * @param showEmptyColor - Whether to show the color when the icon is empty
 * @param showIconColor - Whether to apply the color to the icon
 * @param size - Size of the icon and text: "sm" (6), "md" (8), "lg" (10), "xl" (12), "2xl" (14) (default: "sm")
 * @param variant - Display variant: "default" (shows icon+text), "icon" (shows only icons), "truncate" (text truncates with ellipsis), "full" (shows full text)
 * @param link - Full route path to navigate to when clicked (e.g., "/org123/items/item456")
 */}
interface IconLabelProps {
    data: string | IconLabelDataItem | IconLabelDataItem[];
    className?: string;
    textClassName?: string;
    showEmptyColor?: boolean;
    showIconColor?: boolean;
    size?: "sm" | "md" | "lg" | "xl" | "2xl";
    variant?: "default" | "icon" | "truncate" | "full";
    link?: string;
}
const IconLabel = ({ 
    data,
    className, 
    textClassName = "", 
    showEmptyColor = true, 
    showIconColor = true, 
    size = "sm", 
    variant = "default", 
    link 
}: IconLabelProps) => {
    const navigate = useNavigate();
    const renderIcon = useIcon();

    const handleClick = () => {
        if (link) {
            navigate(link);
        }
    };

    // Handle data prop - normalize to array of items
    let items: IconLabelDataItem[];
    if (typeof data === 'string') {
        // String: use as text only
        items = [{ text: data }];
    } else if (Array.isArray(data)) {
        // Array: use as-is
        items = data;
    } else {
        // Object: single item
        items = [data];
    }

    // Determine if we should show text based on variant
    const showText = variant !== "icon";
    const textTruncate = variant === "truncate";

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

    const fallbackTextClasses = {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
        xl: "text-lg",
        "2xl": "text-xl",
    };

    const textTruncateClass = textTruncate ? "truncate" : "";
    const containerTruncateClass = textTruncate ? "min-w-0 max-w-full" : "";
    const containerFlexClass = textTruncate ? "flex" : "inline-flex";

    // Handle empty data
    if (items.length === 0) {
        return <span className="text-muted-foreground">-</span>;
    }

    // Render a single icon badge (for both single items and items in array)
    const renderIconBadge = (item: IconLabelDataItem, index?: number, withTooltip: boolean = false) => {
        const itemColor = item.color || "gray";
        const itemIcon = item.icon || "ellipsis"; // Use ellipsis as fallback icon
        const itemText = item.text || "";

        const badge = (
            <div
                className={cn(
                    iconSizeClasses[size],
                    "p-1 rounded-md shrink-0 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity",
                    showIconColor ? getColorClasses(itemColor) : "bg-muted"
                )}
            >
                {renderIcon(itemIcon, cn("w-4 h-4"))}
            </div>
        );

        if (withTooltip && itemText) {
            return (
                <TooltipProvider key={index}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            {badge}
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="text-sm">{itemText}</div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }

        return badge;
    };

    // Handle single item with default variant (icon + text)
    if (items.length === 1 && showText) {
        const item = items[0];
        const itemColor = item.color || "gray";
        const itemIcon = item.icon;
        const itemText = item.text || "";

        return (
            <div 
                className={cn(
                    containerFlexClass,
                    "items-center align-middle", 
                    containerTruncateClass, 
                    showIconColor ? "gap-2" : "gap-1",
                    link ? "cursor-pointer hover:bg-primary/10 -mx-2 -my-1 px-2 py-1 rounded transition-all group hover:opacity-80" : "",
                    className
                )}
                onClick={link ? handleClick : undefined}
            >
                {itemIcon ? (
                    renderIcon(
                        itemIcon,
                        cn(
                            iconSizeClasses[size],
                            "p-1 rounded-md shrink-0",
                            showIconColor ? getColorClasses(itemColor) : undefined
                        )
                    )
                ) : showEmptyColor ? (
                    <div
                        className={cn(
                            iconSizeClasses[size],
                            "p-1 rounded-md shrink-0",
                            showIconColor ? getColorClasses(itemColor) : undefined
                        )}
                    />
                ) : null}
                {itemText ? (
                    <span className={cn(textSizeClasses[size], textClassName ? textClassName : "font-medium", textTruncateClass, textTruncate && "min-w-0")}>
                        {itemText}
                    </span>
                ) : null}
            </div>
        );
    }

    // Handle multiple items or icon variant - show overlapping icons
    const visibleItems = items.slice(0, 3);
    const remainingItems = items.slice(3);
    const remainingNames = remainingItems.map(item => item.text || "").filter(Boolean).join(', ');

    return (
        <div 
            className={cn(
                "inline-flex items-center align-middle gap-1",
                link ? "cursor-pointer hover:bg-primary/10 -mx-2 -my-1 px-2 py-1 rounded transition-all group hover:opacity-80" : "",
                className
            )}
            onClick={link ? handleClick : undefined}
        >
            {visibleItems.map((item, index) => (
                <div
                    key={index}
                    style={{ marginLeft: index > 0 ? "-8px" : "0" }}
                >
                    {renderIconBadge(item, index, true)}
                </div>
            ))}
            {items.length > 3 && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className={cn(
                                iconSizeClasses[size],
                                "rounded-md bg-muted text-muted-foreground flex items-center justify-center font-medium cursor-pointer hover:opacity-80 ml-[-8px]",
                                fallbackTextClasses[size]
                            )}>
                                +{items.length - 3}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="max-w-xs">
                                {remainingNames}
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    );
};

export default IconLabel;