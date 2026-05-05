import React from "react";
import { getColorFromString } from "@/utils/miscelanea";
import { cn } from "@/lib/utils";
import { Item } from "@/types/items/items";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import IdBadge from "@/app/components/id-badge";

/**
 * ItemAvatar component - Displays an item's avatar with its name
 *
 * @param item - The item object containing name, photos, description, item_code, etc.
 * @param showName - Whether to display the name next to the avatar (default: true)
 * @param showDescription - Whether to display the description next to the name (default: false)
 * @param showItemCode - Whether to display the item code next to the name (default: false)
 * @param showBarcode - Whether to display the barcode next to the name (default: false)
 * @param showStock - Whether to display the stock quantity next to the name (default: false)
 * @param size - Size of the avatar: "sm" (6), "md" (8), "lg" (10), "xl" (12), "2xl" (14) (default: "sm")
 * @param variant - Display variant: "truncate" (default, limits text to one line) or "full" (shows full text)
 * @param onClick - Optional click handler function
 * @param className - Additional class name for the container
 * @param children - Optional children to render inside the avatar
 */
interface ItemAvatarProps {
  item: Item | null;
  showName?: boolean;
  showDescription?: boolean;
  showItemCode?: boolean;
  showBarcode?: boolean;
  showStock?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  variant?: "truncate" | "full";
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  className?: string;
  children?: React.ReactNode;
}

export const ItemAvatar: React.FC<ItemAvatarProps> = ({
  item,
  showName = true,
  showDescription = false,
  showItemCode = false,
  showBarcode = false,
  showStock = false,
  size = "sm",
  variant = "truncate",
  onClick,
  className,
  children,
}) => {
  if (!item) {
    return <span className="text-muted-foreground">-</span>;
  }

  const displayName = item.name || "-";
  const avatarFallback = displayName.slice(0, 1).toUpperCase() || "-";
  const photoUrl = item.photos?.[0]?.url || null;

  const sizeClasses = {
    sm: "h-6 w-6 rounded",
    md: "h-8 w-8 rounded",
    lg: "h-10 w-10 rounded",
    xl: "h-12 w-12 rounded-lg",
    "2xl": "h-14 w-14 rounded-lg",
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
    "2xl": "text-2xl font-bold",
  };

  const hasClickHandler = !!onClick;
  const textTruncateClass = variant === "truncate" ? "line-clamp-1" : "";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Avatar
        className={cn(
          sizeClasses[size],
          hasClickHandler && !showName && "cursor-pointer hover:underline"
        )}
        onClick={hasClickHandler && !showName ? onClick : undefined}
      >
        <AvatarImage
          src={photoUrl || ""}
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
      {showName && (
        <div className="flex-1 min-w-0 flex flex-col">
          <span
            className={cn(
              "flex items-center",
              textSizeClasses[size],
              textTruncateClass,
              hasClickHandler && "cursor-pointer hover:underline"
            )}
            onClick={hasClickHandler ? onClick : undefined}
          >
            <span className="flex items-center gap-2">
              <span className="font-medium">{displayName}</span>
              {showItemCode && item.item_code && (
                <IdBadge id={item.item_code} hideIcon={true} />
              )}
            </span>
          </span>
          {showDescription && item.description && (
            <span
              className={cn("text-xs text-muted-foreground", textTruncateClass)}
            >
              {item.description}
            </span>
          )}
          {showBarcode && item.barcode && (
            <span
              className={cn("text-xs text-muted-foreground", textTruncateClass)}
            >
              {item.barcode}
            </span>
          )}
          {showStock &&
            item.total_stock !== null &&
            item.total_stock !== undefined && (
              <span
                className={cn(
                  "text-xs text-muted-foreground",
                  textTruncateClass
                )}
              >
                Stock: {item.total_stock}
              </span>
            )}
        </div>
      )}
    </div>
  );
};

export default ItemAvatar;
