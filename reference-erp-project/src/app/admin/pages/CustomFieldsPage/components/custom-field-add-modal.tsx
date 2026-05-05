import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';

import { useTranslation } from '@/hooks/useTranslation';
import { postOrgField, patchOrgField } from '@/api/orgs/fields/fields';

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';
import { DateTimePicker } from '@/app/components/forms-elements/date-time-picker';
import IdBadge from '@/app/components/id-badge';

interface Field {
    id: string;
    table_name: string;
    data_type: string;
    enum_types?: string[];
    default_value?: string;
    name: string;
    description?: string;
    is_nullable: boolean;
    is_unique: boolean;
    is_multiple_values: boolean;
    is_shown_by_default: boolean;
}

interface CustomFieldAddModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onFieldCreated?: () => void;
    field?: Field | null;
    orgId: string;
    sectionId: string;
    table_name: string;
}

const dataTypeOptions = [
    { value: 'text', label: 'Text' },
    { value: 'integer', label: 'Integer' },
    { value: 'float', label: 'Float' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'date', label: 'Date' },
    { value: 'datetime', label: 'DateTime' },
    { value: 'multiple_choice', label: 'Multiple Choice' },
];

const formSchema = z.object({
    name: z
        .string()
        .min(1, 'Field name is required')
        .min(2, 'Field name must be at least 2 characters')
        .max(64, 'Field name must be less than 64 characters')
        .trim(),
    description: z
        .string()
        .max(255, 'Description must be less than 255 characters')
        .optional(),
    data_type: z.enum(['text', 'integer', 'float', 'boolean', 'date', 'datetime', 'multiple_choice'], {
        error: 'Data type is required',
    }),
    default_value: z.union([z.string(), z.number(), z.boolean(), z.date()]).optional(),
    enum_types: z.array(z.string()).optional(),
    is_required: z.boolean(),
    is_unique: z.boolean(),
    is_multiple_values: z.boolean(),
    is_shown_by_default: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const CustomFieldAddModal: React.FC<CustomFieldAddModalProps> = ({
    open,
    onOpenChange,
    onFieldCreated,
    field,
    orgId,
    sectionId,
    table_name,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [enumValues, setEnumValues] = useState<string[]>([]);
    const [originalEnumValues, setOriginalEnumValues] = useState<string[]>([]);
    const [newEnumValue, setNewEnumValue] = useState('');
    const { t } = useTranslation();

    // Determine if this is edit mode
    const isEditMode = !!field;

    const getDefaultValues = (field?: Field | null): FormValues => {
        if (!field) {
            return {
                name: '',
                description: '',
                data_type: 'text',
                default_value: undefined,
                enum_types: [],
                is_required: false,
                is_unique: false,
                is_multiple_values: false,
                is_shown_by_default: true,
            };
        }

        // Determine the correct data type for the form
        let formDataType: 'text' | 'integer' | 'float' | 'boolean' | 'date' | 'datetime' | 'multiple_choice' = 'text';
        if (field.enum_types && field.enum_types.length > 0) {
            formDataType = 'multiple_choice';
        } else {
            // Ensure the data type matches our enum
            switch (field.data_type) {
                case 'text':
                case 'integer':
                case 'float':
                case 'boolean':
                case 'date':
                case 'datetime':
                    formDataType = field.data_type;
                    break;
                default:
                    formDataType = 'text';
            }
        }

        return {
            name: field.name || '',
            description: field.description || '',
            data_type: formDataType,
            //!!TODO: Check if this is correct parse to type date or datetime or whatever is needed
            default_value: field.default_value || undefined,
            enum_types: field.enum_types || [],
            is_required: !field.is_nullable,
            is_unique: field.is_unique,
            is_multiple_values: field.is_multiple_values,
            is_shown_by_default: field.is_shown_by_default,
        };
    };

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: getDefaultValues(field),
    });

    const watchDataType = form.watch('data_type');
    const isSelectType = enumValues.length > 0;

    // Reset enum values when data type changes
    useEffect(() => {
        if (watchDataType !== 'multiple_choice') {
            setEnumValues([]);
            form.setValue('enum_types', []);
        }
        // Reset default value when data type changes (only in create mode)
        if (!isEditMode) {
            form.setValue('default_value', undefined);
        }
    }, [watchDataType, form, isEditMode]);

    // Initialize enum values when field prop changes (for edit mode)
    useEffect(() => {
        if (field && field.enum_types) {
            setEnumValues(field.enum_types);
            setOriginalEnumValues(field.enum_types);
        } else {
            setEnumValues([]);
            setOriginalEnumValues([]);
        }
    }, [field]);

    // Function to convert default value to string for API
    const convertDefaultValueToString = (value: any, dataType: string): string | null => {
        if (value === undefined || value === null) return null;

        switch (dataType) {
            case 'boolean':
                return value.toString();
            case 'integer':
            case 'float':
                return value.toString();
            case 'date':
                return value instanceof Date ? value.toISOString().split('T')[0] : '';
            case 'datetime':
                return value instanceof Date ? value.toISOString() : '';
            case 'text':
            case 'multiple_choice':
                if (value.toString().trim() === '__no_default__') {
                    return null;
                }
                return value.toString();
            default:
                return value.toString();
        }
    };

    // Function to render the appropriate default value input
    const renderDefaultValueInput = () => {
        switch (watchDataType) {
            case 'boolean':
                return (
                    <FormField
                        control={form.control}
                        name="default_value"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                    <FormLabel>
                                        {t('admin.customFields.field.defaultValue', 'Default Value')}
                                    </FormLabel>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value === true}
                                        onCheckedChange={(checked) => field.onChange(checked)}
                                        disabled={isLoading}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                );

            case 'integer':
                return (
                    <FormField
                        control={form.control}
                        name="default_value"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {t('admin.customFields.field.defaultValue', 'Default Value')}
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="1"
                                        placeholder={t('admin.customFields.field.defaultValuePlaceholder', 'Default value for this field')}
                                        value={field.value !== undefined ? field.value.toString() : ''}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            field.onChange(value === '' ? undefined : parseInt(value, 10));
                                        }}
                                        disabled={isLoading}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                );

            case 'float':
                return (
                    <FormField
                        control={form.control}
                        name="default_value"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {t('admin.customFields.field.defaultValue', 'Default Value')}
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder={t('admin.customFields.field.defaultValuePlaceholder', 'Default value for this field')}
                                        value={field.value !== undefined ? field.value.toString() : ''}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            field.onChange(value === '' ? undefined : parseFloat(value));
                                        }}
                                        disabled={isLoading}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                );

            case 'date':
                return (
                    <DateTimePicker
                        form={form}
                        name="default_value"
                        showMonthYearPicker={true}
                        label={t('admin.customFields.field.defaultValue', 'Default Value')}
                        placeholder={t('admin.customFields.field.defaultValuePlaceholder', 'Default value for this field')}
                        disabled={isLoading}
                        showTime={false}
                    />
                );

            case 'datetime':
                return (
                    <DateTimePicker
                        form={form}
                        name="default_value"
                        showMonthYearPicker={true}
                        label={t('admin.customFields.field.defaultValue', 'Default Value')}
                        placeholder={t('admin.customFields.field.defaultValuePlaceholder', 'Default value for this field')}
                        disabled={isLoading}
                        showTime={true}
                    />
                );

            case 'multiple_choice':
                return enumValues.length > 0 ? (
                    <FormField
                        control={form.control}
                        name="default_value"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {t('admin.customFields.field.defaultValue', 'Default Value')}
                                </FormLabel>
                                <Select
                                    onValueChange={(value) => {
                                        field.onChange(value === '__no_default__' ? undefined : value);
                                    }}
                                    value={field.value !== undefined ? field.value.toString() : '__no_default__'}
                                    disabled={isLoading}
                                >
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={t('admin.customFields.field.selectDefaultOption', 'Select default option')} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="__no_default__">
                                            {t('admin.customFields.field.noDefault', 'No default')}
                                        </SelectItem>
                                        {enumValues.map((option) => (
                                            <SelectItem key={option} value={option}>
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                ) : null;

            case 'text':
            default:
                return (
                    <FormField
                        control={form.control}
                        name="default_value"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {t('admin.customFields.field.defaultValue', 'Default Value')}
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder={t('admin.customFields.field.defaultValuePlaceholder', 'Default value for this field')}
                                        value={field.value !== undefined ? field.value.toString() : ''}
                                        onChange={(e) => field.onChange(e.target.value || undefined)}
                                        disabled={isLoading}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                );
        }
    };

    const addEnumValue = () => {
        if (newEnumValue.trim() && !enumValues.includes(newEnumValue.trim())) {
            const updatedValues = [...enumValues, newEnumValue.trim()];
            setEnumValues(updatedValues);
            form.setValue('enum_types', updatedValues);
            setNewEnumValue('');
        }
    };

    const removeEnumValue = (valueToRemove: string) => {
        // In edit mode, don't allow removal of original values
        if (isEditMode && originalEnumValues.includes(valueToRemove)) {
            return;
        }

        const updatedValues = enumValues.filter(value => value !== valueToRemove);
        setEnumValues(updatedValues);
        form.setValue('enum_types', updatedValues);
    };

    const onSubmit = async (values: FormValues) => {
        if (isEditMode && !field?.id) {
            toast.error('Field ID is required for editing');
            return;
        }

        setIsLoading(true);
        try {
            const requestData = {
                table_name: table_name,
                name: values.name,
                description: values.description || '',
                data_type: values.data_type === 'multiple_choice' ? 'text' : values.data_type,
                default_value: values.is_unique ? null : convertDefaultValueToString(values.default_value, values.data_type),
                enum_types: enumValues.length > 0 ? enumValues : undefined,
                is_nullable: !values.is_required,
                is_unique: values.is_unique,
                is_multiple_values: values.is_multiple_values,
                is_shown_by_default: values.is_shown_by_default,
                section_id: sectionId,
            };

            const response = isEditMode
                ? await patchOrgField(orgId, field!.id, requestData)
                : await postOrgField(orgId, requestData);

            if (response.success) {
                const successMessage = isEditMode
                    ? t('admin.customFields.field.updatedSuccess', 'Field updated successfully')
                    : t('admin.customFields.field.createdSuccess', 'Field created successfully');

                toast.success(successMessage);

                if (!isEditMode) {
                    form.reset();
                    setEnumValues([]);
                    setOriginalEnumValues([]);
                    setNewEnumValue('');
                }

                onOpenChange(false);

                if (onFieldCreated) {
                    onFieldCreated();
                }
            } else {
                const errorMessage = isEditMode
                    ? response.error || t('admin.customFields.field.updateError', 'Failed to update field')
                    : response.error || t('admin.customFields.field.createError', 'Failed to create field');

                toast.error(errorMessage);
            }
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} field:`, error);
            const errorMessage = isEditMode
                ? t('admin.customFields.field.updateError', 'Failed to update field')
                : t('admin.customFields.field.createError', 'Failed to create field');

            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = async (open: boolean) => {
        if (!open) {
            if (form.formState.isDirty) {
                const discard = await promptUnsavedChanges();
                if (discard) {
                    if (!isEditMode) {
                        form.reset();
                        setEnumValues([]);
                        setOriginalEnumValues([]);
                        setNewEnumValue('');
                    }
                    onOpenChange(false);
                }
            } else {
                if (!isEditMode) {
                    form.reset();
                    setEnumValues([]);
                    setOriginalEnumValues([]);
                    setNewEnumValue('');
                }
                onOpenChange(false);
            }
        } else {
            onOpenChange(true);
        }
    };

    const handleInteractOutside = (e: Event) => {
        if (form.formState.isDirty) {
            e.preventDefault();
            handleOpenChange(false);
        }
    };

    // Reset form when modal opens or field changes
    useEffect(() => {
        if (open) {
            form.reset(getDefaultValues(field));
            setNewEnumValue('');
        }
    }, [open, field, form]);

    const dialogTitle = isEditMode
        ? t('admin.customFields.field.editField', 'Edit Custom Field')
        : t('admin.customFields.field.addField', 'Add Custom Field');

    const submitButtonText = isEditMode
        ? t('admin.customFields.field.updateField', 'Update Field')
        : t('admin.customFields.field.createField', 'Create Field');

    const loadingText = isEditMode
        ? t('admin.customFields.field.updating', 'Updating Field...')
        : t('admin.customFields.field.creating', 'Creating Field...');

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="max-w-xl md:min-w-xl"
                showCloseButton={!isEditMode}
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold mb-4">
                        {dialogTitle}
                        {isEditMode && (
                            <div className="ml-auto">
                                <IdBadge id={field?.id || ""} />
                            </div>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-6 overflow-y-auto max-h-[70vh] px-2 scrollbar-hide mb-16">
                        {/* Basic Information */}
                        <div className="space-y-4">

                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('admin.customFields.field.name', 'Field Name')} *
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t('admin.customFields.field.namePlaceholder', 'e.g., Company Size, Industry')}
                                                {...field}
                                                disabled={isLoading || isEditMode}
                                                autoFocus={!isEditMode}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                        {isEditMode && (
                                            <FormDescription>
                                                {t('admin.customFields.field.nameNotEditableHelp', 'Field name cannot be changed after creation')}
                                            </FormDescription>
                                        )}
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('admin.customFields.field.description', 'Description')}
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder={t('admin.customFields.field.descriptionPlaceholder', 'Brief description of this field')}
                                                {...field}
                                                disabled={isLoading}
                                                rows={3}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Data Type Configuration */}
                        <div className="space-y-4">

                            <FormField
                                control={form.control}
                                name="data_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('admin.customFields.field.dataType', 'Data Type')} *
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            disabled={isLoading || isEditMode}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder={t('admin.customFields.field.selectDataType', 'Select data type')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {dataTypeOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {t(`admin.customFields.field.dataTypes.${option.value}`, option.label)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                        {isEditMode && (
                                            <FormDescription>
                                                {t('admin.customFields.field.dataTypeNotEditableHelp', 'Data type cannot be changed after creation')}
                                            </FormDescription>
                                        )}
                                    </FormItem>
                                )}
                            />

                            {/* Select Options (only for text type) */}
                            {watchDataType === 'multiple_choice' && (
                                <div className="space-y-3">
                                    <FormLabel>
                                        {t('admin.customFields.field.selectOptions', 'Select Options')}
                                    </FormLabel>
                                    <FormDescription>
                                        {t('admin.customFields.field.selectOptionsHelp', 'Add options to make this field a dropdown select. Leave empty for a regular text field.')}
                                    </FormDescription>

                                    <div className="flex gap-2">
                                        <Input
                                            placeholder={t('admin.customFields.field.addOption', 'Add option')}
                                            value={newEnumValue}
                                            onChange={(e) => setNewEnumValue(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addEnumValue();
                                                }
                                            }}
                                            disabled={isLoading}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={addEnumValue}
                                            disabled={isLoading || !newEnumValue.trim()}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {isEditMode && (
                                        <FormDescription>
                                            {t('admin.customFields.field.optionsCanOnlyAddHelp', 'You can add new options but cannot delete existing ones')}
                                        </FormDescription>
                                    )}

                                    {enumValues.length > 0 && (
                                        <div className="space-y-2">
                                            <div className="text-sm text-muted-foreground">
                                                {t('admin.customFields.field.options', 'Options')}:
                                            </div>
                                            <div className="space-y-1">
                                                {enumValues.map((value, index) => {
                                                    const isOriginalValue = isEditMode && originalEnumValues.includes(value);
                                                    return (
                                                        <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                                                            <span className="text-sm">
                                                                {value}
                                                                {isOriginalValue && (
                                                                    <span className="text-xs text-muted-foreground ml-2">
                                                                        ({t('admin.customFields.field.original', 'original')})
                                                                    </span>
                                                                )}
                                                            </span>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                className="text-destructive"
                                                                size="sm"
                                                                onClick={() => removeEnumValue(value)}
                                                                disabled={isLoading || isOriginalValue}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!form.watch('is_unique') && renderDefaultValueInput()}
                        </div>

                        {/* Field Options */}
                        <div className="space-y-4">

                            <div className="grid grid-cols-1 gap-4">
                                <FormField
                                    control={form.control}
                                    name="is_required"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">
                                                    {t('admin.customFields.field.nullable', 'Is Required')}
                                                </FormLabel>
                                                <FormDescription>
                                                    {t('admin.customFields.field.nullableHelp', 'If this field is required, the field must be filled in for the client to be saved')}
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="is_unique"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">
                                                    {t('admin.customFields.field.unique', 'Unique Value')}
                                                </FormLabel>
                                                <FormDescription>
                                                    {t('admin.customFields.field.uniqueHelp', 'Ensure values are unique across all clients entries. Use this for unique identifiers like ids')}
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                {<FormField
                                    control={form.control}
                                    name="is_multiple_values"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">
                                                    {t('admin.customFields.field.multipleValues', 'Multiple Values')}
                                                </FormLabel>
                                                <FormDescription>
                                                    {t('admin.customFields.field.multipleValuesHelp', 'Allow select multiple options for a multiple choice field')}
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div>
                                                            <Switch
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                                disabled={isLoading || !isSelectType || isEditMode}
                                                            />
                                                        </div>
                                                    </TooltipTrigger>
                                                    {(!isSelectType || isEditMode) && (
                                                        <TooltipContent>
                                                            {isEditMode ?
                                                                t('admin.customFields.field.multipleValuesNotEditableHelp', 'Multiple values setting cannot be changed after creation') :
                                                                !isSelectType ?
                                                                    t('admin.customFields.field.multipleValuesDisabledHelp', 'Multiple values are only available for multiple choice fields') :
                                                                    t('common.loading', 'Loading...')
                                                            }
                                                        </TooltipContent>
                                                    )}
                                                </Tooltip>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />}


                            </div>
                        </div>

                        <DialogFooter className="flex-col sm:flex-row gap-2 fixed bottom-0 left-0 right-0 bg-background p-4 rounded-b-lg">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={isLoading}
                            >
                                {t('common.cancel', 'Cancel')}
                            </Button>
                            <Button
                                type="submit"
                                onClick={form.handleSubmit(onSubmit)}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        {loadingText}
                                    </>
                                ) : (
                                    submitButtonText
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default CustomFieldAddModal;
