"use client"

import * as React from "react"
import { Check, ChevronDown, Loader2 } from "lucide-react"
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
import { toast } from "sonner"
import { useTranslation } from "@/hooks/useTranslation"
import { useTableFilters } from "@/hooks/use-table-filters"
import { TableFilters } from "@/types/general/filters"
import TableFiltersRow from "@/app/components/table-filters/table-filters"

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
 * Props for the MultiSelectApi component
 */
interface MultiSelectApiProps {
  /**
   * Async function that fetches options from API
   * Should return { success: { [optionsKey]: items[], next_page_token?: string } }
   */
  fetchOptions: (...args: any[]) => Promise<any>

  /** 
   * Arguments to pass to fetchOptions (excluding query and page token)
   * @example [orgId, additionalParam]
   */
  fetchArgs?: any[]

  /** 
   * Key in the API response that contains the array of items
   * @example "employees" for response.success.employees
   */
  optionsKey: string

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

  /**
   * Callback fired when selection changes
   * @param value - Array of selected item IDs
   */
  onChangeValue: (value: string[]) => void

  /**
   * Advanced callback that provides full item data
   * @param value - Array of selected item IDs
   * @param items - Map of all selected items (key: id, value: full item object)
   * @param lastChangedItem - The item that was just selected/deselected (null if deselected)
   */
  onChangeValueWithItem?: (value: string[], items: Map<string, any>, lastChangedItem: any | null) => void

  /**
   * Function to extract the unique ID from an item
   * @example (item) => item.id
   */
  customValueKey: (item: any) => string

  /**
   * Function to render the label for an item in dropdown options
   * Can return a string or React component
   * @example (item) => item.name
   * @example (item) => <EmployeeAvatar employee={item} />
   */
  customLabelKey: (item: any) => string | React.ReactNode

  /**
   * Optional function to render the label for selected items (in trigger button)
   * If not provided, uses customLabelKey
   * @example (item) => <EmployeeAvatar employee={item} showName={false} />
   */
  customSelectedLabelKey?: (item: any) => string | React.ReactNode

  /**
   * Optional function to determine if an item should be disabled
   * @param item - The item to check
   * @param options - All available options
   * @returns true if the item should be disabled
   */
  customIsItemDisabled?: (item: any, options: MultiSelectOption[]) => boolean

  /** 
   * Array of selected item IDs
   * @example ["emp_001", "emp_002"]
   */
  value: string[]

  /**
   * Initial items with full data for pre-populating labels
   * Essential for edit mode to show proper labels before API loads
   * @example employee?.job_title ? [employee.job_title] : undefined
   */
  defaultItems?: any[]

  /**
   * Whether search queries should trigger API calls
   * If true, searches via API (with 300ms debounce)
   * If false, filters locally (frontend filtering)
   * @default true
   */
  isApiSearchable?: boolean

  /**
   * Maximum number of items that can be selected
   * Set to 1 for single-select behavior
   * @example 1 for single select
   */
  maxCount?: number

  /**
   * Whether to show the search input
   * @default true
   */
  searchable?: boolean

  /**
   * Size of the trigger button
   * @default "lg"
   */
  size?: "sm" | "lg" | "default" | "icon"

  /**
   * When true, integrates with table filters and passes params to fetchOptions.
   * Use "hidden" to enable params but hide the TableFiltersRow from display.
   * @default false
   */
  enableParams?: boolean | "hidden"

  /**
   * Default filters passed to useTableFilters as defaultFilters (when enableParams is true)
   * Can be a string (template key), TableFilters object, or null - same as useTableFilters defaultFilters
   */
  defaultParams?: string | TableFilters | null

  /**
   * Whether to auto-save params to session storage (passed to useTableFilters as autoSave)
   * Only applies when enableParams is true
   * @default false
   */
  autoSaveParams?: boolean
}

/**
 * MultiSelectApi Component
 * 
 * A flexible multi-select dropdown component that fetches options from an API with advanced features:
 * - Infinite scroll pagination with page tokens
 * - Search with debouncing (300ms)
 * - Persistent label storage for selected items
 * - Selected items always visible at top of dropdown
 * - Single or multi-select modes
 * - Custom label rendering (React nodes supported)
 * 
 * @example
 * // Basic usage
 * <MultiSelectApi
 *   fetchOptions={getEmployees}
 *   fetchArgs={[orgId]}
 *   optionsKey="employees"
 *   customValueKey={(item) => item.id}
 *   customLabelKey={(item) => item.name}
 *   value={selectedIds}
 *   onChangeValue={setSelectedIds}
 *   placeholder="Select employees..."
 * />
 * 
 * @example
 * // Single-select with custom label
 * <MultiSelectApi
 *   fetchOptions={getEmployees}
 *   fetchArgs={[orgId]}
 *   optionsKey="employees"
 *   customValueKey={(item) => item.id}
 *   customLabelKey={(item) => <EmployeeAvatar employee={item} />}
 *   value={selectedId ? [selectedId] : []}
 *   onChangeValue={(values) => setSelectedId(values[0] || null)}
 *   maxCount={1}
 * />
 * 
 * @example
 * // Edit mode with pre-populated labels
 * <MultiSelectApi
 *   fetchOptions={getEmployees}
 *   fetchArgs={[orgId]}
 *   optionsKey="employees"
 *   customValueKey={(item) => item.id}
 *   customLabelKey={(item) => item.name}
 *   value={[employee.reporting_to_id]}
 *   defaultItems={employee.reporting_to ? [employee.reporting_to] : undefined}
 *   onChangeValue={(values) => field.onChange(values[0])}
 *   maxCount={1}
 * />
 * 
 * @example
 * // With onChangeValueWithItem callback
 * <MultiSelectApi
 *   fetchOptions={getJobTitles}
 *   fetchArgs={[orgId]}
 *   optionsKey="job_titles"
 *   customValueKey={(item) => item.id}
 *   customLabelKey={(item) => item.name}
 *   value={selectedIds}
 *   onChangeValue={setSelectedIds}
 *   onChangeValueWithItem={(values, itemsMap, lastItem) => {
 *     // Access full item data
 *     if (lastItem) {
 *       console.log('Last selected:', lastItem)
 *     }
 *     // Access all selected items
 *     const allItems = Array.from(itemsMap.values())
 *   }}
 * />
 * 
 * @example
 * // With custom popover width (separate from trigger button)
 * <MultiSelectApi
 *   fetchOptions={getEmployees}
 *   fetchArgs={[orgId]}
 *   optionsKey="employees"
 *   customValueKey={(item) => item.id}
 *   customLabelKey={(item) => item.name}
 *   value={selectedIds}
 *   onChangeValue={setSelectedIds}
 *   className="w-full" // Controls trigger button width
 *   popoverClassName="w-96 max-w-[90vw]" // Controls popover content width
 * />
 */
export function MultiSelectApi({
  fetchOptions,
  fetchArgs = [],
  optionsKey,
  customValueKey,
  customLabelKey,
  customSelectedLabelKey,
  placeholder = "Select items...",
  searchPlaceholder = "Search...",
  emptyText = "No items found.",
  disabled = false,
  size = "lg",
  className,
  popoverClassName,
  onChangeValue,
  onChangeValueWithItem,
  customIsItemDisabled,
  value,
  defaultItems,
  isApiSearchable = true,
  maxCount,
  searchable = true,
  enableParams = false,
  defaultParams,
  autoSaveParams = false,
}: MultiSelectApiProps) {
  const { t } = useTranslation()

  const paramsEnabled = enableParams === true || enableParams === "hidden"
  const showFiltersRow = enableParams === true

  const { tableFilters, setTableFilters } = useTableFilters({
    defaultFilters: paramsEnabled ? defaultParams : null,
    autoSave: paramsEnabled ? autoSaveParams : false,
  })

  const effectiveParams = paramsEnabled ? tableFilters : undefined

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  /** Whether the dropdown is currently open */
  const [open, setOpen] = React.useState(false)

  /** Currently loaded options from the API */
  const [options, setOptions] = React.useState<MultiSelectOption[]>([])

  /** Loading state for initial/search API calls */
  const [loading, setLoading] = React.useState(false)

  /** Loading state for infinite scroll pagination */
  const [loadingMore, setLoadingMore] = React.useState(false)

  /** Current search query (debounced) */
  const [searchQuery, setSearchQuery] = React.useState("")

  /**
   * PERSISTENT STORAGE: Store full selected items
   * This Map persists selected items even when:
   * - Dropdown is closed
   * - Search query changes
   * - Different page is loaded
   * 
   * Key: item ID (from customValueKey)
   * Value: full item object
   * 
   * This allows labels to be displayed correctly without needing the API
   */
  const [selectedItems, setSelectedItems] = React.useState<Map<string, any>>(() => {
    // Initialize with defaultItems if provided (important for edit mode)
    if (defaultItems && defaultItems.length > 0) {
      const initialMap = new Map<string, any>()
      defaultItems.forEach(item => {
        if (item) {
          const itemValue = customValueKey(item)
          initialMap.set(itemValue, item)
        }
      })
      return initialMap
    }
    return new Map()
  })

  /**
   * CURRENT PAGE STORAGE: Store items from current API response
   * This Map is updated on each API call and used for label lookup
   * when user selects items from the current page
   * 
   * Key: item ID (from customValueKey)
   * Value: full item object
   */
  const [itemsMap, setItemsMap] = React.useState<Map<string, any>>(new Map())

  /** 
   * PAGINATION: Token for loading next page
   * Returned by API as response.success.next_page_token
   */
  const [nextPageToken, setNextPageToken] = React.useState<string | null>(null)

  // ============================================================================
  // REFS
  // ============================================================================

  const scrollAreaRef = React.useRef<HTMLDivElement>(null)

  /** Ref for infinite scroll trigger element */
  const loadMoreRef = React.useRef<HTMLDivElement>(null)

  /** Timer for search debouncing (300ms) */
  const debounceTimer = React.useRef<NodeJS.Timeout | null>(null)

  /** Track if initial load has happened (prevents duplicate fetches) */
  const hasLoadedOnce = React.useRef(false)

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Update selectedItems when defaultItems changes
   * This is triggered when the form is reset with new data (e.g., loading a different record in edit mode)
   */
  React.useEffect(() => {
    if (defaultItems && defaultItems.length > 0) {
      setSelectedItems(prev => {
        const newMap = new Map(prev)
        defaultItems.forEach(item => {
          if (item) {
            const itemValue = customValueKey(item)
            // Only add if not already in the map (prevents overwriting user selections)
            if (!newMap.has(itemValue)) {
              newMap.set(itemValue, item)
            }
          }
        })
        return newMap
      })
    }
  }, [defaultItems, customValueKey])

  /**
   * Sync selectedItems with value prop - remove items that are no longer selected
   * This ensures the internal Map stays in sync when items are unselected
   */
  React.useEffect(() => {
    setSelectedItems(prev => {
      let hasChanges = false
      const newMap = new Map(prev)
      
      // Remove items that are no longer in the value array
      for (const key of newMap.keys()) {
        if (!value.includes(key)) {
          newMap.delete(key)
          hasChanges = true
        }
      }
      
      // Only update if there were actual changes
      return hasChanges ? newMap : prev
    })
  }, [value])

  // ============================================================================
  // API FUNCTIONS
  // ============================================================================

  /**
   * Fetch options from API with pagination support
   * 
   * @param query - Search query string
   * @param pageToken - Token for pagination (from previous API response)
   * @param append - If true, append results to existing options; if false, replace them
   * 
   * Expected API response format:
   * {
   *   success: {
   *     [optionsKey]: [ ...items ],
   *     next_page_token?: string
   *   }
   * }
   */
  const loadOptions = React.useCallback(async (
    query: string,
    pageToken: string | null = null,
    append: boolean = false
  ) => {
    if (!append) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const response = await fetchOptions(...fetchArgs, query, pageToken, effectiveParams ?? null)

      if (response.success) {
        const data = response.success[optionsKey] || []
        const newNextPageToken = response.success.next_page_token || null

        // Set tableFilters from API response on first load (like AbsencesPage)
        if (paramsEnabled && !tableFilters && (response.success as any).params) {
          setTableFilters((response.success as any).params)
        }

        // Build items map - keep existing items when appending
        const newItemsMap = append ? new Map(itemsMap) : new Map<string, any>()
        const newOptions = data.map((item: any) => {
          const itemValue = customValueKey(item)
          newItemsMap.set(itemValue, item)
          return {
            value: itemValue,
            label: customLabelKey(item),
          }
        })

        setItemsMap(newItemsMap)
        setNextPageToken(newNextPageToken)

        if (append) {
          setOptions(prev => [...prev, ...newOptions])
        } else {
          setOptions(newOptions)
        }
      } else {
        if (!append) {
          setOptions([])
        }
        setNextPageToken(null)
      }
    } catch (error) {
      console.error("Error loading options:", error)
      if (!append) {
        setOptions([])
      }
      setNextPageToken(null)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [fetchOptions, fetchArgs, optionsKey, nextPageToken, customValueKey, customLabelKey, itemsMap, effectiveParams, paramsEnabled, tableFilters, setTableFilters])

  /**
   * Trigger loading more items when user scrolls to bottom
   */
  const handleLoadMore = React.useCallback(() => {
    if (!loadingMore && nextPageToken && !loading) {
      loadOptions(searchQuery, nextPageToken, true)
    }
  }, [loadingMore, loading, nextPageToken, loadOptions, searchQuery])

  /**
   * INFINITE SCROLL: Setup IntersectionObserver to detect when user scrolls to bottom
   * When the loadMoreRef element becomes visible, trigger loading more items
   */
  React.useEffect(() => {
    if (!loadMoreRef.current || !open) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextPageToken && !loadingMore && !loading) {
          handleLoadMore()
        }
      },
      { threshold: 0.1 } // Trigger when 10% of the element is visible
    )

    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [open, nextPageToken, loadingMore, loading, handleLoadMore])

  /**
   * Fetch initial options when popover opens for the first time
   */
  React.useEffect(() => {
    if (open && !hasLoadedOnce.current) {
      hasLoadedOnce.current = true
      loadOptions(searchQuery)
    }
  }, [open])

  /**
   * DEBOUNCED SEARCH: Handle search query changes with 300ms debounce
   * Only triggers if isApiSearchable is true, otherwise uses frontend filtering
   */
  React.useEffect(() => {
    if (!isApiSearchable || !open) return

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      setNextPageToken(null) // Reset pagination on new search
      loadOptions(searchQuery)
    }, 300)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [searchQuery, isApiSearchable, open])

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Handle selecting/deselecting an item
   * Updates both the value array and the selectedItems Map
   * 
   * @param selectedValue - The ID of the item being toggled
   */
  const handleToggle = (selectedValue: string) => {
    // Look for item in both maps (current page or previously selected)
    const item = itemsMap.get(selectedValue) || selectedItems.get(selectedValue)
    const newSelectedItems = new Map(selectedItems)

    if (value.includes(selectedValue)) {
      // DESELECT: Remove from selection
      const newValue = value.filter((v) => v !== selectedValue)
      newSelectedItems.delete(selectedValue)
      setSelectedItems(newSelectedItems)
      onChangeValue(newValue)
      onChangeValueWithItem?.(newValue, newSelectedItems, null)
    } else {
      // SELECT: Add to selection

      // Single-select mode: Replace existing selection
      if (maxCount === 1 && value.length >= maxCount) {
        const newValue = [selectedValue]
        const singleMap = new Map<string, any>()
        if (item) singleMap.set(selectedValue, item)
        setSelectedItems(singleMap)
        onChangeValue(newValue)
        onChangeValueWithItem?.(newValue, singleMap, item || null)
        setOpen(false)
        return
      }

      // Check max count limit
      if (maxCount && value.length >= maxCount) {
        toast.error(t('common.maxCount', 'You can only select up to {{maxCount}} items', { maxCount }))
        return
      }

      // Multi-select mode: Add to existing selection
      const newValue = [...value, selectedValue]
      if (item) {
        newSelectedItems.set(selectedValue, item)
      }
      setSelectedItems(newSelectedItems)
      onChangeValue(newValue)
      onChangeValueWithItem?.(newValue, newSelectedItems, item || null)
      
      // Close dropdown when maxCount is reached
      if (maxCount && newValue.length >= maxCount) {
        setOpen(false)
      }
    }
  }

  // ============================================================================
  // DISPLAY HELPERS
  // ============================================================================

  /**
   * Get the text to display in the trigger button
   * - Shows placeholder if nothing selected
   * - Shows label if one item selected
   * - Shows count if multiple items selected
   */
  const getDisplayText = () => {
    if (value.length === 0) {
      return placeholder
    }

    if (value.length === 1) {
      // Try to get label from selectedItems first (persistent storage)
      const item = selectedItems.get(value[0])
      if (item) {
        // Use customSelectedLabelKey if provided, otherwise use customLabelKey
        return customSelectedLabelKey ? customSelectedLabelKey(item) : customLabelKey(item)
      }
      // Fallback to current options or raw value
      const option = options.find(opt => opt.value === value[0])
      return option?.label || value[0]
    }

    return `${value.length} ${t('common.itemsSelected', 'items selected')}`
  }

  /**
   * Build the array of selected options for display at top of dropdown
   * Uses persistent storage (selectedItems) for accurate labels
   */
  const selectedOptions: MultiSelectOption[] = value.map(v => {
    const item = selectedItems.get(v)
    if (item) {
      return { value: v, label: customLabelKey(item) }
    }
    const option = options.find(opt => opt.value === v)
    return option || { value: v, label: v }
  })

  /**
   * Filter out selected items from main options list
   * Prevents duplicates since selected items are shown in separate section at top
   */
  const unselectedOptions = options.filter(opt => !value.includes(opt.value))

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      {/* TRIGGER BUTTON */}
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          size={size}
          className={cn(
            "w-52 justify-between shadow-none relative h-9",
            !value.length && "text-muted-foreground font-normal",
            className,
            "shadow-none"
          )}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 items-center flex-1 min-w-0 pr-4">
            <div className={cn(value.length > 0 ? "text-foreground" : "", "truncate")}>
              {getDisplayText()}
            </div>
          </div>
          <ChevronDown className="absolute right-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      {/* DROPDOWN CONTENT */}
      <PopoverContent className={cn("p-0 w-auto min-w-[var(--radix-popover-trigger-width)]", popoverClassName)}>
        <Command shouldFilter={!isApiSearchable}>
          {/* SEARCH INPUT */}
          {searchable && (
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
          )}

          {/* TABLE FILTERS ROW - between search and content when enableParams is true (not "hidden") */}
          {showFiltersRow && tableFilters && (
            <div className="px-2 py-1.5 border-b shrink-0">
              <TableFiltersRow
                value={tableFilters}
                onChange={setTableFilters}
                onFilter={() => {
                  setNextPageToken(null)
                  loadOptions(searchQuery)
                }}
                debounceMs={300}
              />
            </div>
          )}

          {/* LOADING STATE (initial load) */}
          {loading && options.length === 0 && selectedOptions.length === 0 ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : options.length === 0 && selectedOptions.length === 0 ? (
            /* EMPTY STATE */
            <CommandEmpty>{emptyText}</CommandEmpty>
          ) : (
            <ScrollArea className="h-64" ref={scrollAreaRef}>
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
                All options from API that aren't currently selected
                Click to select
              */}
              {unselectedOptions.length > 0 && (
                <CommandGroup>
                  {unselectedOptions.map((option) => {
                    const itemData = itemsMap.get(option.value)
                    const isDisabled = customIsItemDisabled ? customIsItemDisabled(itemData, options) : false
                    return (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        disabled={isDisabled}
                        className="group"
                        onSelect={() => handleToggle(option.value)}
                      >
                        <div className="flex items-center gap-2 w-full justify-between min-w-0">
                          <span className="flex-1 min-w-0">{option.label}</span>
                          {/* Invisible placeholder to reserve space for checkmark when selected */}
                          <Check className="h-4 w-4 shrink-0 opacity-0 pointer-events-none" />
                        </div>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}

              {/* 
                INFINITE SCROLL TRIGGER
                IntersectionObserver watches this element
                When visible and nextPageToken exists, loads more items
                Shows spinner while loading
              */}
              <div
                ref={loadMoreRef}
                className="flex items-center justify-center py-2"
              >
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </ScrollArea>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/**
 * ============================================================================
 * KEY FEATURES
 * ============================================================================
 * 
 * 1. PERSISTENT LABEL STORAGE
 *    - Selected items are stored with their full object data in a Map
 *    - Labels remain correct even after dropdown closes or search changes
 *    - Essential for edit forms where you need to show the label immediately
 * 
 * 2. INFINITE SCROLL PAGINATION
 *    - Automatically loads more items when scrolling to bottom
 *    - Uses IntersectionObserver for performance
 *    - Handles page tokens from API (response.success.next_page_token)
 * 
 * 3. SELECTED ITEMS ALWAYS VISIBLE
 *    - Selected items shown in separate section at top
 *    - Unselected items shown below (filtered to avoid duplicates)
 *    - Improves UX - always see what you've selected
 * 
 * 4. DEBOUNCED SEARCH
 *    - 300ms debounce on search input
 *    - Can be API-driven (isApiSearchable=true) or frontend-filtered
 *    - Resets pagination when search changes
 * 
 * 5. SINGLE & MULTI SELECT
 *    - Multi-select by default
 *    - Single-select mode via maxCount={1}
 *    - Enforces selection limits with user feedback
 * 
 * ============================================================================
 * API RESPONSE FORMAT
 * ============================================================================
 * 
 * Your fetchOptions function should return:
 * {
 *   success: {
 *     [optionsKey]: [
 *       { id: "1", name: "Item 1", ...otherFields },
 *       { id: "2", name: "Item 2", ...otherFields }
 *     ],
 *     next_page_token?: "token_for_next_page" // Optional, for pagination
 *   }
 * }
 * 
 * ============================================================================
 * MIGRATION GUIDE
 * ============================================================================
 * 
 * For edit forms, add the `defaultItems` prop to pre-populate labels:
 * 
 * Before:
 * <MultiSelectApi
 *   value={employee.job_title?.id ? [employee.job_title.id] : []}
 *   // ... other props
 * />
 * // Problem: Shows ID instead of label until dropdown opens
 * 
 * After:
 * <MultiSelectApi
 *   value={employee.job_title?.id ? [employee.job_title.id] : []}
 *   defaultItems={employee.job_title ? [employee.job_title] : undefined}
 *   // ... other props
 * />
 * // Solution: Label shows immediately using the full object
 * 
 * ============================================================================
 * COMMON PATTERNS
 * ============================================================================
 * 
 * // Pattern 1: Simple multi-select
 * <MultiSelectApi
 *   fetchOptions={getEmployees}
 *   fetchArgs={[orgId]}
 *   optionsKey="employees"
 *   customValueKey={(item) => item.id}
 *   customLabelKey={(item) => item.name}
 *   value={selectedEmployeeIds}
 *   onChangeValue={setSelectedEmployeeIds}
 * />
 * 
 * // Pattern 2: Single-select (behaves like a searchable select)
 * <MultiSelectApi
 *   fetchOptions={getManagers}
 *   fetchArgs={[orgId]}
 *   optionsKey="managers"
 *   customValueKey={(item) => item.id}
 *   customLabelKey={(item) => <EmployeeAvatar employee={item} />}
 *   value={managerId ? [managerId] : []}
 *   onChangeValue={(values) => setManagerId(values[0] || null)}
 *   maxCount={1}
 * />
 * 
 * // Pattern 3: Edit mode with pre-populated data
 * <MultiSelectApi
 *   fetchOptions={getGroups}
 *   fetchArgs={[orgId]}
 *   optionsKey="groups"
 *   customValueKey={(item) => item.id}
 *   customLabelKey={(item) => item.name}
 *   value={employee.groups?.map(g => g.id) || []}
 *   defaultItems={employee.groups}
 *   onChangeValue={(values) => form.setValue('groups_ids', values)}
 * />
 * 
 * // Pattern 4: With item data callback (auto-fill form fields)
 * <MultiSelectApi
 *   fetchOptions={getJobTitles}
 *   fetchArgs={[orgId]}
 *   optionsKey="job_titles"
 *   customValueKey={(item) => item.id}
 *   customLabelKey={(item) => item.name}
 *   value={jobTitleId ? [jobTitleId] : []}
 *   onChangeValue={(values) => setJobTitleId(values[0])}
 *   onChangeValueWithItem={(values, itemsMap, lastItem) => {
 *     // Auto-fill related form fields
 *     if (lastItem) {
 *       form.setValue('pmc', lastItem.pmc)
 *       form.setValue('pvp', lastItem.pvp)
 *     }
 *   }}
 *   maxCount={1}
 * />
 *
 * // Pattern 5: With table filters - uses defaultParams for initial filters (like history-client-location-section)
 * // or sets from API response on first load (like AbsencesPage)
 * <MultiSelectApi
 *   fetchOptions={getEmployees}
 *   fetchArgs={[orgId]}
 *   optionsKey="employees"
 *   customValueKey={(item) => item.id}
 *   customLabelKey={(item) => item.name}
 *   value={selectedIds}
 *   onChangeValue={setSelectedIds}
 *   enableParams={true}
 *   defaultParams="employees"
 *   autoSaveParams={false}
 * />
 */
