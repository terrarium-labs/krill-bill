"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandSeparator,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTranslation } from "@/hooks/useTranslation"

/**
 * Shape of an option in the dropdown
 */
export interface MultiSelectOption {
    /** Unique identifier for the option */
    value: string
    /** Display label (can be a React component for custom rendering) */
    label: string | React.ReactNode
}

/**
 * Props for the MultiSelect component
 */
interface MultiSelectProps {
    /** Array of static options to display */
    options: MultiSelectOption[]
    /** Array of selected item values */
    selected: string[]
    /** Callback fired when selection changes */
    onSelectedChange: (selected: string[]) => void
    /** Placeholder text shown when no items are selected */
    placeholder?: string
    /** Placeholder text shown in the search input */
    searchPlaceholder?: string
    /** Text shown when no options are found */
    emptyText?: string
    /** Whether the component is disabled */
    disabled?: boolean
    /** Additional CSS classes for the trigger button */
    className?: string
    /** 
     * Additional CSS classes for the popover content (allows separate width/maxWidth styling)
     * By default, the popover width is at minimum the trigger button width, and grows to fit content when wider.
     * Use this prop to override with a fixed width (e.g., "w-96") or other custom styling.
     */
    popoverClassName?: string
    /** Maximum number of items that can be selected (single-select if set to 1) */
    maxCount?: number
    /** Whether to show the search input @default true */
    searchable?: boolean
    /** Size of the trigger button @default "lg" */
    size?: "sm" | "lg" | "default" | "icon"
}

/**
 * MultiSelect Component
 * 
 * A simple multi-select dropdown component with static options and local filtering.
 * Use this when you have a small, fixed list of options. For API-driven data with
 * pagination, use MultiSelectApi instead.
 * 
 * Features:
 * - Local search/filtering
 * - Single or multi-select modes
 * - Custom label rendering (React nodes supported)
 * - Configurable max selection count
 * 
 * @example
 * // Basic multi-select
 * <MultiSelect
 *   options={[
 *     { value: "1", label: "Option 1" },
 *     { value: "2", label: "Option 2" },
 *     { value: "3", label: "Option 3" }
 *   ]}
 *   selected={selectedValues}
 *   onSelectedChange={setSelectedValues}
 *   placeholder="Select options..."
 * />
 * 
 * @example
 * // Single-select mode
 * <MultiSelect
 *   options={statusOptions}
 *   selected={status ? [status] : []}
 *   onSelectedChange={(values) => setStatus(values[0] || null)}
 *   maxCount={1}
 *   placeholder="Select status"
 * />
 * 
 * @example
 * // With custom labels
 * <MultiSelect
 *   options={[
 *     { value: "active", label: <Badge variant="success">Active</Badge> },
 *     { value: "pending", label: <Badge variant="warning">Pending</Badge> },
 *     { value: "inactive", label: <Badge variant="destructive">Inactive</Badge> }
 *   ]}
 *   selected={selectedStatuses}
 *   onSelectedChange={setSelectedStatuses}
 * />
 * 
 * @example
 * // Without search (for short lists)
 * <MultiSelect
 *   options={[
 *     { value: "yes", label: "Yes" },
 *     { value: "no", label: "No" }
 *   ]}
 *   selected={answer ? [answer] : []}
 *   onSelectedChange={(values) => setAnswer(values[0])}
 *   searchable={false}
 *   maxCount={1}
 * />
 * 
 * @example
 * // With custom popover width (separate from trigger button)
 * <MultiSelect
 *   options={options}
 *   selected={selectedValues}
 *   onSelectedChange={setSelectedValues}
 *   className="w-full" // Controls trigger button width
 *   popoverClassName="w-96 max-w-[90vw]" // Controls popover content width
 * />
 */
export function MultiSelect({
    options,
    selected,
    onSelectedChange,
    placeholder = "Select items...",
    searchPlaceholder = "Search...",
    emptyText = "No items found.",
    disabled = false,
    size = "lg",
    className,
    popoverClassName,
    maxCount,
    searchable = true,
}: MultiSelectProps) {
    const { t } = useTranslation()
    const [open, setOpen] = React.useState(false)

    const handleToggle = (value: string) => {
        if (selected.includes(value)) {
            onSelectedChange(selected.filter((item) => item !== value))
        } else {
            // Single-select mode: Replace existing selection
            if (maxCount === 1 && selected.length >= maxCount) {
                onSelectedChange([value])
                return
            }

            // Check max count limit
            if (maxCount && selected.length >= maxCount) {
                // Replace the last selected item with the new one when at max
                onSelectedChange([...selected.slice(0, maxCount - 1), value])
            } else {
                onSelectedChange([...selected, value])
            }
        }
    }

    /**
     * Get the text to display in the trigger button
     * - Shows placeholder if nothing selected
     * - Shows label if one item selected
     * - Shows count if multiple items selected
     */
    const getDisplayText = () => {
        if (selected.length === 0) {
            return placeholder
        }

        if (selected.length === 1) {
            const option = options.find(opt => opt.value === selected[0])
            return option?.label || selected[0]
        }

        return `${selected.length} ${t('common.itemsSelected', 'items selected')}`
    }

    /**
     * Build the array of selected options for display at top of dropdown
     */
    const selectedOptions: MultiSelectOption[] = selected.map(v => {
        const option = options.find(opt => opt.value === v)
        return option || { value: v, label: v }
    })

    /**
     * Filter out selected items from main options list
     * Prevents duplicates since selected items are shown in separate section at top
     */
    const unselectedOptions = options.filter(opt => !selected.includes(opt.value))

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    size={size}
                    className={cn(
                        "w-52 justify-between shadow-none relative h-9",
                        !selected.length && "text-muted-foreground font-normal",
                        className,
                        "shadow-none"
                    )}
                    disabled={disabled}
                >
                    <div className="flex flex-wrap gap-1 items-center flex-1 min-w-0 pr-4">
                        <div className={cn(selected.length > 0 ? "text-foreground" : "", "truncate")}>
                            {getDisplayText()}
                        </div>
                    </div>
                    <ChevronDown className="absolute right-2 h-4 w-4 shrink-0 text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className={cn("p-0 w-auto min-w-[var(--radix-popover-trigger-width)]", popoverClassName)}>
                <Command>
                    {searchable && (
                        <CommandInput placeholder={searchPlaceholder} />
                    )}
                    <CommandEmpty>{emptyText}</CommandEmpty>
                    {options.length === 0 && selectedOptions.length === 0 ? (
                        <div className="flex items-center justify-center py-6">
                            <span className="text-sm text-muted-foreground">{emptyText}</span>
                        </div>
                    ) : (
                        <ScrollArea className="h-64">
                            {/* 
                                SELECTED ITEMS SECTION
                                Always shown at the top with "Selected" heading
                                Items have accent background and check mark
                                Click to deselect
                            */}
                            {selectedOptions.length > 0 && (
                                <>
                                    <CommandGroup heading={t('common.selected', 'Selected')}>
                                        {selectedOptions.map((option) => (
                                            <CommandItem
                                                key={`selected-${option.value}`}
                                                value={option.value}
                                                className="group bg-accent/30"
                                                onSelect={() => handleToggle(option.value)}
                                            >
                                                <div className="flex items-center gap-2 w-full justify-between min-w-0">
                                                    <span className="flex-1 min-w-0">{option.label}</span>
                                                    <Check className="h-4 w-4 text-primary shrink-0" />
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                    {/* Divider between selected and unselected */}
                                    {unselectedOptions.length > 0 && <CommandSeparator />}
                                </>
                            )}

                            {/* 
                                UNSELECTED OPTIONS SECTION
                                All options that aren't currently selected
                                Click to select
                            */}
                            {unselectedOptions.length > 0 && (
                                <CommandGroup>
                                    {unselectedOptions.map((option) => (
                                        <CommandItem
                                            key={option.value}
                                            value={option.value}
                                            className="group"
                                            onSelect={() => handleToggle(option.value)}
                                        >
                                            <div className="flex items-center gap-2 w-full justify-between min-w-0">
                                                <span className="flex-1 min-w-0">{option.label}</span>
                                                {/* Invisible placeholder to reserve space for checkmark when selected */}
                                                <Check className="h-4 w-4 shrink-0 opacity-0 pointer-events-none" />
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </ScrollArea>
                    )}
                </Command>
            </PopoverContent>
        </Popover>
    )
}

/**
 * ============================================================================
 * WHEN TO USE MULTISELECT VS MULTISELECTAPI
 * ============================================================================
 * 
 * Use **MultiSelect** (this component) when:
 * - You have a small, static list of options (< 50 items)
 * - All options can be loaded at once without performance issues
 * - No pagination or API calls needed
 * - Options come from constants, enums, or local state
 * 
 * Examples: Status dropdowns, priority levels, fixed categories, yes/no options
 * 
 * Use **MultiSelectApi** when:
 * - Options come from an API endpoint
 * - Large datasets requiring pagination (hundreds/thousands of items)
 * - Need search functionality on the backend
 * - Need to show labels for pre-selected items without loading all options
 * 
 * Examples: Employees, clients, locations, job titles, any database-driven list
 * 
 * ============================================================================
 */
