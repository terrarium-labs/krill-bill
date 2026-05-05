import { ChecklistFieldTemplate } from '@/types/general/checklist-field';

const BASE_FIELD_TYPES: ChecklistFieldTemplate[] = [
    // Input Fields
    {
        type: 'text-input',
        label: 'Text Input',
        icon: 'Type',
        category: 'input',
        description: 'A single-line text field for short text entries.',
        defaultConfig: {
            label: 'Text Field',
            placeholder: 'Enter text...',
        },
    },
    {
        type: 'textarea',
        label: 'Text Area',
        icon: 'AlignLeft',
        category: 'input',
        description: 'A multi-line text input for longer text.',
        defaultConfig: {
            label: 'Text Area',
            placeholder: 'Enter description...',
            rows: 4,
        },
    },
    {
        type: 'number',
        label: 'Number',
        icon: 'Hash',
        category: 'input',
        description: 'A numeric input field for entering numbers.',
        defaultConfig: {
            label: 'Number Field',
            placeholder: '0',
        },
    },
    {
        type: 'email',
        label: 'Email',
        icon: 'Mail',
        category: 'input',
        description: 'An email input field with validation.',
        defaultConfig: {
            label: 'Email Address',
            placeholder: 'email@example.com',
        },
    },
    {
        type: 'phone',
        label: 'Phone',
        icon: 'Phone',
        category: 'input',
        description: 'A phone number input field with formatting.',
        defaultConfig: {
            label: 'Phone Number',
            placeholder: '+1 (555) 000-0000',
        },
    },
    {
        type: 'url',
        label: 'URL',
        icon: 'Link',
        category: 'input',
        description: 'A URL input field for website addresses.',
        defaultConfig: {
            label: 'Website URL',
            placeholder: 'https://example.com',
        },
    },
    {
        type: 'date',
        label: 'Date',
        icon: 'Calendar',
        category: 'input',
        description: 'A date picker for selecting dates.',
        defaultConfig: {
            label: 'Date',
            placeholder: 'Select date',
        },
    },
    {
        type: 'time',
        label: 'Time',
        icon: 'Clock',
        category: 'input',
        description: 'A time picker for selecting time.',
        defaultConfig: {
            label: 'Time',
            placeholder: 'Select time',
        },
    },
    {
        type: 'datetime',
        label: 'Date & Time',
        icon: 'CalendarClock',
        category: 'input',
        description: 'A combined date and time picker.',
        defaultConfig: {
            label: 'Date & Time',
            placeholder: 'Select date and time',
        },
    },

    // Selection Fields
    {
        type: 'select',
        label: 'Dropdown',
        icon: 'ChevronDown',
        category: 'selection',
        description: 'A dropdown menu for selecting a single option.',
        defaultConfig: {
            label: 'Select Option',
            placeholder: 'Choose an option',
            options: [
                { label: 'Option 1', value: 'option1' },
                { label: 'Option 2', value: 'option2' },
                { label: 'Option 3', value: 'option3' },
            ],
        },
    },
    {
        type: 'multiselect',
        label: 'Multi-Select',
        icon: 'ListChecks',
        category: 'selection',
        description: 'A dropdown menu for selecting multiple options.',
        defaultConfig: {
            label: 'Multi-Select',
            placeholder: 'Choose options',
            multiple: true,
            options: [
                { label: 'Option 1', value: 'option1' },
                { label: 'Option 2', value: 'option2' },
                { label: 'Option 3', value: 'option3' },
            ],
        },
    },
    {
        type: 'radio',
        label: 'Radio Group',
        icon: 'CircleDot',
        category: 'selection',
        description: 'A group of radio buttons for selecting one option.',
        defaultConfig: {
            label: 'Radio Group',
            options: [
                { label: 'Option 1', value: 'option1' },
                { label: 'Option 2', value: 'option2' },
            ],
        },
    },
    {
        type: 'checkbox',
        label: 'Checkbox',
        icon: 'SquareCheck',
        category: 'selection',
        description: 'A single checkbox for yes/no options.',
        defaultConfig: {
            label: 'Checkbox',
            defaultValue: false,
        },
    },
    {
        type: 'switch',
        label: 'Toggle Switch',
        icon: 'ToggleRight',
        category: 'selection',
        description: 'A toggle switch for on/off states.',
        defaultConfig: {
            label: 'Toggle Option',
            defaultValue: false,
        },
    },

    // Special Fields
    {
        type: 'file',
        label: 'File Upload',
        icon: 'Upload',
        category: 'special',
        description: 'A file upload field for attaching documents.',
        defaultConfig: {
            label: 'File Upload',
            placeholder: 'Choose file',
            accept: '*',
            multiple: false,
        },
    },
    {
        type: 'slider',
        label: 'Slider',
        icon: 'SlidersHorizontal',
        category: 'special',
        description: 'A slider for selecting values within a range.',
        defaultConfig: {
            label: 'Slider',
            min: 0,
            max: 100,
            step: 1,
            defaultValue: 50,
        },
    },
    {
        type: 'rating',
        label: 'Rating',
        icon: 'Star',
        category: 'special',
        description: 'A star rating field for collecting feedback.',
        defaultConfig: {
            label: 'Rating',
            max: 5,
            defaultValue: 0,
        },
    },
    {
        type: 'signature',
        label: 'Signature',
        icon: 'PenTool',
        category: 'special',
        description: 'A signature pad for capturing digital signatures.',
        defaultConfig: {
            label: 'Signature',
            placeholder: 'Sign here',
        },
    },
    {
        type: 'section-header',
        label: 'Section Header',
        icon: 'Heading',
        category: 'layout',
        description: 'A styled header to organize form sections.',
        defaultConfig: {
            label: 'Section Title',
            description: 'Add a description for this section',
        },
    },
    {
        type: 'heading',
        label: 'Heading',
        icon: 'Heading1',
        category: 'layout',
        description: 'A simple heading for content structure.',
        defaultConfig: {
            label: 'Heading Text',
        },
    },
    {
        type: 'separator',
        label: 'Separator',
        icon: 'Minus',
        category: 'layout',
        description: 'A horizontal line to separate content.',
        defaultConfig: {
            label: 'Separator',
        },
    },
    {
        type: 'text',
        label: 'Text',
        icon: 'AlignLeft',
        category: 'layout',
        description: 'Static text for instructions or information.',
        defaultConfig: {
            label: 'Add text or instructions',
        },
    },
];

export const getFieldTypes = (t: (key: string, fallback: string) => string): ChecklistFieldTemplate[] => {
    return BASE_FIELD_TYPES.map(fieldType => ({
        ...fieldType,
        label: t(`checklists.fieldTypes.${fieldType.type}.label`, fieldType.label),
        description: t(`checklists.fieldTypes.${fieldType.type}.description`, fieldType.description || ''),
        defaultConfig: {
            ...fieldType.defaultConfig,
            label: t(`checklists.fieldTypes.${fieldType.type}.defaultLabel`, fieldType.defaultConfig.label || ''),
            placeholder: fieldType.defaultConfig.placeholder 
                ? t(`checklists.fieldTypes.${fieldType.type}.placeholder`, fieldType.defaultConfig.placeholder)
                : undefined,
        }
    }));
};

// Export non-translated version for backward compatibility
export const FIELD_TYPES = BASE_FIELD_TYPES;

export const getCategoryLabel = (category: string, t: (key: string, fallback: string) => string) => {
    switch (category) {
        case 'input':
            return t('checklists.categories.input', 'Input Fields');
        case 'selection':
            return t('checklists.categories.selection', 'Selection Fields');
        case 'special':
            return t('checklists.categories.special', 'Special Fields');
        case 'layout':
            return t('checklists.categories.layout', 'Layout & Content');
        default:
            return category;
    }
};

