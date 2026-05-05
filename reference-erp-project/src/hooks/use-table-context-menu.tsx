import { ReactElement, ReactNode, isValidElement, useState, cloneElement } from "react";
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

/**
 * Hook to add context menu support to table rows
 * Extracts action items from CustomActionsDropdown and renders them in a context menu
 */
export const useTableContextMenu = <T extends { id: string }>(
    renderActions?: (item: T, ...args: any[]) => ReactNode,
    allItems?: T[]
) => {
    const [openMenuItemId, setOpenMenuItemId] = useState<string | null>(null);
    const [menuKey, setMenuKey] = useState<number>(0);

    /**
     * Wraps a table row with context menu functionality
     * @param item - The data item for this row
     * @param rowElement - The table row element to wrap
     * @returns The row wrapped with context menu, or the original row if no renderActions
     */
    const wrapRowWithContextMenu = (item: T, rowElement: ReactElement): ReactElement => {
        // If no renderActions provided, return row as-is
        if (!renderActions) {
            return rowElement;
        }

        // Call renderActions with item and optionally allItems if provided
        const actionsElement = allItems 
            ? renderActions(item, allItems) 
            : renderActions(item);

        // If actionsElement is not valid, return row as-is
        if (!isValidElement(actionsElement)) {
            return rowElement;
        }

        // Try to find items directly, or search in children if wrapped
        let items = (actionsElement.props as any).items;
        
        // If no items found directly, check if CustomActionsDropdown is a child
        if (!items && (actionsElement.props as any).children) {
            const children = (actionsElement.props as any).children;
            const childrenArray = Array.isArray(children) ? children : [children];
            
            for (const child of childrenArray) {
                if (isValidElement(child) && (child.props as any).items) {
                    items = (child.props as any).items;
                    break;
                }
            }
        }

        if (!items || !Array.isArray(items)) {
            return rowElement;
        }

        // Check if this row's menu is open
        const isMenuOpen = openMenuItemId === item.id;

        // Clone the row element and add the hover class if menu is open
        const enhancedRowElement = cloneElement(rowElement, {
            className: cn(
                (rowElement.props as any).className,
                isMenuOpen && "bg-muted/50"
            ),
        } as any);

        return (
            <ContextMenu
                key={`${item.id}-${menuKey}`}
                onOpenChange={(open) => {
                    if (open) {
                        // If the same row's menu is already open, force repositioning
                        if (openMenuItemId === item.id) {
                            setMenuKey(prev => prev + 1);
                        }
                        setOpenMenuItemId(item.id);
                    } else {
                        setOpenMenuItemId(null);
                    }
                }}
            >
                <ContextMenuTrigger asChild>
                    {enhancedRowElement}
                </ContextMenuTrigger>
                <ContextMenuContent className="min-w-[8rem]">
                    {items.map((actionItem: any, idx: number) => {
                        // Skip items with showOption: false
                        if (actionItem.showOption === false) return null;
                        
                        return (
                            <ContextMenuItem
                                key={idx + "-" + actionItem.label}
                                variant={actionItem.variant}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    actionItem.onClick();
                                }}
                            >
                                {actionItem.icon && (
                                    <Icon
                                        icon={`lucide:${actionItem.icon}`}
                                        className="h-4 w-4"
                                    />
                                )}
                                <span>{actionItem.label}</span>
                            </ContextMenuItem>
                        );
                    })}
                </ContextMenuContent>
            </ContextMenu>
        );
    };

    return { wrapRowWithContextMenu };
};
