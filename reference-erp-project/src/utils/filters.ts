import { FilterString, FilterNumber, FilterBoolean, FilterDate, FilterArray, FilterCountry, FilterDateTime } from "@/types/general/filters";

type FilterType = FilterString | FilterNumber | FilterBoolean | FilterArray | FilterDate | FilterCountry | FilterDateTime;

// Map of filter operators for each type
type StringOperators = FilterString['operator'];
type NumberOperators = FilterNumber['operator'];
type BooleanOperators = FilterBoolean['operator'];
type DateOperators = FilterDate['operator'];
type DateTimeOperators = FilterDateTime['operator'];
type ArrayOperators = FilterArray['operator'];
type CountryOperators = FilterCountry['operator'];

// Type-safe operator mapping
type OperatorsForFilterType<T extends FilterType['type']> =
    T extends 'string' ? StringOperators :
    T extends 'number' ? NumberOperators :
    T extends 'boolean' ? BooleanOperators :
    T extends 'date' ? DateOperators :
    T extends 'datetime' ? DateTimeOperators :
    T extends 'array' ? ArrayOperators :
    T extends 'country' ? CountryOperators :
    never;

/**
 * Get the list of valid operators for a given filter type
 */
export function getOperatorsForType<T extends FilterType['type']>(type: T): OperatorsForFilterType<T>[] {
    switch (type) {
        case "string":
            return ["contains", "notContains", "eq", "ne", "isEmpty", "isNotEmpty"] as OperatorsForFilterType<T>[];
        case "number":
            return ["eq", "ne", "gt", "gte", "lt", "lte", "isBetween", "isEmpty", "isNotEmpty"] as OperatorsForFilterType<T>[];
        case "boolean":
            return ["eq", "ne", "isEmpty", "isNotEmpty"] as OperatorsForFilterType<T>[];
        case "date":
            return ["eq", "ne", "gt", "gte", "lt", "lte", "isBetween", "isEmpty", "isNotEmpty"] as OperatorsForFilterType<T>[];
        case "datetime":
            return ["eq", "ne", "gt", "gte", "lt", "lte", "isBetween", "isEmpty", "isNotEmpty"] as OperatorsForFilterType<T>[];
        case "array":
            return ["inArray", "notInArray", "isEmpty", "isNotEmpty"] as OperatorsForFilterType<T>[];
        case "country":
            return ["inArray", "notInArray", "isEmpty", "isNotEmpty"] as OperatorsForFilterType<T>[];
        default:
            return [] as OperatorsForFilterType<T>[];
    }
}

/**
 * Get the human-readable name for an operator
 * @param operator - The operator to get the name for
 * @param type - The filter type (optional, for context-specific naming)
 * @returns The translation key for the operator
 */
export function getOperatorName(
    operator: string,
    type?: FilterType['type']
): { key: string; fallback: string } {
    const operatorNames: Record<string, { key: string; fallback: string }> = {
        // String operators
        contains: { key: "filters.contains", fallback: "Contains" },
        notContains: { key: "filters.notContains", fallback: "Not Contains" },

        // Equality operators
        eq: { key: "filters.equals", fallback: "Equals" },
        ne: { key: "filters.notEquals", fallback: "Not Equals" },

        // Comparison operators (context-aware for dates)
        gt: type === 'date' || type === 'datetime'
            ? { key: "filters.after", fallback: "After" }
            : { key: "filters.greaterThan", fallback: "Greater Than" },
        gte: type === 'date' || type === 'datetime'
            ? { key: "filters.afterOrEqual", fallback: "After or Equal" }
            : { key: "filters.greaterThanOrEqual", fallback: "Greater Than or Equal" },
        lt: type === 'date' || type === 'datetime'
            ? { key: "filters.before", fallback: "Before" }
            : { key: "filters.lessThan", fallback: "Less Than" },
        lte: type === 'date' || type === 'datetime'
            ? { key: "filters.beforeOrEqual", fallback: "Before or Equal" }
            : { key: "filters.lessThanOrEqual", fallback: "Less Than or Equal" },

        // Range operators
        isBetween: { key: "filters.isBetween", fallback: "Is Between" },

        // Array operators
        inArray: { key: "filters.inArray", fallback: "In Array" },
        notInArray: { key: "filters.notInArray", fallback: "Not In Array" },

        // Empty/null checks
        isEmpty: { key: "filters.isEmpty", fallback: "Is Empty" },
        isNotEmpty: { key: "filters.isNotEmpty", fallback: "Is Not Empty" },

        // Logical operators
        and: { key: "filters.and", fallback: "AND" },
        or: { key: "filters.or", fallback: "OR" },
        not: { key: "filters.not", fallback: "NOT" },

        // String pattern matching
        ilike: { key: "filters.like", fallback: "Like" },
        notIlike: { key: "filters.notLike", fallback: "Not Like" },
    };

    return operatorNames[operator] || { key: "filters.unknown", fallback: operator };
}

/**
 * Check if an operator requires a value input
 */
export function operatorRequiresValue(operator: string): boolean {
    const noValueOperators = ["isEmpty", "isNotEmpty"];
    return !noValueOperators.includes(operator);
}

/**
 * Check if a filter is valid (has all required fields)
 */
export function isFilterValid(filter: Partial<FilterType>): boolean {
    if (!filter.key || !filter.operator) {
        return false;
    }

    // If operator requires a value, check if value is present
    if (operatorRequiresValue(filter.operator)) {
        return filter.value !== null && filter.value !== undefined && Array.isArray(filter.value) && filter.value.length > 0;
    }

    return true;
}

/**
 * Check if a filter row has all required fields set and is ready to be applied
 * @param row - The filter row data with selectedKey, selectedOperator, and value
 * @returns True if the filter is complete and can be applied
 */
export function isFilterComplete(row: {
    selectedKey: string | null;
    selectedOperator: string | null;
    value?: any;
}): boolean {
    // Must have key and operator
    if (!row.selectedKey || !row.selectedOperator) {
        return false;
    }

    // Operators that don't require a value (isEmpty, isNotEmpty)
    if (!operatorRequiresValue(row.selectedOperator)) {
        return true;
    }

    // Check if value is set and not empty
    // Handle arrays (e.g., from MultiSelect)
    if (Array.isArray(row.value)) {
        return row.value.length > 0;
    }

    // Handle other value types
    return row.value !== null && row.value !== undefined && row.value !== "";
}
