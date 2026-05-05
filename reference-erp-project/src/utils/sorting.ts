/**
 * Category order for status sorting: not_started → active → done → closed.
 * Unknown categories sort last (999).
 */
export const STATUS_CATEGORY_ORDER: Record<string, number> = {
    not_started: 0,
    active: 1,
    done: 2,
    closed: 3,
};

/** Item with optional category and position (e.g. Status from status-templates). */
export interface SortableByCategoryAndPosition {
    category?: string | null;
    position?: number | null;
}

/**
 * Sorts an array of status-like items by category (not_started, active, done, closed)
 * then by position. Mutates and returns the same array.
 *
 * @param items - Array of items with category and position
 * @returns The same array, sorted
 */
export function sortByCategoryAndPosition<T extends SortableByCategoryAndPosition>(
    items: T[]
): T[] {
    return items.sort((a, b) => {
        const categoryA = STATUS_CATEGORY_ORDER[a.category ?? ""] ?? 999;
        const categoryB = STATUS_CATEGORY_ORDER[b.category ?? ""] ?? 999;
        if (categoryA !== categoryB) return categoryA - categoryB;
        return (a.position ?? 0) - (b.position ?? 0);
    });
}

/**
 * Returns a new array of status-like items sorted by category and position.
 * Use when you need to avoid mutating the original array.
 */
export function sortStatusesByCategoryAndPosition<T extends SortableByCategoryAndPosition>(
    items: T[]
): T[] {
    return sortByCategoryAndPosition([...items]);
}
