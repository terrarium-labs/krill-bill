import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/* ---------------------------------------------------------------------------
 * VerticalMenu
 *
 * A composable, accessible vertical navigation menu built with compound
 * components. Supports controlled and uncontrolled active-item state,
 * multiple visual variants, sizes, optional icons and badges.
 *
 * Usage:
 *
 *   // Uncontrolled (manages its own state via defaultValue)
 *   <VerticalMenu defaultValue="material">
 *     <VerticalMenuItem value="material">Material Rates</VerticalMenuItem>
 *     <VerticalMenuItem value="hourly">Hourly Rates</VerticalMenuItem>
 *   </VerticalMenu>
 *
 *   // Controlled
 *   <VerticalMenu value={tab} onValueChange={setTab}>
 *     <VerticalMenuItem value="material" icon={<BoxIcon />}>
 *       Material Rates
 *     </VerticalMenuItem>
 *     <VerticalMenuItem value="hourly" badge={<Badge>New</Badge>}>
 *       Hourly Rates
 *     </VerticalMenuItem>
 *   </VerticalMenu>
 *
 *   // With separator & label
 *   <VerticalMenu value={tab} onValueChange={setTab}>
 *     <VerticalMenuLabel>Settings</VerticalMenuLabel>
 *     <VerticalMenuItem value="general">General</VerticalMenuItem>
 *     <VerticalMenuSeparator />
 *     <VerticalMenuItem value="advanced">Advanced</VerticalMenuItem>
 *   </VerticalMenu>
 *
 * Props reference:
 *
 *   VerticalMenu
 *     value           – controlled active value
 *     defaultValue    – initial value (uncontrolled)
 *     onValueChange   – callback when active item changes
 *     variant         – "default" | "ghost" | "underline"
 *     size            – "sm" | "md" | "lg"
 *     bordered        – show right border (default true)
 *     className       – additional CSS classes on the <nav>
 *
 *   VerticalMenuItem
 *     value           – unique identifier for this item
 *     icon            – ReactNode rendered before the label
 *     badge           – ReactNode rendered after the label
 *     disabled        – disables interaction
 *     className       – additional CSS classes on the <button>
 *
 *   VerticalMenuLabel
 *     className       – additional CSS classes
 *
 *   VerticalMenuSeparator
 *     className       – additional CSS classes
 * --------------------------------------------------------------------------- */

// ---- Context ---------------------------------------------------------------

interface VerticalMenuContextValue {
  value: string | undefined
  onValueChange: (value: string) => void
  variant: NonNullable<VerticalMenuProps["variant"]>
  size: NonNullable<VerticalMenuProps["size"]>
}

const VerticalMenuContext = React.createContext<VerticalMenuContextValue | null>(null)

function useVerticalMenu() {
  const ctx = React.useContext(VerticalMenuContext)
  if (!ctx) throw new Error("VerticalMenu compound components must be used within <VerticalMenu>")
  return ctx
}

// ---- Variants --------------------------------------------------------------

const menuVariants = cva(
  "flex flex-col gap-1",
  {
    variants: {
      bordered: {
        true: "border-r border-border pr-4",
        false: "",
      },
    },
    defaultVariants: {
      bordered: true,
    },
  }
)

const itemVariants = cva(
  "flex items-center gap-2 text-left rounded-md font-medium transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "",
        ghost: "",
        underline: "rounded-none border-r-2 border-transparent",
      },
      size: {
        sm: "px-2 py-1.5 text-xs",
        md: "px-3 py-2 text-sm",
        lg: "px-4 py-2.5 text-base",
      },
      active: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      { variant: "default", active: true,  className: "bg-primary/10 text-primary" },
      { variant: "default", active: false, className: "text-muted-foreground hover:bg-muted hover:text-foreground" },
      { variant: "ghost",   active: true,  className: "bg-accent text-accent-foreground" },
      { variant: "ghost",   active: false, className: "text-muted-foreground hover:bg-accent/50 hover:text-foreground" },
      { variant: "underline", active: true,  className: "border-primary text-primary" },
      { variant: "underline", active: false, className: "text-muted-foreground hover:text-foreground hover:border-muted-foreground" },
    ],
    defaultVariants: {
      variant: "default",
      size: "md",
      active: false,
    },
  }
)

// ---- VerticalMenu ----------------------------------------------------------

interface VerticalMenuProps
  extends Omit<React.ComponentProps<"nav">, "defaultValue">,
    VariantProps<typeof menuVariants> {
  /** Controlled active value. */
  value?: string
  /** Initial value when uncontrolled. */
  defaultValue?: string
  /** Callback fired when the active item changes. */
  onValueChange?: (value: string) => void
  /** Visual style variant applied to all items. */
  variant?: "default" | "ghost" | "underline"
  /** Size preset applied to all items. */
  size?: "sm" | "md" | "lg"
  /** Minimum width of the menu. Defaults to 180px. */
  minWidth?: number | string
}

function VerticalMenu({
  value: controlledValue,
  defaultValue,
  onValueChange,
  variant = "default",
  size = "md",
  bordered = true,
  minWidth = 180,
  className,
  children,
  ...props
}: VerticalMenuProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const isControlled = controlledValue !== undefined
  const activeValue = isControlled ? controlledValue : internalValue

  const handleValueChange = React.useCallback(
    (val: string) => {
      if (!isControlled) setInternalValue(val)
      onValueChange?.(val)
    },
    [isControlled, onValueChange]
  )

  const ctx = React.useMemo<VerticalMenuContextValue>(
    () => ({ value: activeValue, onValueChange: handleValueChange, variant, size }),
    [activeValue, handleValueChange, variant, size]
  )

  const style: React.CSSProperties = {
    minWidth: typeof minWidth === "number" ? `${minWidth}px` : minWidth,
    ...props.style,
  }

  return (
    <VerticalMenuContext.Provider value={ctx}>
      <nav
        data-slot="vertical-menu"
        role="menu"
        aria-orientation="vertical"
        className={cn(menuVariants({ bordered }), className)}
        style={style}
        {...props}
      >
        {children}
      </nav>
    </VerticalMenuContext.Provider>
  )
}

// ---- VerticalMenuItem ------------------------------------------------------

interface VerticalMenuItemProps
  extends Omit<React.ComponentProps<"button">, "value"> {
  /** Unique identifier that determines active state. */
  value: string
  /** Icon rendered before the label. */
  icon?: React.ReactNode
  /** Badge or extra content rendered after the label. */
  badge?: React.ReactNode
}

function VerticalMenuItem({
  value,
  icon,
  badge,
  disabled,
  className,
  children,
  onClick,
  ...props
}: VerticalMenuItemProps) {
  const { value: activeValue, onValueChange, variant, size } = useVerticalMenu()
  const isActive = activeValue === value

  return (
    <button
      data-slot="vertical-menu-item"
      role="menuitem"
      type="button"
      aria-current={isActive ? "page" : undefined}
      disabled={disabled}
      className={cn(itemVariants({ variant, size, active: isActive }), className)}
      onClick={(e) => {
        onValueChange(value)
        onClick?.(e)
      }}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
      {badge && <span className="shrink-0">{badge}</span>}
    </button>
  )
}

// ---- VerticalMenuLabel -----------------------------------------------------

function VerticalMenuLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="vertical-menu-label"
      className={cn("px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider", className)}
      {...props}
    />
  )
}

// ---- VerticalMenuSeparator -------------------------------------------------

function VerticalMenuSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="vertical-menu-separator"
      role="separator"
      className={cn("my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

// ---- Exports ---------------------------------------------------------------

export {
  VerticalMenu,
  VerticalMenuItem,
  VerticalMenuLabel,
  VerticalMenuSeparator,
  type VerticalMenuProps,
  type VerticalMenuItemProps,
}
