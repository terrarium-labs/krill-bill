import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Settings, ChevronLeft, ChevronRight, Check, Plus, User, CreditCard } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { postSupplier } from '@/api/suppliers/suppliers';
import { getSupplierContacts } from '@/api/suppliers/contacts/contacts';
import { getSupplierPaymentsMethods } from '@/api/suppliers/payment-methods/payment-methods';
import CURRENCIES from '@/utils/currencies';
import { PRIORITIZED_LANGUAGES } from '@/utils/languages';
import { ClientContact as SupplierContact } from '@/types/clients/client';
import { ClientPaymentMethod as SupplierPaymentMethod } from '@/types/clients/client';
import ContactModal from '@/app/suppliers/SupplierDetailPage/pages/SupplierDetailPageInfo/components/contact-modal';
import PaymentMethodModal from '@/app/suppliers/SupplierDetailPage/pages/SupplierDetailPageInfo/components/payment-method-modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
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

interface SupplierCreateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSupplierCreated?: () => void;
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

type WizardStep = 'basic' | 'contacts' | 'paymentMethods';

const STEPS: { id: WizardStep; label: string; translationKey: string }[] = [
    { id: 'basic', label: 'Basic Info', translationKey: 'suppliers.steps.basicInfo' },
    { id: 'contacts', label: 'Contacts', translationKey: 'suppliers.steps.contacts' },
    { id: 'paymentMethods', label: 'Payment Methods', translationKey: 'suppliers.steps.paymentMethods' },
];

const SupplierCreateModal: React.FC<SupplierCreateModalProps> = ({
    open,
    onOpenChange,
    onSupplierCreated,
    renderActions: _renderActions,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    const [sections, setSections] = useState<any[]>([]);

    const [createdSupplierId, setCreatedSupplierId] = useState<string | undefined>(undefined);
    const [currentStep, setCurrentStep] = useState<WizardStep>('basic');
    const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(new Set());

    const [contacts, setContacts] = useState<SupplierContact[]>([]);
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);

    const [paymentMethods, setPaymentMethods] = useState<SupplierPaymentMethod[]>([]);
    const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
    const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);

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

            console.log(`Creating supplier data:`, finalPayload);

            let response;
            response = await postSupplier(orgId, finalPayload);

            if (response.success) {
                const successMessage = t('suppliers.supplierCreatedSuccess', 'Supplier created successfully');
                toast.success(successMessage);
                const supplierId = (response.success as any)?.supplier?.id ?? (response.success as any)?.supplier_id;
                if (supplierId) {
                    setCreatedSupplierId(supplierId);
                    setCurrentStep('contacts');
                } else {
                    form.reset();
                    onOpenChange(false);
                    onSupplierCreated?.();
                }
            } else {
                const errorMessage = t('suppliers.postSupplierError', 'Failed to create supplier');
                toast.error(response.error || errorMessage);
            }
        } catch (error) {
            console.error(`Error creating supplier:`, error);
            const errorMessage = t('suppliers.postSupplierError', 'Failed to create supplier');
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = async () => {
        if (createdSupplierId) {
            onSupplierCreated?.();
            form.reset();
            onOpenChange(false);
            return;
        }
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
    };

    const handleOpenChange = async (open: boolean) => {
        if (!open) await handleClose();
        else onOpenChange(true);
    };

    const handleInteractOutside = (e: Event) => {
        if (createdSupplierId) return;
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

    // Reset form and wizard state when modal opens
    useEffect(() => {
        if (open) {
            fetchSections();
            form.reset();
            setCreatedSupplierId(undefined);
            setCurrentStep('basic');
            setCompletedSteps(new Set());
            setContacts([]);
            setPaymentMethods([]);
        }
    }, [open, form]);

    const fetchContacts = useCallback(async () => {
        if (!orgId || !createdSupplierId) return;
        setLoadingContacts(true);
        try {
            const response = await getSupplierContacts(orgId, createdSupplierId, null, null);
            if (response.success?.contacts) setContacts(response.success.contacts);
            else setContacts([]);
        } catch {
            setContacts([]);
        } finally {
            setLoadingContacts(false);
        }
    }, [orgId, createdSupplierId]);

    const fetchPaymentMethodsList = useCallback(async () => {
        if (!orgId || !createdSupplierId) return;
        setLoadingPaymentMethods(true);
        try {
            const response = await getSupplierPaymentsMethods(orgId, createdSupplierId, null);
            if (response.success?.payment_methods) setPaymentMethods(response.success.payment_methods);
            else setPaymentMethods([]);
        } catch {
            setPaymentMethods([]);
        } finally {
            setLoadingPaymentMethods(false);
        }
    }, [orgId, createdSupplierId]);

    useEffect(() => {
        if (currentStep === 'contacts' && createdSupplierId) fetchContacts();
    }, [currentStep, createdSupplierId, fetchContacts]);

    useEffect(() => {
        if (currentStep === 'paymentMethods' && createdSupplierId) fetchPaymentMethodsList();
    }, [currentStep, createdSupplierId, fetchPaymentMethodsList]);

    const handleNext = () => {
        const idx = STEPS.findIndex((s) => s.id === currentStep);
        if (idx < STEPS.length - 1) {
            setCompletedSteps((prev) => new Set(prev).add(currentStep));
            setCurrentStep(STEPS[idx + 1].id);
        }
    };

    const handlePrevious = () => {
        const idx = STEPS.findIndex((s) => s.id === currentStep);
        if (idx > 1) setCurrentStep(STEPS[idx - 1].id);
    };

    const handleFinish = () => {
        onSupplierCreated?.();
        form.reset();
        onOpenChange(false);
        if (orgId && createdSupplierId) navigate(`/${orgId}/suppliers/${createdSupplierId}`);
    };

    const getCurrentStepIndex = () => STEPS.findIndex((s) => s.id === currentStep);
    const isLastStep = () => getCurrentStepIndex() === STEPS.length - 1;
    const isFirstStep = () => getCurrentStepIndex() === 0;
    const canGoNext = () => !!createdSupplierId;

    const hasCurrentStepInput = () => {
        switch (currentStep) {
            case 'contacts': return contacts.length > 0;
            case 'paymentMethods': return paymentMethods.length > 0;
            default: return false;
        }
    };

    const handleSkipAll = () => { handleFinish(); };

    const isBasicStepLocked = !!createdSupplierId;
    const formDisabled = isLoading || isBasicStepLocked;


    return (
        <Dialog open={open} onOpenChange={handleOpenChange} >
            <DialogContent
                className="max-w-3xl md:min-w-3xl"
                showCloseButton={false}
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold mb-4">
                        <span>{t('suppliers.createNewSupplier', 'Create New Supplier')}</span>
                    </DialogTitle>
                </DialogHeader>

                {/* Step Indicator */}
                <div className="flex items-center justify-between gap-2 px-2 py-2">
                    {STEPS.map((step, index) => {
                        const isCompleted = completedSteps.has(step.id);
                        const isCurrent = step.id === currentStep;
                        const isAccessible = index === 0 || createdSupplierId != null;
                        return (
                            <div key={step.id} className="flex items-center flex-1">
                                <button
                                    type="button"
                                    onClick={() => isAccessible && setCurrentStep(step.id)}
                                    disabled={!isAccessible}
                                    className={cn(
                                        'flex items-center gap-2 text-xs font-medium transition-colors',
                                        isCurrent && 'text-primary',
                                        isCompleted && !isCurrent && 'text-muted-foreground',
                                        !isCompleted && !isCurrent && !isAccessible && 'text-muted-foreground/50',
                                        !isCompleted && !isCurrent && isAccessible && 'text-muted-foreground hover:text-foreground',
                                        isAccessible && 'cursor-pointer',
                                        !isAccessible && 'cursor-not-allowed'
                                    )}
                                >
                                    <div className={cn(
                                        'w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs',
                                        isCurrent && 'bg-primary text-primary-foreground',
                                        isCompleted && !isCurrent && 'bg-primary/20 text-primary',
                                        !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                                    )}>
                                        {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
                                    </div>
                                    <span className="hidden sm:inline">{t(step.translationKey, step.label)}</span>
                                </button>
                                {index < STEPS.length - 1 && (
                                    <div className={cn('h-[2px] flex-1 mx-1', isCompleted ? 'bg-primary/50' : 'bg-muted')} />
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="space-y-6 overflow-y-auto max-h-[70vh] px-2 scrollbar-hide mb-16">
                    {currentStep === 'basic' && (
                        <Form {...form}>
                            <div className="space-y-6">
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
                                                disabled={formDisabled}
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
                                disabled={formDisabled}
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
                                                                disabled={formDisabled}
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
                                                                disabled={formDisabled}
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
                                                                disabled={formDisabled}
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
                                                                disabled={formDisabled}
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
                                                                disabled={formDisabled}
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
                                                                disabled={formDisabled}
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
                                                                disabled={formDisabled}
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
                                                    disabled={formDisabled}
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
                                                                disabled={formDisabled}
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
                                                        <Textarea placeholder={t('suppliers.enterNotes', 'Notes')} {...field} disabled={formDisabled} />
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
                                                disabled={formDisabled}
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
                                                                disabled={formDisabled}
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
                                                                disabled={formDisabled}
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
                                                                disabled={formDisabled}
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
                                                                disabled={formDisabled}
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
                                                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={formDisabled}>
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
                                                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={formDisabled}>
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
                                                    disabled={formDisabled}
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
                                                        disabled={formDisabled}
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
                            </div>
                        </Form>
                    )}

                    {currentStep === 'contacts' && createdSupplierId && orgId && (
                        <div className="space-y-4 py-2">
                            <Card className="shadow-none">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 justify-between">
                                        {t('suppliers.contacts', 'Contacts')}
                                        <Button onClick={() => setIsContactModalOpen(true)} size="sm" variant="outline">
                                            <Plus className="h-4 w-4" />
                                            {t('suppliers.addContact', 'Add')}
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="py-0 px-4">
                                    {loadingContacts ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : contacts.length === 0 ? (
                                        <div className="text-center py-4">
                                            <User className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                            <p className="text-sm text-muted-foreground">{t('suppliers.noContacts', 'No contacts yet')}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-0">
                                            {contacts.map((c, index) => (
                                                <div key={c.id}>
                                                    <div className="py-2 flex items-center gap-2 text-sm">
                                                        <span className="font-medium">{c.name || '-'}</span>
                                                        {c.email && <span className="text-muted-foreground text-xs">{c.email}</span>}
                                                    </div>
                                                    {index < contacts.length - 1 && <Separator />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            <ContactModal
                                open={isContactModalOpen}
                                onOpenChange={setIsContactModalOpen}
                                onContactSaved={() => { fetchContacts(); setIsContactModalOpen(false); }}
                                supplierId={createdSupplierId}
                            />
                        </div>
                    )}

                    {currentStep === 'paymentMethods' && createdSupplierId && orgId && (
                        <div className="space-y-4 py-2">
                            <Card className="shadow-none">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 justify-between">
                                        {t('suppliers.paymentMethods', 'Payment Methods')}
                                        <Button onClick={() => setIsPaymentMethodModalOpen(true)} size="sm" variant="outline">
                                            <Plus className="h-4 w-4" />
                                            {t('suppliers.addPaymentMethod', 'Add')}
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="py-0 px-4">
                                    {loadingPaymentMethods ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : paymentMethods.length === 0 ? (
                                        <div className="text-center py-4">
                                            <CreditCard className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                            <p className="text-sm text-muted-foreground">{t('suppliers.noPaymentMethods', 'No payment methods yet')}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-0">
                                            {paymentMethods.map((pm, index) => (
                                                <div key={pm.id}>
                                                    <div className="py-2 flex items-center gap-2 text-sm">
                                                        <span className="font-medium">{pm.bank}</span>
                                                        {pm.iban && <span className="text-muted-foreground font-mono text-xs">{pm.iban}</span>}
                                                    </div>
                                                    {index < paymentMethods.length - 1 && <Separator />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            <PaymentMethodModal
                                open={isPaymentMethodModalOpen}
                                onOpenChange={setIsPaymentMethodModalOpen}
                                onPaymentMethodCreated={() => { fetchPaymentMethodsList(); setIsPaymentMethodModalOpen(false); }}
                                supplierId={createdSupplierId}
                                orgId={orgId}
                                mode="create"
                            />
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 fixed bottom-0 left-0 right-0 bg-background p-4 rounded-b-lg">
                    <div className="flex gap-2">
                        {!isFirstStep() && currentStep !== 'contacts' && (
                            <Button type="button" variant="outline" onClick={handlePrevious} disabled={isLoading}>
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                {t('common.previous', 'Previous')}
                            </Button>
                        )}
                    </div>
                    <div className="flex-1" />
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
                            {createdSupplierId ? t('common.close', 'Close') : t('common.cancel', 'Cancel')}
                        </Button>
                        {currentStep === 'basic' && !createdSupplierId && (
                            <Button type="submit" onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {t('suppliers.creatingSupplier', 'Creating Supplier...')}
                                    </>
                                ) : (
                                    t('common.create', 'Create')
                                )}
                            </Button>
                        )}
                        {currentStep !== 'basic' && !isLastStep() && (
                            <Button type="button" onClick={handleNext} disabled={!canGoNext()}>
                                {hasCurrentStepInput() ? t('common.next', 'Next') : t('common.skip', 'Skip')}
                                <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        )}
                        {currentStep !== 'basic' && !isLastStep() && (
                            <Button type="button" variant="ghost" onClick={handleSkipAll} disabled={!canGoNext()}>
                                {t('common.skipAll', 'Skip all')}
                            </Button>
                        )}
                        {currentStep !== 'basic' && isLastStep() && (
                            <Button type="button" onClick={handleFinish}>
                                {t('common.finish', 'Finish')}
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
};

export default SupplierCreateModal;

