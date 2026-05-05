import { useState, useEffect, useCallback } from "react";
import { TableFilters } from "@/types/general/filters";
import { getFiltersTemplate } from "@/utils/filter-templates";
import { useLocation } from "react-router-dom";

/**
 * Storage key prefix for table filters in session storage
 */
const STORAGE_KEY_PREFIX = "table_filters_";

/**
 * Get the storage key for a specific route
 */
function getStorageKey(route: string): string {
  return `${STORAGE_KEY_PREFIX}${route}`;
}

/**
 * Returns true when the value is a filters object with both "filters" and "order_by" null.
 * Such values should not be persisted and should be removed from storage if found.
 */
function isStoredFiltersEmpty(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === "object" &&
    "filters" in value &&
    "order_by" in value &&
    (value as TableFilters).filters === null &&
    (value as TableFilters).order_by === null
  );
}

/**
 * Load filters from session storage.
 * If the stored value is an object with both "filters" and "order_by" null, it is removed
 * from storage and null is returned (storage correction).
 */
function loadFiltersFromStorage(route: string): TableFilters | null {
  try {
    const stored = sessionStorage.getItem(getStorageKey(route));
    if (stored) {
      const parsed = JSON.parse(stored) as unknown;
      if (isStoredFiltersEmpty(parsed)) {
        sessionStorage.removeItem(getStorageKey(route));
        return null;
      }
      return parsed as TableFilters;
    }
  } catch (error) {
    console.error("Error loading filters from session storage:", error);
  }
  return null;
}

/**
 * Save filters to session storage.
 * If the filters object has both "filters" and "order_by" null, the key is removed
 * from storage instead of saving.
 */
function saveFiltersToStorage(route: string, filters: TableFilters | null): void {
  try {
    if (filters && !isStoredFiltersEmpty(filters)) {
      sessionStorage.setItem(getStorageKey(route), JSON.stringify(filters));
    } else {
      sessionStorage.removeItem(getStorageKey(route));
    }
  } catch (error) {
    console.error("Error saving filters to session storage:", error);
  }
}

export interface UseTableFiltersOptions {
  /**
   * The route/path to use for session storage key
   * If not provided, will use the current location pathname
   */
  route?: string;

  /**
   * Default filters to use when no saved filters exist in session storage
   * Can be a string (component identifier) or TableFilters object or null for no default filters
   */
  defaultFilters?: string | TableFilters | null;

  /**
   * If true, automatically save filters to session storage on change
   * Default: true
   */
  autoSave?: boolean;
}

export interface UseTableFiltersReturn {
  /**
   * Current table filters
   */
  tableFilters: TableFilters | null;

  /**
   * Update table filters and optionally save to session storage
   */
  setTableFilters: (filters: TableFilters | null) => void;

  /**
   * Whether filters have been initialized (prevents triggering onFilter during initial load)
   */
  hasInitializedFilters: boolean;

  /**
   * Set the initialized flag (useful when merging with API response)
   */
  setHasInitializedFilters: (initialized: boolean) => void;

  /**
   * Clear filters from session storage
   */
  clearStoredFilters: () => void;

  /**
   * Reset filters to default values
   */
  resetToDefaults: () => void;
}

/**
 * Custom hook to manage table filters with session storage persistence
 * 
 * Priority order for loading filters:
 * 1. Session storage (if available for the route)
 * 2. Default filters (if provided)
 * 3. null (no filters)
 * 
 * @example
 * ```tsx
 * // Using a string identifier to load predefined filters
 * const { tableFilters, setTableFilters, hasInitializedFilters } = useTableFilters({
 *   defaultFilters: 'employees' // Loads from default-filters.ts
 * });
 * ```
 * 
 * @example
 * ```tsx
 * // Using default filters object directly
 * const { tableFilters, setTableFilters, hasInitializedFilters } = useTableFilters({
 *   defaultFilters: {
 *     global_operator: "AND",
 *     filters: [{ key: "status", operator: "eq", value: ["active"] }],
 *     order_by: null,
 *     keys: []
 *   }
 * });
 * ```
 * 
 * @example
 * ```tsx
 * // No default filters
 * const { tableFilters, setTableFilters, hasInitializedFilters } = useTableFilters({
 *   defaultFilters: null
 * });
 * ```
 */
export function useTableFilters(options: UseTableFiltersOptions = {}): UseTableFiltersReturn {
  const location = useLocation();
  const {
    route = location.pathname,
    defaultFilters = null,
    autoSave = true
  } = options;

  // Initialize filters from session storage or defaults
  const [tableFilters, setTableFiltersState] = useState<TableFilters | null>(() => {
    // 1. Try to load from session storage first
    const storedFilters = loadFiltersFromStorage(route);
    if (storedFilters) {
      return storedFilters;
    }

    // 2. Fall back to default filters
    if (defaultFilters) {
      // If defaultFilters is a string, get filters from the utility
      if (typeof defaultFilters === "string") {
        return getFiltersTemplate(defaultFilters);
      }
      // If it's a TableFilters object, use it directly
      return defaultFilters;
    }

    // 3. No filters
    return null;
  });

  const [hasInitializedFilters, setHasInitializedFilters] = useState(false);
  const [isInitialMount, setIsInitialMount] = useState(true);

  // Mark as not initial mount after first render
  useEffect(() => {
    setIsInitialMount(false);
  }, []);

  // Update session storage when filters change (skip on initial mount to avoid overwriting on load)
  useEffect(() => {
    if (autoSave && !isInitialMount) {
      saveFiltersToStorage(route, tableFilters);
    }
  }, [tableFilters, route, autoSave, isInitialMount]);

  // Wrapper to update filters
  const setTableFilters = useCallback((filters: TableFilters | null) => {
    setTableFiltersState(filters);
  }, []);

  // Clear stored filters
  const clearStoredFilters = useCallback(() => {
    try {
      sessionStorage.removeItem(getStorageKey(route));
    } catch (error) {
      console.error("Error clearing filters from session storage:", error);
    }
  }, [route]);

  // Reset to default filters
  const resetToDefaults = useCallback(() => {
    let defaults: TableFilters | null = null;
    if (defaultFilters) {
      // If defaultFilters is a string, get filters from the utility
      if (typeof defaultFilters === "string") {
        defaults = getFiltersTemplate(defaultFilters);
      } else {
        // If it's a TableFilters object, use it directly
        defaults = defaultFilters;
      }
    }
    setTableFiltersState(defaults);
    if (autoSave) {
      saveFiltersToStorage(route, defaults);
    }
  }, [defaultFilters, route, autoSave]);

  return {
    tableFilters,
    setTableFilters,
    hasInitializedFilters,
    setHasInitializedFilters,
    clearStoredFilters,
    resetToDefaults,
  };
}
