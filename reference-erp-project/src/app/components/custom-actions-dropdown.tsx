import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";

/**
 * Single action entry for {@link CustomActionsDropdown}.
 * Each item becomes a dropdown menu option with optional icon and styling.
 *
 * @example
 * ```tsx
 * const items: CustomActionsDropdownItem[] = [
 *   { label: "Edit", icon: "edit", onClick: () => openEdit() },
 *   { label: "Delete", icon: "trash-2", onClick: () => deleteItem(), variant: "destructive" },
 *   { label: "View", icon: "eye", onClick: () => view(), showOption: !isHidden },
 * ];
 * <CustomActionsDropdown items={items} />
 * ```
 */
export interface CustomActionsDropdownItem {
  /** Label text shown for this menu option. */
  label: string;
  /** Lucide icon name (without "lucide:" prefix), e.g. "edit", "trash-2". */
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
  variant?: "default" | "destructive";
  /** If false, this option is hidden. Omit or true to show. Default: true. */
  showOption?: boolean;
}

/**
 * Props for {@link CustomActionsDropdown}.
 */
export interface CustomActionsDropdownProps {
  /**
   * List of actions shown in the dropdown, in order.
   * Each entry needs at least `label` and `onClick`; use `showOption: false` to hide an item conditionally.
   * @see {@link CustomActionsDropdownItem} for the shape of each item.
   */
  items: CustomActionsDropdownItem[];
  /** Size of the trigger button and menu items. Default: "default". */
  size?: "sm" | "default";
  /** Lucide icon name for the trigger (e.g. "ellipsis-vertical"). Default: "ellipsis-vertical". */
  triggerIcon?: string;
  /** Button variant for the trigger. Default: "ghost". */
  triggerVariant?: "ghost" | "outline" | "default";
  /** Optional label next to the trigger icon. If set, trigger shows icon + label. */
  triggerLabel?: string;
  /** Extra class names for the trigger button. */
  className?: string;
  /** Extra class names for the trigger icon (e.g. match a paired primary button’s icon size). */
  triggerIconClassName?: string;
  /** Alignment of the dropdown content relative to the trigger. Default: "end". */
  align?: "start" | "center" | "end";
  /** Called after any item is clicked (e.g. to close a parent popover). */
  onActionClick?: () => void;
  /** If true, the trigger is hidden (useful with controlled `open` for context menus). */
  hideTrigger?: boolean;
  /** Controlled open state. */
  open?: boolean;
  /** Called when the dropdown open state changes. */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Dropdown menu of actions (e.g. Edit, Delete, View) with an optional trigger icon/label.
 * Renders a trigger button; clicking it opens a menu built from the `items` array.
 *
 * @param props - {@link CustomActionsDropdownProps}
 * @param props.items - Array of {@link CustomActionsDropdownItem}; order is preserved. Items with `showOption: false` are hidden.
 *
 * @example
 * ```tsx
 * <CustomActionsDropdown
 *   items={[
 *     { label: "Edit", icon: "edit", onClick: () => setEditing(true) },
 *     { label: "Delete", icon: "trash-2", onClick: handleDelete, variant: "destructive" },
 *   ]}
 *   onActionClick={() => setPopoverOpen(false)}
 * />
 * ```
 */
export const CustomActionsDropdown = ({
  items,
  size = "default",
  triggerIcon = "ellipsis-vertical",
  triggerVariant = "ghost",
  triggerLabel = undefined,
  className,
  triggerIconClassName,
  align = "end",
  onActionClick,
  hideTrigger = false,
  open,
  onOpenChange,
}: CustomActionsDropdownProps) => {
  const handleAction = (handler: () => void) => {
    return (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      handler();
      onActionClick?.();
      onOpenChange?.(false);
    };
  };

  // Determine if button should be icon-only or have label
  const hasLabel = !!triggerLabel;
  const buttonSize = hasLabel
    ? ""
    : size === "sm" ? "h-6 w-6 p-0" : "!h-6 !w-6";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const menuItemIconSize = size === "sm" ? "h-3 w-3 mr-2" : "h-4 w-4";
  const menuItemClass = size === "sm" ? "text-xs" : "";

  // Filter items based on showOption (default to true if not present)
  const visibleItems = items.filter((item) => item.showOption !== false);

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={triggerVariant}
          size={hasLabel ? (size === "sm" ? "sm" : "default") : (size === "sm" ? "sm" : "icon")}
          className={`${className || buttonSize} ${hideTrigger ? "hidden" : ""}`}
        >
          <Icon
            icon={`lucide:${triggerIcon}`}
            className={cn(
              iconSize,
              triggerVariant == "ghost" ? "text-muted-foreground" : "",
              triggerIconClassName
            )}
          />
          {!triggerLabel && <span className="sr-only">Open menu</span>}
          {triggerLabel && <span className={size === "sm" ? "text-xs" : "text-sm"}>{triggerLabel}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className={size === "sm" ? "w-40" : undefined}
      >
        {visibleItems.map((item, idx) => (
          <DropdownMenuItem
            key={idx + "-" + item.label}
            onClick={handleAction(item.onClick)}
            className={item.className || menuItemClass}
            variant={item.variant}
          >
            {item.icon && (
              <Icon
                icon={`lucide:${item.icon}`}
                className={item.iconClassName || menuItemIconSize}
              />
            )}
            <span className={item.labelClassName || ""}>{item.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CustomActionsDropdown;
