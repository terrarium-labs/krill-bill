import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import * as z from 'zod';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { MultiSelect } from '@/app/components/forms-elements/multi-select';
import { DateTimePicker } from '@/app/components/forms-elements/date-time-picker';
interface CustomField {
    id: string;
    table_name: string;
    data_type: string;
    enum_types?: string[] | null;
    default_value?: string | null;
    name: string;
    description?: string;
    is_nullable: boolean;
    is_unique: boolean;
    is_multiple_values: boolean;
    is_shown_by_default: boolean;
    value?: string | null;
}

interface CustomFieldsSectionProps {
    fields: CustomField[];
    form: UseFormReturn<any>;
    disabled?: boolean;
    className?: string;
}

// Helper function to create Zod schema for custom fields
export const createCustomFieldsSchema = (fields: CustomField[]) => {
    const schemaFields: Record<string, z.ZodTypeAny> = {};

    fields.forEach((field) => {
        if (!field.is_shown_by_default) return;

        const isRequired = !field.is_nullable;
        let fieldSchema: z.ZodTypeAny;

        switch (field.data_type) {
            case 'boolean':
                fieldSchema = z.boolean();
                break;
            case 'integer':
                fieldSchema = z.number().int(`${field.name} must be a valid integer`);
                break;
            case 'float':
                fieldSchema = z.number(`${field.name} must be a valid number`);
                break;
            case 'date':
            case 'datetime':
                fieldSchema = z.string().or(z.date());
                break;
            case 'text':
                if (field.enum_types && field.enum_types.length > 0) {
                    if (field.is_multiple_values) {
                        fieldSchema = z.array(z.enum(field.enum_types as [string, ...string[]]));
                    } else {
                        fieldSchema = z.enum(field.enum_types as [string, ...string[]]);
                    }
                } else {
                    fieldSchema = z.string();
                }
                break;
            default:
                fieldSchema = z.string();
        }

        if (!isRequired) {
            fieldSchema = fieldSchema.optional();
        }

        schemaFields[field.id] = fieldSchema;
    });

    return z.object(schemaFields).optional();
};

const CustomFieldsSection: React.FC<CustomFieldsSectionProps> = ({
    fields,
    form,
    disabled = false,
    className,
}) => {
    // const { t } = useTranslation(); // Available for future translations

    if (!fields || fields.length === 0) {
        return null;
    }

    const renderCustomField = (field: CustomField) => {
        const fieldName = `custom_fields.${field.id}`;

        // Only render fields that should be shown by default
        if (!field.is_shown_by_default) {
            return null;
        }

        const isRequired = !field.is_nullable;

        switch (field.data_type) {
            case 'boolean':
                return (
                    <FormField
                        key={field.id}
                        control={form.control}
                        name={fieldName}
                        render={({ field: formField }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 my-4">
                                <div className="space-y-0.5">
                                    <FormLabel>
                                        {field.name}
                                        {isRequired && <span>*</span>}
                                    </FormLabel>

                                </div>
                                <FormControl>
                                    <Switch
                                        checked={formField.value ?? false}
                                        onCheckedChange={formField.onChange}
                                        disabled={disabled}
                                    />
                                </FormControl>
                                {field.description && (
                                    <FormDescription className="text-sm">
                                        {field.description}
                                    </FormDescription>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                );

            case 'integer':
                return (
                    <FormField
                        key={field.id}
                        control={form.control}
                        name={fieldName}
                        render={({ field: formField }) => (
                            <FormItem>
                                <FormLabel>
                                    {field.name}
                                    {isRequired && <span>*</span>}
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="1"
                                        placeholder={`Enter ${field.name.toLowerCase()}`}
                                        {...formField}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            const numValue = value === '' ? undefined : parseInt(value);
                                            if (value !== '' && (isNaN(numValue as number) || !Number.isInteger(numValue))) {
                                                // Invalid integer input - set error state
                                                formField.onChange(value);
                                            } else {
                                                formField.onChange(numValue);
                                            }
                                        }}
                                        value={formField.value ?? ''}
                                        disabled={disabled}
                                    />
                                </FormControl>
                                {field.description && (
                                    <FormDescription>
                                        {field.description}
                                    </FormDescription>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                );

            case 'float':
                return (
                    <FormField
                        key={field.id}
                        control={form.control}
                        name={fieldName}
                        render={({ field: formField }) => (
                            <FormItem>
                                <FormLabel>
                                    {field.name}
                                    {isRequired && <span>*</span>}
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder={`Enter ${field.name.toLowerCase()}`}
                                        {...formField}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            const numValue = value === '' ? undefined : parseFloat(value);
                                            if (value !== '' && isNaN(numValue as number)) {
                                                // Invalid float input - set error state
                                                formField.onChange(value);
                                            } else {
                                                formField.onChange(numValue);
                                            }
                                        }}
                                        value={formField.value ?? ''}
                                        disabled={disabled}
                                    />
                                </FormControl>
                                {field.description && (
                                    <FormDescription>
                                        {field.description}
                                    </FormDescription>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                );

            case 'date':
                return (
                    <DateTimePicker
                        key={field.id}
                        form={form}
                        name={fieldName}
                        showMonthYearPicker={true}
                        label={field.name + (isRequired ? ' *' : '')}
                        placeholder={`Select ${field.name.toLowerCase()}`}
                        disabled={disabled}
                        showTime={false}
                        description={field.description}
                    />
                );

            case 'datetime':
                return (
                    <DateTimePicker
                        key={field.id}
                        form={form}
                        name={fieldName}
                        showMonthYearPicker={true}
                        label={field.name + (isRequired ? ' *' : '')}
                        placeholder={`Select ${field.name.toLowerCase()}`}
                        disabled={disabled}
                        showTime={true}
                        description={field.description}
                    />
                );

            case 'text':
                // Handle multi-select enum fields
                if (field.enum_types && field.enum_types.length > 0) {
                    if (field.is_multiple_values) {
                        return (
                            <FormField
                                key={field.id}
                                control={form.control}
                                name={fieldName}
                                render={({ field: formField }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {field.name}
                                            {isRequired && <span>*</span>}
                                        </FormLabel>
                                        <FormControl>
                                            <MultiSelect
                                                options={field.enum_types?.map((option) => ({
                                                    value: option,
                                                    label: option
                                                })) || []}
                                                selected={formField.value || []}
                                                onSelectedChange={formField.onChange}
                                                placeholder={`Select ${field.name.toLowerCase()}`}
                                                disabled={disabled}
                                                className="w-full"
                                                searchable={false}
                                            />
                                        </FormControl>
                                        {field.description && (
                                            <FormDescription>
                                                {field.description}
                                            </FormDescription>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        );
                    } else {
                        // Single select enum
                        return (
                            <FormField
                                key={field.id}
                                control={form.control}
                                name={fieldName}
                                render={({ field: formField }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {field.name}
                                            {isRequired && <span>*</span>}
                                        </FormLabel>
                                        <FormControl>
                                            <Select
                                                onValueChange={formField.onChange}
                                                value={formField.value || ''}
                                                disabled={disabled}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {field.enum_types?.map((option) => (
                                                        <SelectItem key={option} value={option}>
                                                            {option}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        {field.description && (
                                            <FormDescription>
                                                {field.description}
                                            </FormDescription>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        );
                    }
                }

                // Regular text field - use textarea if description is long
                const isLongText = field.description && field.description.length > 100;

                return (
                    <FormField
                        key={field.id}
                        control={form.control}
                        name={fieldName}
                        render={({ field: formField }) => (
                            <FormItem>
                                <FormLabel>
                                    {field.name}
                                    {isRequired && <span>*</span>}
                                </FormLabel>
                                <FormControl>
                                    {isLongText ? (
                                        <Textarea
                                            placeholder={`Enter ${field.name.toLowerCase()}`}
                                            {...formField}
                                            value={formField.value || ''}
                                            disabled={disabled}
                                            rows={3}
                                        />
                                    ) : (
                                        <Input
                                            type="text"
                                            placeholder={`Enter ${field.name.toLowerCase()}`}
                                            {...formField}
                                            value={formField.value || ''}
                                            disabled={disabled}
                                        />
                                    )}
                                </FormControl>
                                {field.description && (
                                    <FormDescription>
                                        {field.description}
                                    </FormDescription>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                );

            default:
                // Fallback to text input
                return (
                    <FormField
                        key={field.id}
                        control={form.control}
                        name={fieldName}
                        render={({ field: formField }) => (
                            <FormItem>
                                <FormLabel>
                                    {field.name}
                                    {isRequired && <span>*</span>}
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        placeholder={`Enter ${field.name.toLowerCase()}`}
                                        {...formField}
                                        value={formField.value || ''}
                                        disabled={disabled}
                                    />
                                </FormControl>
                                {field.description && (
                                    <FormDescription>
                                        {field.description}
                                    </FormDescription>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                );
        }
    };

    return (
        <div className={className}>
            {fields.map(renderCustomField)}
        </div>
    );
};

export default CustomFieldsSection;
