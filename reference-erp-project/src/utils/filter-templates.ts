import { TableFilters, FilterArray } from "@/types/general/filters";

/**
 * Employee filter key definition for manager pages (absences, time records).
 * Used when merging employeeId from URL into table filters.
 */
export const EMPLOYEE_FILTER_KEY: FilterArray = {
  key: "employee",
  type: "array",
  options: [],
  endpoint: { type: "list", key: "employees", path: "/orgs/{{org_id}}/managers/{{manager_id}}/employees" },
  is_sortable: false,
  operator: "inArray",
  value: [],
};

/**
 * Merges employeeId into table filters. Adds or updates the employee filter and ensures
 * the employee key exists in keys so the TableFiltersRow can display and edit it.
 * @param filters - Current table filters (can be null)
 * @param employeeId - Employee ID to filter by (from URL or prop)
 * @returns Merged TableFilters, or original filters if employeeId is null/empty
 */
export function mergeEmployeeFilterIntoTableFilters(
  filters: TableFilters | null,
  employeeId: string | null
): TableFilters | null {
  if (!employeeId) return filters;

  const base: TableFilters = filters ?? {
    global_operator: "AND",
    filters: [],
    order_by: null,
    keys: [],
  };

  const filtersList = [...(base.filters ?? [])];
  const existingIdx = filtersList.findIndex((f: { key: string }) => f.key === "employee");
  const employeeFilter: FilterArray = {
    ...EMPLOYEE_FILTER_KEY,
    value: [employeeId],
  };
  if (existingIdx >= 0) {
    filtersList[existingIdx] = employeeFilter;
  } else {
    filtersList.push(employeeFilter);
  }

  const keysList = [...(base.keys ?? [])];
  const hasEmployeeKey = keysList.some((k: { key: string }) => k.key === "employee");
  if (!hasEmployeeKey) {
    keysList.push(EMPLOYEE_FILTER_KEY);
  }

  return {
    ...base,
    filters: filtersList,
    keys: keysList,
  };
}

/**
 * Default filter configurations for different pages
 * These are centralized here to ensure consistency across the application
 */

export const FILTERS_TEMPLATES: Record<string, TableFilters> = {
  employees: {
    global_operator: "AND",
    filters: [
      {
        key: "status",
        type: "array",
        options: ["active", "inactive", "holiday", "sick_leave"],
        endpoint: null,
        is_sortable: false,
        operator: "notInArray",
        value: ["inactive"],
      },
    ],
    order_by: null,
    keys: [
      {
        key: "status",
        type: "array",
        options: ["active", "inactive", "holiday", "sick_leave"],
        endpoint: null,
        is_sortable: false,
        operator: "notInArray",
        value: ["inactive"],
      },
    ],
  },
  groups: {
    global_operator: "AND",
    filters: null,
    order_by: null,
    keys: [
      {
        key: "type",
        type: "array",
        options: ["area", "department", "section"],
        endpoint: null,
        is_sortable: true,
        operator: "inArray",
        value: [],
      },
    ],
  },
  tickets: {
    global_operator: "AND",
    filters: [
      {
        key: "status",
        type: "array",
        options: ["in_progress", "closed"],
        endpoint: null,
        is_sortable: false,
        operator: "inArray",
        value: ["in_progress"],
      },
    ],
    order_by: null,
    keys: [
      {
        key: "status",
        type: "array",
        options: ["in_progress", "closed"],
        endpoint: null,
        is_sortable: false,
        operator: "inArray",
        value: ["in_progress"],
      },
    ],
  },
  /** Training enrollment list (detail tab); filters apply client-side after fetch. */
  training_enrollments: {
    global_operator: "AND",
    filters: null,
    order_by: null,
    keys: [
      {
        key: "status",
        type: "array",
        options: ["enrolled", "in_progress", "completed", "failed", "withdrew"],
        endpoint: null,
        is_sortable: true,
        operator: "inArray",
        value: [],
      },
      {
        key: "attendance_confirmed",
        type: "boolean",
        options: null,
        endpoint: null,
        is_sortable: true,
        operator: "eq",
        value: [],
      },
      {
        key: "enrolled_at",
        type: "date",
        options: null,
        endpoint: null,
        is_sortable: true,
        operator: "gte",
        value: [],
      },
      {
        key: "completion_date",
        type: "date",
        options: null,
        endpoint: null,
        is_sortable: true,
        operator: "gte",
        value: [],
      },
      {
        key: "score",
        type: "number",
        options: null,
        endpoint: null,
        is_sortable: true,
        operator: "gte",
        value: [],
      },
    ],
  },
};

/**
 * Get filters template for a specific page
 * @param page - The page identifier (e.g., 'employees', 'tickets', 'absences')
 * @returns The default filters for the page, or null if no defaults exist
 */
export function getFiltersTemplate(page: string | null): TableFilters | null {
  if (!page) return null;
  return FILTERS_TEMPLATES[page] || null;
}
