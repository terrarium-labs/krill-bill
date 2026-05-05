import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Settings } from 'lucide-react';

import { useTranslation } from '@/hooks/useTranslation';
import { postSupplier, patchSupplier } from '@/api/suppliers/suppliers';
import CURRENCIES from '@/utils/currencies';
import { PRIORITIZED_LANGUAGES } from '@/utils/languages';
import { Supplier } from '@/types/suppliers/supplier';

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
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { TaxCodeInput } from '@/app/components/forms-elements/tax-code-input';
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from '@/components/ui/shadcn-io/tabs';
import { PhoneInput } from '@/app/components/forms-elements/phone-input';
import CountriesInput from '@/app/components/forms-elements/countries-input';
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';
import { getOrgSections } from '@/api/orgs/sections/sections';
import CustomFieldsSection from '@/app/components/custom-fields-section';
import { Textarea } from '@/components/ui/textarea';
import IdBadge from '@/app/components/id-badge';

interface SupplierEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSupplierCreatedOrUpdated?: () => void;
    supplier?: Supplier | null; // For edit mode
    mode: 'create' | 'edit';
    renderActions?: () => React.ReactNode; // Custom actions for edit mode (e.g., delete dropdown)
}

// Form input schema (what the form expects)
const formInputSchema = z.object({
    trade_name: z
        .string()
        .min(1, 'Trade name is required')
        .min(2, 'Trade name must be at least 2 characters')
        .max(128, 'Trade name must be less than 128 characters')
        .trim(),
    supplier_name: z
        .string()
        .max(128, 'Supplier name must be less than 128 characters')
        .trim()
        .optional(),
    tax_code: z
        .string()
        .min(1, 'Tax code is required')
        .trim(),
    tax_code_type: z
        .string()
        .min(1, 'Tax code type is required')
        .trim(),
    email: z
        .email('Please enter a valid email address')
        .optional()
        .or(z.literal('')),
    phone: z
        .string()
        .optional(),
    address_line_1: z
        .string()
        .max(255, 'Address line 1 must be less than 255 characters')
        .optional(),
    address_line_2: z
        .string()
        .max(255, 'Address line 2 must be less than 255 characters')
        .optional(),
    postal_code: z
        .string()
        .max(20, 'Postal code must be less than 20 characters')
        .optional(),
    city: z
        .string()
        .max(100, 'City must be less than 100 characters')
        .optional(),
    state_province: z
        .string()
        .max(100, 'State/Province must be less than 100 characters')
        .optional(),
    country: z
        .string()
        .max(100, 'Country must be less than 100 characters')
        .optional(),
    url: z
        .string()
        .refine(
            (val) => val === '' || z.url().safeParse(val).success,
            'Please enter a valid URL'
        )
        .optional(),
    notes: z
        .string()
        .max(500, 'Notes must be less than 500 characters')
        .optional(),
    // Financial fields - keep as strings for form inputs
    risk: z
        .string()
        .optional(),
    is_covered_risk: z
        .boolean()
        .optional(),
    default_due_days: z
        .string()
        .optional()
        .refine((val) => {
            if (!val) return true;
            const num = parseInt(val);
            return !isNaN(num) && num >= 0 && num <= 365;
        }, 'Must be a valid number between 0 and 365'),
    default_payment_day: z
        .string()
        .optional()
        .refine((val) => {
            if (!val) return true;
            const num = parseInt(val);
            return !isNaN(num) && num >= 1 && num <= 31;
        }, 'Must be a valid number between 1 and 31'),
    language: z
        .string()
        .optional(),
    currency: z
        .string()
        .optional(),
    custom_fields: z.record(z.string(), z.any()).optional(),
});

// Processing schema (transforms strings to numbers for API)
const baseFormSchema = formInputSchema.transform((data) => ({
    ...data,
    risk: data.risk && data.risk !== '' ? parseFloat(data.risk) : undefined,
}));

type FormValues = z.infer<typeof formInputSchema>;

const SupplierEditModal: React.FC<SupplierEditModalProps> = ({
    open,
    onOpenChange,
    onSupplierCreatedOrUpdated,
    supplier = null,
    mode,
    renderActions,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [sections, setSections] = useState<any[]>([]);
    const navigate = useNavigate();
    const isEditMode = mode === 'edit';
    const form = useForm<FormValues>({
        resolver: zodResolver(formInputSchema),
        defaultValues: {
            trade_name: '',
            supplier_name: '',
            tax_code: '',
            tax_code_type: 'es_cif',
            email: '',
            phone: '',
            address_line_1: '',
            address_line_2: '',
            postal_code: '',
            city: '',
            state_province: '',
            country: '',
            url: '',
            notes: '',
            // Financial fields
            risk: '',
            is_covered_risk: false,
            default_due_days: '',
            default_payment_day: '',
            language: 'ca',
            currency: 'EUR',
            custom_fields: {},
        },
    });

    // Helper function to populate form with supplier data
    const populateFormWithSupplierData = (supplierData: Supplier) => {
        console.log('supplierData', supplierData);
        // Reset form with basic data first
        form.reset({
            trade_name: supplierData.trade_name || '',
            supplier_name: supplierData.supplier_name || '',
            tax_code: supplierData.tax_code || '',
            tax_code_type: supplierData.tax_code_type || 'es_cif',
            email: supplierData.email || '',
            phone: supplierData.phone || '',
            address_line_1: supplierData.address_line_1 || '',
            address_line_2: supplierData.address_line_2 || '',
            postal_code: supplierData.postal_code || '',
            city: supplierData.city || '',
            state_province: supplierData.state_province || '',
            country: supplierData.country || '',
            url: supplierData.url || '',
            notes: supplierData.notes || '',
            // Financial fields
            risk: supplierData.risk?.toString() || '',
            is_covered_risk: supplierData.is_covered_risk || false,
            default_due_days: supplierData.default_due_days?.toString() || '',
            default_payment_day: supplierData.default_payment_day?.toString() || '',
            language: supplierData.language || 'ca',
            currency: supplierData.currency || 'EUR',
            custom_fields: {},
        });

        supplierData.sections?.forEach((section) => {
            section.fields?.forEach((field) => {
                const fieldPath = `custom_fields.${field.id}` as any;
                form.setValue(fieldPath, field.value);
            });
        });
    };

    // Function to validate custom fields
    const validateCustomFields = (customFields: Record<string, any> = {}, allSections: any[]): { isValid: boolean; errors: Record<string, string> } => {
        const errors: Record<string, string> = {};
        let isValid = true;

        // Get all fields from all sections
        const allFields = allSections.flatMap(section => section.fields || []);

        allFields.forEach((field: any) => {
            if (!field.is_shown_by_default) return;

            const fieldName = `custom_fields.${field.id}`;
            const value = customFields[field.id];
            const isRequired = !field.is_nullable;

            // Check if required field is empty
            if (isRequired) {
                if (value === undefined || value === null || value === '' ||
                    (Array.isArray(value) && value.length === 0)) {
                    errors[fieldName] = `${field.name} is required`;
                    isValid = false;
                }
            }

            // Type-specific validation - only if value is provided
            if (value !== undefined && value !== null && value !== '') {
                switch (field.data_type) {
                    case 'integer':
                        if (typeof value === 'string' && isNaN(parseInt(value))) {
                            errors[fieldName] = `${field.name} must be a valid integer`;
                            isValid = false;
                        } else if (typeof value === 'number' && !Number.isInteger(value)) {
                            errors[fieldName] = `${field.name} must be a valid integer`;
                            isValid = false;
                        }
                        break;
                    case 'float':
                        if (typeof value === 'string' && isNaN(parseFloat(value))) {
                            errors[fieldName] = `${field.name} must be a valid number`;
                            isValid = false;
                        } else if (typeof value === 'number' && isNaN(value)) {
                            errors[fieldName] = `${field.name} must be a valid number`;
                            isValid = false;
                        }
                        break;
                    case 'text':
                        if (field.enum_types && field.enum_types.length > 0) {
                            if (field.is_multiple_values) {
                                if (!Array.isArray(value) || !value.every(v => field.enum_types.includes(v))) {
                                    errors[fieldName] = `${field.name} contains invalid selections`;
                                    isValid = false;
                                }
                            } else {
                                if (!field.enum_types.includes(value)) {
                                    errors[fieldName] = `${field.name} must be one of the available options`;
                                    isValid = false;
                                }
                            }
                        }
                        break;
                }
            }
        });

        return { isValid, errors };
    };

    const onSubmit = async (values: FormValues) => {
        if (!orgId) {
            toast.error('Organization ID is required');
            return;
        }

        // Validate custom fields before submission
        const customFieldsValidation = validateCustomFields(values.custom_fields, sections);
        if (!customFieldsValidation.isValid) {
            // Set form errors for invalid custom fields
            Object.entries(customFieldsValidation.errors).forEach(([fieldName, error]) => {
                form.setError(fieldName as any, { type: 'manual', message: error });
            });
            toast.error('Please fix the errors in custom fields before submitting');
            return;
        }

        // Transform and validate the data using the processing schema
        const transformResult = baseFormSchema.safeParse(values);
        if (!transformResult.success) {
            toast.error('Please check your input values');
            return;
        }

        setIsLoading(true);
        try {
            // Prepare the payload - separate custom fields from regular fields
            const { custom_fields, ...regularFields } = transformResult.data;

            // Process financial fields with proper type conversion
            const processedFields: any = { ...regularFields };

            // Convert string numbers to actual numbers for financial fields
            if (processedFields.default_due_days && processedFields.default_due_days !== '') {
                processedFields.default_due_days = parseInt(processedFields.default_due_days as string);
            }
            if (processedFields.default_payment_day && processedFields.default_payment_day !== '') {
                processedFields.default_payment_day = parseInt(processedFields.default_payment_day as string);
            }

            // Prepare custom fields for submission
            let fieldsPayload = {};
            if (custom_fields && Object.keys(custom_fields).length > 0) {
                // Filter out empty custom field values
                fieldsPayload = Object.fromEntries(
                    Object.entries(custom_fields).filter(([_, value]) => {
                        // Keep the value if it's not null, undefined, or empty string
                        if (value === null || value === undefined || value === '') return false;
                        // For arrays (multi-select), keep if not empty
                        if (Array.isArray(value)) return value.length > 0;
                        // For booleans, always keep (false is a valid value)
                        if (typeof value === 'boolean') return true;
                        // For numbers, keep (0 is a valid value)
                        if (typeof value === 'number') return true;
                        return true;
                    })
                );
            }

            // Combine regular fields with custom fields
            const finalPayload = {
                ...processedFields,
                ...(Object.keys(fieldsPayload).length > 0 && { fields: fieldsPayload })
            };

            // Avoid empty strings for fields that are not required change for null
            Object.keys(finalPayload).forEach(key => {
                if (finalPayload[key] === '') {
                    finalPayload[key] = null;
                }
            });

            console.log(`${isEditMode ? 'Updating' : 'Creating'} supplier data:`, finalPayload);

            let response;
            if (isEditMode && supplier?.id) {
                response = await patchSupplier(orgId, supplier.id, finalPayload);
            } else {
                response = await postSupplier(orgId, finalPayload);
            }

            if (response.success) {
                const successMessage = isEditMode
                    ? t('suppliers.supplierUpdatedSuccess', 'Supplier updated successfully')
                    : t('suppliers.supplierCreatedSuccess', 'Supplier created successfully');
                toast.success(successMessage);
                form.reset();
                onOpenChange(false);
                if (onSupplierCreatedOrUpdated) {
                    onSupplierCreatedOrUpdated();
                }
            } else {
                const errorMessage = isEditMode
                    ? t('suppliers.patchSupplierError', 'Failed to update supplier')
                    : t('suppliers.postSupplierError', 'Failed to create supplier');
                toast.error(response.error || errorMessage);
            }
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} supplier:`, error);
            const errorMessage = isEditMode
                ? t('suppliers.patchSupplierError', 'Failed to update supplier')
                : t('suppliers.postSupplierError', 'Failed to create supplier');
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
                    form.reset();
                    onOpenChange(false);
                }
            } else {
                form.reset();
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

    const fetchSections = async () => {
        const response = await getOrgSections(orgId || "", "Suppliers");
        if (response.success) {
            setSections(response.success.sections);
        }
    };

    // Helper functions to filter sections
    const getBasicSection = () => sections.find(section => section.handler === 'basic');
    const getFinancialsSection = () => sections.find(section => section.handler === 'financials');
    const getOtherSections = () => sections.filter(section =>
        section.handler !== 'basic' && section.handler !== 'financials'
    );

    // Reset form when modal opens/closes
    useEffect(() => {
        if (open) {
            fetchSections();
            if (isEditMode && supplier) {
                // Add a small delay to ensure sections are loaded first
                setTimeout(() => {
                    populateFormWithSupplierData(supplier);
                }, 137);
            } else {
                form.reset();
            }
        }
    }, [open, form, isEditMode, supplier]);


    return (
        <Dialog open={open} onOpenChange={handleOpenChange} >
            <DialogContent
                className="max-w-3xl md:min-w-3xl"
                showCloseButton={!isEditMode}
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold mb-4">
                        <span>
                            {isEditMode
                                ? t('suppliers.updateSupplier', 'Update Supplier')
                                : t('suppliers.createNewSupplier', 'Create New Supplier')
                            }
                        </span>
                        {isEditMode && supplier && (
                            <div className="flex items-center gap-2">
                                <IdBadge id={supplier.id} />
                                {renderActions && renderActions()}
                            </div>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form} >
                    <div className="space-y-6 overflow-y-auto max-h-[70vh] px-2 scrollbar-hide mb-16">

                        {/* Required Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">
                            <FormField
                                control={form.control}
                                name="trade_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('suppliers.tradeName', 'Trade Name')} *
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t('suppliers.enterTradeName', 'Trade name')}
                                                {...field}
                                                disabled={isLoading}
                                                autoFocus
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            {t('suppliers.tradeNameDescription', 'The business or trading name of the supplier.')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />


                            <TaxCodeInput
                                form={form}
                                name="tax_code"
                                taxCodeTypeName="tax_code_type"
                                label={t('suppliers.taxCode', 'Tax Code')}
                                placeholder={t('suppliers.enterTaxCode', 'Tax code')}
                                disabled={isLoading}
                            />
                        </div>

                        <Tabs defaultValue="basic">
                            <TabsList className="w-full justify-start border-b-2 border-border bg-background mb-4" activeClassName='border-b-2 border-primary -mb-1.5'>
                                <TabsTrigger className="py-0" value="basic">{t('suppliers.basicInformation', 'Basic')}</TabsTrigger>
                                <TabsTrigger className="py-0" value="financials">{t('suppliers.financialInformation', 'Financial')}</TabsTrigger>
                                {getOtherSections().map((section) => (
                                    <TabsTrigger key={section.id} className="py-0" value={section.id}>
                                        {section.title}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            <TabsContents className='p-1'>
                                <TabsContent value="basic">
                                    {/* Contact Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">
                                        <div className="col-span-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">

                                            <FormField
                                                control={form.control}
                                                name="address_line_1"
                                                render={({ field }) => (
                                                    <FormItem className="col-span-2">
                                                        <FormLabel>
                                                            {t('suppliers.addressLine1', 'Address')}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder={t('suppliers.enterAddressLine1', 'Street address')}
                                                                {...field}
                                                                disabled={isLoading}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="address_line_2"
                                                render={({ field }) => (
                                                    <FormItem className="col-span-2">
                                                        <FormLabel>
                                                            {t('suppliers.addressLine2', 'Address Line 2')}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder={t('suppliers.enterAddressLine2', 'Apartment, suite, etc.')}
                                                                {...field}
                                                                disabled={isLoading}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="city"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {t('suppliers.city', 'City')}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder={t('suppliers.enterCity', 'City')}
                                                                {...field}
                                                                disabled={isLoading}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="postal_code"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {t('suppliers.postalCode', 'Postal Code')}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder={t('suppliers.enterPostalCode', 'Postal code')}
                                                                {...field}
                                                                disabled={isLoading}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="state_province"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {t('suppliers.stateProvince', 'State/Province')}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder={t('suppliers.enterStateProvince', 'State or province')}
                                                                {...field}
                                                                disabled={isLoading}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <CountriesInput
                                                form={form}
                                                name="country"
                                                label={t('suppliers.country', 'Country')}
                                                defaultValue={'ES'}
                                            />
                                        </div>
                                        <div className="col-span-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">
                                            <FormField
                                                control={form.control}
                                                name="supplier_name"
                                                render={({ field }) => (
                                                    <FormItem className="col-span-2">
                                                        <FormLabel>
                                                            {t('suppliers.supplierName', 'Commercial Name')}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder={t('suppliers.enterSupplierName', 'Commercial name')}
                                                                {...field}
                                                                disabled={isLoading}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem className="col-span-2">
                                                        <FormLabel>
                                                            {t('suppliers.email', 'Email')}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="email"
                                                                placeholder={t('suppliers.enterEmail', 'example@example.com')}
                                                                {...field}
                                                                disabled={isLoading}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="col-span-2">
                                                <PhoneInput
                                                    form={form}
                                                    name="phone"
                                                    required={false}
                                                    label={t('suppliers.phone', 'Phone')}
                                                    placeholder={t('suppliers.enterPhone', 'Phone number')}
                                                    disabled={isLoading}
                                                />
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="url"
                                                render={({ field }) => (
                                                    <FormItem className="col-span-2">
                                                        <FormLabel>
                                                            {t('suppliers.website', 'Website')}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="url"
                                                                placeholder={t('suppliers.enterWebsite', 'Website URL')}
                                                                {...field}
                                                                disabled={isLoading}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Notes Section */}
                                        <FormField
                                            control={form.control}
                                            name="notes"
                                            render={({ field }) => (
                                                <FormItem className="col-span-2">
                                                    <FormLabel>
                                                        {t('suppliers.notes', 'Notes')}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Textarea placeholder={t('suppliers.enterNotes', 'Notes')} {...field} disabled={isLoading} />
                                                    </FormControl>
                                                    <FormDescription>
                                                        {t('suppliers.notesDescription', 'Notes about the supplier')}
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Custom Fields for Basic Section */}
                                    {getBasicSection() && getBasicSection()?.fields && getBasicSection()?.fields.length > 0 && (
                                        <div className="mt-4">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="text-sm font-bold mb-4 text-muted-foreground border-b border-border pb-2 flex-1">{t('suppliers.customFields', 'Custom Fields')}</h3>
                                                <Button variant="ghost" size="icon" onClick={() => navigate(`/${orgId}/admin/fields/suppliers`)}>
                                                    <Settings className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </div>
                                            <CustomFieldsSection
                                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                                fields={getBasicSection()?.fields || []}
                                                form={form}
                                                disabled={isLoading}
                                            />
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="financials">
                                    {/* Financial Information */}
                                    <div className="space-y-6">
                                        {/* Built-in Financial Fields */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="risk"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {t('suppliers.risk', 'Risk')}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                placeholder={t('suppliers.enterRisk', 'Risk quantity')}
                                                                {...field}
                                                                disabled={isLoading}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="is_covered_risk"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 my-4">
                                                        <div className="space-y-0.5">
                                                            <FormLabel>
                                                                {t('suppliers.isCoveredRisk', 'Risk is Covered')}
                                                            </FormLabel>
                                                            <FormDescription>
                                                                {t('suppliers.isCoveredRiskDescription', 'Check if this supplier\'s risk is covered by insurance or guarantees')}
                                                            </FormDescription>
                                                        </div>
                                                        <FormControl>
                                                            <Switch
                                                                checked={field.value || false}
                                                                onCheckedChange={field.onChange}
                                                                disabled={isLoading}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="default_due_days"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {t('suppliers.defaultDueDays', 'Default Due Days')}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max="365"
                                                                placeholder={t('suppliers.enterDefaultDueDays', 'Number of days')}
                                                                {...field}
                                                                disabled={isLoading}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            {t('suppliers.defaultDueDaysDescription', 'Default number of days for payment due dates')}
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="default_payment_day"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {t('suppliers.defaultPaymentDay', 'Default Payment Day')}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                max="31"
                                                                placeholder={t('suppliers.enterDefaultPaymentDay', 'Day of month (1-31)')}
                                                                {...field}
                                                                disabled={isLoading}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            {t('suppliers.defaultPaymentDayDescription', 'Default day of the month for payments')}
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="language"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {t('suppliers.language', 'Preferred Language')}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder={t('suppliers.selectLanguage', 'Select a language')} />
                                                                </SelectTrigger>

                                                                <SelectContent>
                                                                    {PRIORITIZED_LANGUAGES.map((language) => (
                                                                        <SelectItem key={language.code} value={language.code}>
                                                                            {language.name} ({language.nativeName})
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="currency"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {t('suppliers.currency', 'Preferred Currency')}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                                                                <SelectTrigger className="w-full"   >
                                                                    <SelectValue placeholder={t('suppliers.selectCurrency', 'Select a currency')} />
                                                                </SelectTrigger>

                                                                <SelectContent>
                                                                    {CURRENCIES.map((currency) => (
                                                                        <SelectItem key={currency.code} value={currency.code}>
                                                                            {currency.symbol} {currency.code} - {currency.name}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Custom Financial Fields */}
                                        {getFinancialsSection() && getFinancialsSection()?.fields && getFinancialsSection()?.fields.length > 0 && (
                                            <div className="mt-6">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h3 className="text-sm font-bold mb-4 text-muted-foreground border-b border-border pb-2 flex-1">{t('suppliers.customFields', 'Custom Fields')}</h3>
                                                    <Button variant="ghost" size="icon" onClick={() => navigate(`/${orgId}/admin/fields/suppliers`)}>
                                                        <Settings className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                </div>
                                                <CustomFieldsSection
                                                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                                    fields={getFinancialsSection()?.fields || []}
                                                    form={form}
                                                    disabled={isLoading}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                                {getOtherSections().map((section) => (
                                    <TabsContent key={section.id} value={section.id}>
                                        <div className="space-y-6">
                                            {section.fields && section.fields.length > 0 ? (
                                                <div className="mt-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h3 className="text-sm font-bold mb-4 text-muted-foreground border-b border-border pb-2 flex-1">{t('suppliers.customFields', 'Custom Fields')}</h3>
                                                        <Button variant="ghost" size="icon" onClick={() => navigate(`/${orgId}/admin/fields/suppliers`)}>
                                                            <Settings className="h-4 w-4 text-muted-foreground" />
                                                        </Button>
                                                    </div>
                                                    <CustomFieldsSection
                                                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                                        fields={section.fields}
                                                        form={form}
                                                        disabled={isLoading}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="text-center py-8">
                                                    <p className="text-muted-foreground text-sm">
                                                        {t('suppliers.noFieldsInSection', 'No fields configured for this section yet.')}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                ))}
                            </TabsContents>
                        </Tabs>



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
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {isEditMode
                                            ? t('suppliers.updatingSupplier', 'Updating Supplier...')
                                            : t('suppliers.creatingSupplier', 'Creating Supplier...')
                                        }
                                    </>
                                ) : (
                                    isEditMode
                                        ? t('common.update', 'Update')
                                        : t('common.create', 'Create')
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                </Form>
            </DialogContent>
        </Dialog >
    );
};

export default SupplierEditModal;

