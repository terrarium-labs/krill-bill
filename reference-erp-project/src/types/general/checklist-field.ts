export type FieldType =
    | 'text-input'
    | 'textarea'
    | 'number'
    | 'email'
    | 'password'
    | 'phone'
    | 'url'
    | 'date'
    | 'time'
    | 'datetime'
    | 'file'
    | 'select'
    | 'multiselect'
    | 'checkbox'
    | 'radio'
    | 'switch'
    | 'slider'
    | 'rating'
    | 'signature'
    | 'section-header'
    | 'heading'
    | 'separator'
    | 'text';

export interface SelectOption {
    label: string;
    value: string;
}

export interface ConditionalLogic {
    enabled: boolean;
    action?: 'show' | 'hide';
    conditions: {
        fieldId: string;
        operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
        value: string | number | boolean;
        logic?: 'AND' | 'OR';
    }[];
}

export interface ValidationRule {
    type: 'required' | 'min' | 'max' | 'pattern' | 'email' | 'url' | 'phone';
    value?: string | number;
    message?: string;
}

export interface ChecklistField {
    id: string;
    type: FieldType;
    label: string;
    description?: string;
    placeholder?: string;
    defaultValue?: string | number | boolean | string[];
    required?: boolean;
    options?: SelectOption[]; // For select, multiselect, radio
    validation?: ValidationRule[];
    conditionalLogic?: ConditionalLogic;

    // Field-specific properties
    min?: number; // For number, slider, rating
    max?: number; // For number, slider, rating
    step?: number; // For number, slider
    rows?: number; // For textarea
    accept?: string; // For file upload
    multiple?: boolean; // For file upload, select

    // Layout
    rowId?: string; // Fields with same rowId are in the same row
    width?: 'full' | 'half'; // Full width (1 column) or half width (2 columns)
    order?: number;
}

export interface ChecklistFieldTemplate {
    type: FieldType;
    label: string;
    icon: string;
    category: 'input' | 'selection' | 'special' | 'layout';
    description?: string;
    defaultConfig: Partial<ChecklistField>;
}

