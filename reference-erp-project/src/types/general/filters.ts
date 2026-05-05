export interface TableFilters {
    global_operator: "AND" | "OR" | null;
    keys: (FilterString | FilterNumber | FilterBoolean | FilterArray | FilterDate | FilterCountry | FilterDateTime)[];
    filters: (FilterString | FilterNumber | FilterBoolean | FilterArray | FilterDate | FilterCountry | FilterDateTime)[] | null;
    order_by: OrderBy[] | null;
}

export interface Filter {
    key: string;
    // if the field is a dropdown api, the endpoint is the endpoint to get the options of the dropdown
    endpoint: {
        type: "hierarchy" | "list";
        key: string;
        path: string;
    } | null;
    // if the field is a dropdown, the options are the values of the dropdown
    options: string[] | null;
    value: (string | number | boolean | null)[];
    is_sortable: boolean;
}

export interface FilterString extends Filter {
    type: "string";
    operator: "contains" | "notContains" | "eq" | "ne" | "isEmpty" | "isNotEmpty" | null;
}

export interface FilterNumber extends Filter {
    type: "number";
    operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "isBetween" | "isEmpty" | "isNotEmpty" | null;
}

export interface FilterBoolean extends Filter {
    type: "boolean";
    operator: "eq" | "ne" | "isEmpty" | "isNotEmpty" | null;
}

export interface FilterCountry extends Filter {
    type: "country";
    operator: "inArray" | "notInArray" | "isEmpty" | "isNotEmpty" | null;
}

export interface FilterDate extends Filter {
    type: "date";
    operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "isBetween" | "isEmpty" | "isNotEmpty" | null;
}

export interface FilterDateTime extends Filter {
    type: "datetime";
    operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "isBetween" | "isEmpty" | "isNotEmpty" | null;
}

export interface FilterArray extends Filter {
    type: "array";
    operator: "inArray" | "notInArray" | "isEmpty" | "isNotEmpty" | null;
}

export interface OrderBy {
    key: string;
    direction: "ASC" | "DESC";
}