import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import * as LucideIcons from 'lucide-react';

/**
 * Single action entry for {@link CustomDropdownMenu}.
 * Each item becomes a dropdown menu option with optional icon and styling.
 */
export interface DropdownMenuItemConfig {
    /** Label text shown for this menu option. */
    label: string;
    /** Lucide icon name (e.g. "Edit", "Trash2", "Eye"). */
    icon?: string;
    /** Called when the option is clicked. */
    onClick: () => void;
    /** Extra class names for the menu item. */
    className?: string;
    /** Extra class names for the icon. */
    iconClassName?: string;
    /** Extra class names for the label. */
    labelClassName?: string;
    /** Visual variant; use "destructive" for delete/danger actions. */
    variant?: 'default' | 'destructive';
    /** If false, this option is hidden. Default: true. */
    showOption?: boolean;
}

/**
 * Props for {@link CustomDropdownMenu}.
 */
export interface CustomDropdownMenuProps {
    /** List of actions shown in the dropdown, in order. */
    items: DropdownMenuItemConfig[];
    /** Size of trigger button. Default: "default". */
    size?: 'sm' | 'default';
    /** Lucide icon name for the trigger (e.g. "MoreVertical"). Default: "MoreVertical". Only used if trigger is not provided. */
    triggerIcon?: string;
    /** Button variant for the trigger. Default: "ghost". Only used if trigger is not provided. */
    triggerVariant?: 'ghost' | 'outline' | 'default';
    /** Optional label next to the trigger icon. Only used if trigger is not provided. */
    triggerLabel?: string;
    /** Custom trigger element. If provided, this overrides triggerIcon, triggerLabel, and triggerVariant. */
    trigger?: React.ReactNode;
    /** Extra class names for the trigger button. Only used if trigger is not provided. */
    className?: string;
    /** Extra class names for the trigger icon. Only used if trigger is not provided. */
    triggerIconClassName?: string;
    /** Alignment of the dropdown content. Default: "end". */
    align?: 'start' | 'center' | 'end';
    /** Called after any item is clicked. */
    onActionClick?: () => void;
    /** If true, the trigger is hidden. */
    hideTrigger?: boolean;
    /** Controlled open state. */
    open?: boolean;
    /** Called when the dropdown open state changes. */
    onOpenChange?: (open: boolean) => void;
    /** Optional custom color to override theme accent color. Applied to selected items and trigger when active. */
    color?: string;
}

/**
 * Gets a Lucide icon component by name.
 * @param iconName - Name of the icon (e.g. "Edit", "Trash2", "Eye")
 * @returns The icon component or null if not found
 */
const getLucideIcon = (iconName: string) => {
    return (LucideIcons as any)[iconName] || null;
};

/**
 * Dropdown menu component with actions, optional icons, and custom color support.
 * Renders a trigger button that opens a menu built from the `items` array.
 *
 * @example
 * ```tsx
 * // Simple usage with built-in trigger
 * <CustomDropdownMenu
 *   items={[
 *     { label: "Edit", icon: "Edit", onClick: () => setEditing(true) },
 *     { label: "Delete", icon: "Trash2", onClick: handleDelete, variant: "destructive" },
 *   ]}
 *   color="oklch(0.527 0.196 152.934)" // green accent
 * />
 *
 * // With custom trigger
 * <CustomDropdownMenu
 *   items={[...]}
 *   trigger={<button>Custom Button</button>}
 * />
 * ```
 */
export const CustomDropdownMenu = ({
    items,
    size = 'default',
    triggerIcon = 'MoreVertical',
    triggerVariant = 'ghost',
    triggerLabel = undefined,
    trigger,
    className,
    triggerIconClassName,
    align = 'end',
    onActionClick,
    hideTrigger = false,
    open,
    onOpenChange,
    color,
}: CustomDropdownMenuProps) => {
    const { t } = useTranslation();

    const handleAction = (handler: () => void) => {
        return (e: React.MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            handler();
            onActionClick?.();
            onOpenChange?.(false);
        };
    };

    // Filter items based on showOption (default to true)
    const visibleItems = items.filter((item) => item.showOption !== false);

    // Determine button sizing
    const hasLabel = !!triggerLabel;
    const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
    const menuItemIconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
    const menuItemClass = size === 'sm' ? 'text-xs' : '';

    // Get trigger icon component
    const TriggerIconComponent = getLucideIcon(triggerIcon);

    const TriggerButton = () => (
        <Button
            variant={triggerVariant}
            size={hasLabel ? (size === 'sm' ? 'sm' : 'default') : size === 'sm' ? 'sm' : 'icon'}
            className={cn(className, hideTrigger && 'hidden')}
        >
            {TriggerIconComponent && (
                <TriggerIconComponent
                    className={cn(
                        iconSize,
                        triggerVariant === 'ghost' && 'text-muted-foreground',
                        triggerIconClassName
                    )}
                />
            )}
            {!triggerLabel && <span className="sr-only">{t('accessibility.openMenu', 'Open menu')}</span>}
            {triggerLabel && (
                <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>{triggerLabel}</span>
            )}
        </Button>
    );

    if (trigger) {
        return (
            <DropdownMenu open={open} onOpenChange={onOpenChange}>
                <DropdownMenuTrigger asChild={false}>
                    {trigger}
                </DropdownMenuTrigger>
                <DropdownMenuContent align={align} className={cn(size === 'sm' && 'w-40', 'bg-white dark:bg-neutral-950')}>
                    {visibleItems.map((item, idx) => {
                        const ItemIconComponent = item.icon ? getLucideIcon(item.icon) : null;
                        const itemColor = color && item.variant !== 'destructive' ? color : undefined;

                        return (
                            <DropdownMenuItem
                                key={idx + '-' + item.label}
                                onClick={handleAction(item.onClick)}
                                className={cn(
                                    item.className,
                                    menuItemClass,
                                    itemColor && `hover:bg-[${itemColor}] hover:bg-opacity-20`
                                )}
                                style={itemColor ? { '--custom-color': itemColor } as React.CSSProperties : undefined}
                            >
                                {ItemIconComponent && (
                                    <ItemIconComponent
                                        className={cn(item.iconClassName || menuItemIconSize, 'mr-2')}
                                    />
                                )}
                                <span className={item.labelClassName || ''}>{item.label}</span>
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <DropdownMenu open={open} onOpenChange={onOpenChange}>
            <DropdownMenuTrigger asChild>
                <TriggerButton />
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align} className={cn(size === 'sm' && 'w-40', 'bg-white dark:bg-neutral-950')}>
                {visibleItems.map((item, idx) => {
                    const ItemIconComponent = item.icon ? getLucideIcon(item.icon) : null;
                    const itemColor = color && item.variant !== 'destructive' ? color : undefined;

                    return (
                        <DropdownMenuItem
                            key={idx + '-' + item.label}
                            onClick={handleAction(item.onClick)}
                            className={cn(
                                item.className,
                                menuItemClass,
                                itemColor && `hover:bg-[${itemColor}] hover:bg-opacity-20`
                            )}
                            style={itemColor ? { '--custom-color': itemColor } as React.CSSProperties : undefined}
                        >
                            {ItemIconComponent && (
                                <ItemIconComponent
                                    className={cn(item.iconClassName || menuItemIconSize, 'mr-2')}
                                />
                            )}
                            <span className={item.labelClassName || ''}>{item.label}</span>
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default CustomDropdownMenu;
