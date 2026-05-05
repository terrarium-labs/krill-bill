"use client"

import * as React from "react"
import { Check, ChevronDown, ChevronRight, Loader2 } from "lucide-react"
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

/**
 * Shape of an option in the dropdown
 */
export interface MultiSelectOption {
  /** Unique identifier for the option */
  value: string
  /** Display label (can be a React component for custom rendering) */
  label: string | React.ReactNode
  /** Parent value (optional) */
  parentValue?: string | null
  /** Level in hierarchy (0 = root) */
  level?: number
}

/**
 * Props for the MultiSelectApiHierarchy component
 */
interface MultiSelectApiHierarchyProps {
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

  /**
   * Key to access the parent relationship in the item
   * Can be a string (direct property) or function to extract parent ID
   * @example "parent" for item.parent?.id
   * @example "parent_type" for item.parent_type?.id
   * @example (item) => item.parent?.id
   */
  parentKey: string | ((item: any) => string | null | undefined)

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
   * Whether to show hierarchy indicators (indentation and chevrons)
   * @default true
   */
  showHierarchyIndicators?: boolean
}

/**
 * MultiSelectApiHierarchy Component
 * 
 * A flexible multi-select dropdown component that displays options in a hierarchical structure.
 * Extends the base MultiSelectApi with parent-child relationship support.
 * 
 * @example
 * // Usage with Groups (has "parent" field)
 * <MultiSelectApiHierarchy
 *   fetchOptions={getGroups}
 *   fetchArgs={[orgId]}
 *   optionsKey="groups"
 *   parentKey="parent"
 *   customValueKey={(item) => item.id}
 *   customLabelKey={(item) => item.name}
 *   value={selectedIds}
 *   onChangeValue={setSelectedIds}
 * />
 * 
 * @example
 * // Usage with OrderTypes (has "parent_type" field)
 * <MultiSelectApiHierarchy
 *   fetchOptions={getOrderTypes}
 *   fetchArgs={[orgId]}
 *   optionsKey="order_types"
 *   parentKey="parent_type"
 *   customValueKey={(item) => item.id}
 *   customLabelKey={(item) => item.name}
 *   value={selectedIds}
 *   onChangeValue={setSelectedIds}
 * />
 * 
 * @example
 * // Usage with custom parent accessor
 * <MultiSelectApiHierarchy
 *   fetchOptions={getInventory}
 *   fetchArgs={[orgId]}
 *   optionsKey="inventory"
 *   parentKey={(item) => item.parent?.id}
 *   customValueKey={(item) => item.id}
 *   customLabelKey={(item) => item.name}
 *   value={selectedIds}
 *   onChangeValue={setSelectedIds}
 * />
 */
export function MultiSelectApiHierarchy({
  fetchOptions,
  fetchArgs = [],
  optionsKey,
  parentKey,
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
  showHierarchyIndicators = true,
}: MultiSelectApiHierarchyProps) {
  const { t } = useTranslation()

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

  /** Expanded/collapsed state for hierarchy */
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set())

  /**
   * PERSISTENT STORAGE: Store full selected items
   */
  const [selectedItems, setSelectedItems] = React.useState<Map<string, any>>(() => {
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
   */
  const [itemsMap, setItemsMap] = React.useState<Map<string, any>>(new Map())

  /** 
   * PAGINATION: Token for loading next page
   */
  const [nextPageToken, setNextPageToken] = React.useState<string | null>(null)

  // ============================================================================
  // REFS
  // ============================================================================

  const scrollAreaRef = React.useRef<HTMLDivElement>(null)
  const loadMoreRef = React.useRef<HTMLDivElement>(null)
  const debounceTimer = React.useRef<NodeJS.Timeout | null>(null)
  const hasLoadedOnce = React.useRef(false)

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Extract parent ID from an item using parentKey
   */
  const getParentId = React.useCallback((item: any): string | null => {
    if (typeof parentKey === 'function') {
      return parentKey(item) || null
    }

    // Handle nested object (e.g., parent.id or parent_type.id)
    const parentObj = item[parentKey]
    if (parentObj && typeof parentObj === 'object' && 'id' in parentObj) {
      return parentObj.id || null
    }

    return parentObj || null
  }, [parentKey])

  /**
   * Build hierarchical options structure with levels
   */
  const buildHierarchy = React.useCallback((items: any[]): MultiSelectOption[] => {
    // First, create a map of all items
    const itemMap = new Map<string, any>()
    items.forEach(item => {
      const itemValue = customValueKey(item)
      itemMap.set(itemValue, item)
    })

    // Calculate levels for each item
    const calculateLevel = (item: any, visited = new Set<string>()): number => {
      const itemValue = customValueKey(item)

      // Prevent infinite loops
      if (visited.has(itemValue)) {
        return 0
      }
      visited.add(itemValue)

      const parentId = getParentId(item)
      if (!parentId) {
        return 0 // Root level
      }

      const parentItem = itemMap.get(parentId)
      if (!parentItem) {
        return 0 // Parent not in current dataset, treat as root
      }

      return 1 + calculateLevel(parentItem, visited)
    }

    // Sort items by hierarchy (parents before children)
    const sortedItems = [...items].sort((a, b) => {
      const aLevel = calculateLevel(a)
      const bLevel = calculateLevel(b)

      // Sort by level first
      if (aLevel !== bLevel) {
        return aLevel - bLevel
      }

      // Within same level, sort alphabetically
      const aLabel = customLabelKey(a)
      const bLabel = customLabelKey(b)
      const aLabelStr = typeof aLabel === 'string' ? aLabel : String(aLabel)
      const bLabelStr = typeof bLabel === 'string' ? bLabel : String(bLabel)
      return aLabelStr.localeCompare(bLabelStr)
    })

    // Build the hierarchical options array
    const hierarchicalOptions: MultiSelectOption[] = []
    const processedIds = new Set<string>()

    const addItemAndChildren = (item: any, currentLevel: number = 0) => {
      const itemValue = customValueKey(item)

      if (processedIds.has(itemValue)) {
        return
      }
      processedIds.add(itemValue)

      const parentId = getParentId(item)
      hierarchicalOptions.push({
        value: itemValue,
        label: customLabelKey(item),
        parentValue: parentId,
        level: currentLevel,
      })

      // Add children
      sortedItems
        .filter(child => getParentId(child) === itemValue)
        .forEach(child => addItemAndChildren(child, currentLevel + 1))
    }

    // First add all root items (items without parent or parent not in dataset)
    sortedItems
      .filter(item => {
        const parentId = getParentId(item)
        return !parentId || !itemMap.has(parentId)
      })
      .forEach(item => addItemAndChildren(item, 0))

    return hierarchicalOptions
  }, [customValueKey, customLabelKey, getParentId])

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Update selectedItems when defaultItems changes
   */
  React.useEffect(() => {
    if (defaultItems && defaultItems.length > 0) {
      setSelectedItems(prev => {
        const newMap = new Map(prev)
        defaultItems.forEach(item => {
          if (item) {
            const itemValue = customValueKey(item)
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
   * Sync selectedItems with value prop
   */
  React.useEffect(() => {
    setSelectedItems(prev => {
      let hasChanges = false
      const newMap = new Map(prev)

      for (const key of newMap.keys()) {
        if (!value.includes(key)) {
          newMap.delete(key)
          hasChanges = true
        }
      }

      return hasChanges ? newMap : prev
    })
  }, [value])

  /**
   * Auto-expand selected items and their parents
   */
  React.useEffect(() => {
    if (value.length > 0 && options.length > 0) {
      const newExpanded = new Set(expandedItems)

      value.forEach(selectedValue => {
        // Find the option
        const option = options.find(opt => opt.value === selectedValue)
        if (option && option.parentValue) {
          // Expand all parents up the tree
          let currentParent = option.parentValue
          while (currentParent) {
            newExpanded.add(currentParent)
            const parentOption = options.find(opt => opt.value === currentParent)
            currentParent = parentOption?.parentValue || ''
          }
        }
      })

      if (newExpanded.size !== expandedItems.size) {
        setExpandedItems(newExpanded)
      }
    }
  }, [value, options])

  // ============================================================================
  // API FUNCTIONS
  // ============================================================================

  /**
   * Fetch options from API with pagination support
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
      const response = await fetchOptions(...fetchArgs, query, pageToken, null)

      if (response.success) {
        const data = response.success[optionsKey] || []
        const newNextPageToken = response.success.next_page_token || null

        // Build items map
        const newItemsMap = append ? new Map(itemsMap) : new Map<string, any>()
        data.forEach((item: any) => {
          const itemValue = customValueKey(item)
          newItemsMap.set(itemValue, item)
        })

        // Build hierarchical structure
        const allItems = Array.from(newItemsMap.values())
        const hierarchicalOptions = buildHierarchy(allItems)

        setItemsMap(newItemsMap)
        setNextPageToken(newNextPageToken)
        setOptions(hierarchicalOptions)
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
  }, [fetchOptions, fetchArgs, optionsKey, customValueKey, itemsMap, buildHierarchy])

  /**
   * Load more items (pagination)
   */
  const handleLoadMore = React.useCallback(() => {
    if (!loadingMore && nextPageToken && !loading) {
      loadOptions(searchQuery, nextPageToken, true)
    }
  }, [loadingMore, loading, nextPageToken, loadOptions, searchQuery])

  /**
   * Infinite scroll observer
   */
  React.useEffect(() => {
    if (!loadMoreRef.current || !open) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextPageToken && !loadingMore && !loading) {
          handleLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [open, nextPageToken, loadingMore, loading, handleLoadMore])

  /**
   * Initial load
   */
  React.useEffect(() => {
    if (open && !hasLoadedOnce.current) {
      hasLoadedOnce.current = true
      loadOptions(searchQuery)
    }
  }, [open])

  /**
   * Debounced search
   */
  React.useEffect(() => {
    if (!isApiSearchable || !open) return

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      setNextPageToken(null)
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
   * Toggle item selection
   */
  const handleToggle = (selectedValue: string) => {
    const item = itemsMap.get(selectedValue) || selectedItems.get(selectedValue)
    const newSelectedItems = new Map(selectedItems)

    if (value.includes(selectedValue)) {
      // Deselect
      const newValue = value.filter((v) => v !== selectedValue)
      newSelectedItems.delete(selectedValue)
      setSelectedItems(newSelectedItems)
      onChangeValue(newValue)
      onChangeValueWithItem?.(newValue, newSelectedItems, null)
    } else {
      // Select
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

      if (maxCount && value.length >= maxCount) {
        toast.error(t('common.maxCount', 'You can only select up to {{maxCount}} items', { maxCount }))
        return
      }

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

  /**
   * Toggle expand/collapse for an item
   */
  const toggleExpand = (itemValue: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemValue)) {
        newSet.delete(itemValue)
      } else {
        newSet.add(itemValue)
      }
      return newSet
    })
  }

  /**
   * Check if an item has children
   */
  const hasChildren = (itemValue: string): boolean => {
    return options.some(opt => opt.parentValue === itemValue)
  }

  /**
   * Check if an item should be visible based on parent expansion
   */
  const isItemVisible = (option: MultiSelectOption): boolean => {
    if (!option.parentValue) {
      return true // Root items always visible
    }

    // Check if parent is expanded
    if (!expandedItems.has(option.parentValue)) {
      return false
    }

    // Recursively check all parents
    const parentOption = options.find(opt => opt.value === option.parentValue)
    if (parentOption) {
      return isItemVisible(parentOption)
    }

    return true
  }

  // ============================================================================
  // DISPLAY HELPERS
  // ============================================================================

  /**
   * Get background color for hierarchy level
   */
  const getLevelBackground = (level: number): string => {
    const backgrounds = [
      'bg-blue-50/30',    // Level 0 - soft blue
      'bg-purple-50/30',  // Level 1 - soft purple
      'bg-green-50/30',   // Level 2 - soft green
      'bg-amber-50/30',   // Level 3 - soft amber
    ]
    return level < backgrounds.length ? backgrounds[level] : ''
  }

  /**
   * Get display text for trigger button
   */
  const getDisplayText = () => {
    if (value.length === 0) {
      return placeholder
    }

    if (value.length === 1) {
      const item = selectedItems.get(value[0])
      if (item) {
        return customSelectedLabelKey ? customSelectedLabelKey(item) : customLabelKey(item)
      }
      const option = options.find(opt => opt.value === value[0])
      return option?.label || value[0]
    }

    return `${value.length} ${t('common.itemsSelected', 'items selected')}`
  }

  /**
   * Build selected options array
   */
  const selectedOptions: MultiSelectOption[] = value.map(v => {
    const item = selectedItems.get(v)
    if (item) {
      return {
        value: v,
        label: customLabelKey(item),
        parentValue: getParentId(item),
        level: 0,
      }
    }
    const option = options.find(opt => opt.value === v)
    return option || { value: v, label: v, level: 0 }
  })

  /**
   * Filter visible options (including selected ones)
   */
  const visibleOptions = options
    .filter(opt => isItemVisible(opt))

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
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

      <PopoverContent className={cn("p-0 w-auto min-w-[var(--radix-popover-trigger-width)]", popoverClassName)}>
        <Command shouldFilter={!isApiSearchable}>
          {searchable && (
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
          )}

          {loading && options.length === 0 && selectedOptions.length === 0 ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : options.length === 0 && selectedOptions.length === 0 ? (
            <CommandEmpty>{emptyText}</CommandEmpty>
          ) : (
            <ScrollArea className="h-64" ref={scrollAreaRef}>
              {/* SELECTED ITEMS SECTION */}
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
                  {visibleOptions.length > 0 && <CommandSeparator />}
                </>
              )}

              {/* HIERARCHICAL OPTIONS SECTION */}
              {visibleOptions.length > 0 && (
                <CommandGroup>
                  {visibleOptions.map((option) => {
                    const itemData = itemsMap.get(option.value)
                    const isDisabled = customIsItemDisabled ? customIsItemDisabled(itemData, options) : false
                    const hasChild = hasChildren(option.value)
                    const isExpanded = expandedItems.has(option.value)
                    const indentLevel = option.level || 0
                    const isSelected = value.includes(option.value)

                    return (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        disabled={isDisabled}
                        className={cn(
                          "group relative overflow-visible",
                          isSelected && "bg-accent/30",
                          !isSelected && getLevelBackground(indentLevel)
                        )}
                        onSelect={() => handleToggle(option.value)}
                      >
                        {/* Vertical lines for each level */}
                        {showHierarchyIndicators && indentLevel > 0 && (
                          Array.from({ length: indentLevel }).map((_, levelIndex) => (
                            <div
                              key={`line-${levelIndex}`}
                              className="absolute top-0 bottom-0 border-l border-muted-foreground/20"
                              style={{ left: `${levelIndex > 0 ? levelIndex * 20 + 21 : 17}px` }}
                            />
                          ))
                        )}

                        <div className="flex items-center gap-2 w-full justify-between min-w-0 relative">
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            {/* Indentation */}
                            {showHierarchyIndicators && indentLevel > 0 && (
                              <span style={{ width: `${indentLevel * 20}px` }} className="shrink-0" />
                            )}

                            {/* Expand/Collapse Button */}
                            {showHierarchyIndicators && hasChild && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleExpand(option.value)
                                }}
                                className="shrink-0 hover:bg-accent rounded p-0.5 relative z-10"
                              >
                                <ChevronRight
                                  className={cn(
                                    "h-3 w-3 transition-transform",
                                    isExpanded && "rotate-90"
                                  )}
                                />
                              </button>
                            )}

                            {/* Placeholder for items without children */}
                            {showHierarchyIndicators && !hasChild && (
                              <span className="w-4 shrink-0" />
                            )}

                            <span className="flex-1 min-w-0 relative z-10">{option.label}</span>
                          </div>
                          <Check className={cn("h-4 w-4 shrink-0 relative z-10", isSelected ? "text-primary" : "opacity-0 pointer-events-none")} />
                        </div>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}

              {/* INFINITE SCROLL TRIGGER */}
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
 * 1. HIERARCHICAL DISPLAY
 *    - Automatically organizes options by parent-child relationships
 *    - Shows indentation for nested levels
 *    - Expandable/collapsible tree structure
 * 
 * 2. FLEXIBLE PARENT KEY
 *    - Supports different field names (parent, parent_type, etc.)
 *    - Works with both direct fields and nested objects
 *    - Custom accessor function support
 * 
 * 3. AUTO-EXPANSION
 *    - Selected items and their parents are automatically expanded
 *    - Ensures selected items are always visible
 * 
 * 4. ALL MULTISELECT API FEATURES
 *    - Inherits all functionality from base MultiSelectApi
 *    - Persistent label storage
 *    - Infinite scroll pagination
 *    - Debounced search
 *    - Single/multi-select modes
 * 
 * ============================================================================
 * USAGE EXAMPLES
 * ============================================================================
 * 
 * // Groups (parent field)
 * <MultiSelectApiHierarchy
 *   fetchOptions={getGroups}
 *   fetchArgs={[orgId]}
 *   optionsKey="groups"
 *   parentKey="parent"
 *   customValueKey={(item) => item.id}
 *   customLabelKey={(item) => item.name}
 *   value={selectedGroupIds}
 *   onChangeValue={setSelectedGroupIds}
 * />
 * 
 * // Order Types (parent_type field)
 * <MultiSelectApiHierarchy
 *   fetchOptions={getOrderTypes}
 *   fetchArgs={[orgId]}
 *   optionsKey="order_types"
 *   parentKey="parent_type"
 *   customValueKey={(item) => item.id}
 *   customLabelKey={(item) => item.name}
 *   value={selectedTypeIds}
 *   onChangeValue={setSelectedTypeIds}
 * />
 * 
 * // Inventory (custom accessor)
 * <MultiSelectApiHierarchy
 *   fetchOptions={getInventory}
 *   fetchArgs={[clientId, orgId]}
 *   optionsKey="inventory"
 *   parentKey={(item) => item.parent?.id}
 *   customValueKey={(item) => item.id}
 *   customLabelKey={(item) => item.name}
 *   value={selectedInventoryIds}
 *   onChangeValue={setSelectedInventoryIds}
 * />
 */
