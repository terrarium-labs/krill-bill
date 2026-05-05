import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ItemAvatar } from "@/app/components/avatars/item-avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Item } from "@/types/items/items";

interface ItemLabelProps {
    data: Item | Item[] | null | undefined;
    className?: string;
    link?: boolean | string;
    variant?: "default" | "icon";
}

/**
 * ItemLabel component - Displays one or multiple items with their avatars
 * 
 * @param data - Can be a single Item, an array of Items, null, or undefined
 * @param className - Optional custom class name to pass to ItemAvatar (only affects single item display)
 * @param link - If true, navigates to item detail page. If string, appends it as sub-route (e.g., "orders")
 * @param variant - "default" shows name for single item, "icon" always shows overlapping avatar style
 * 
 * Behavior:
 * - If null/undefined/empty array: displays "-"
 * - If variant="default":
 *   - Single item: displays the item with name
 *   - Multiple items: displays up to 3 avatars (overlapping) and a "+N" badge for the rest
 * - If variant="icon": always displays in overlapping avatar style (without name)
 */
const ItemLabel: React.FC<ItemLabelProps> = ({ data, className, link = false, variant = "default" }) => {
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();

    const handleClick = (itemId: string) => {
        if (link && orgId) {
            const basePath = `/${orgId}/items/${itemId}`;
            const subRoute = typeof link === 'string' ? `/${link}` : '';
            navigate(`${basePath}${subRoute}`);
        }
    };

    // Handle null, undefined, or empty cases
    if (!data || (Array.isArray(data) && data.length === 0)) {
        return <span className="text-muted-foreground">-</span>;
    }

    // Normalize data to array for icon variant
    const items = Array.isArray(data) ? data : [data];

    // Handle single item (not in array) - only for default variant
    if (variant === "default" && !Array.isArray(data)) {
        return (
            <div
                className={`flex items-center gap-1 ${link ? 'cursor-pointer hover:bg-primary/10 -mx-2 -my-1 px-2 py-1 rounded transition-all group hover:opacity-80' : ''}`}
                onClick={link ? () => handleClick(data.id) : undefined}
            >
                <ItemAvatar
                    item={data}
                    showName={true}
                    className={className}
                />
            </div>
        );
    }

    // Handle array with single item - only for default variant
    if (variant === "default" && items.length === 1) {
        return (
            <div
                className={`flex items-center gap-1 ${link ? 'cursor-pointer hover:bg-primary/10 -mx-2 -my-1 px-2 py-1 rounded transition-all group hover:opacity-80' : ''}`}
                onClick={link ? () => handleClick(items[0].id) : undefined}
            >
                <ItemAvatar
                    item={items[0]}
                    showName={true}
                    className={className}
                />
            </div>
        );
    }

    // Handle multiple items (or icon variant)
    const visibleItems = items.slice(0, 3);
    const remainingItems = items.slice(3);
    const remainingNames = remainingItems.map(item => {
        return item.name || item.item_code || 'Unknown';
    }).join(', ');

    return (
        <div className="flex items-center gap-1">
            {visibleItems.map((item, index) => (
                <div
                    key={item.id}
                    style={{ marginLeft: index > 0 ? "-8px" : "0" }}
                >
                    <ItemAvatar
                        item={item}
                        showName={false}
                    />
                </div>
            ))}
            {items.length > 3 && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium ml-[-8px] cursor-pointer hover:opacity-80">
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

export default ItemLabel;
