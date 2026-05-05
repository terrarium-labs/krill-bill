import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Settings, ChevronLeft, ChevronRight, Check, Plus, Users, User, CreditCard } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { postClient } from '@/api/clients/clients';
import { getClientStakeholders } from '@/api/clients/stakeholders/stakeholders';
import { getClientContacts } from '@/api/clients/contacts/contacts';
import { getPaymentsMethods } from '@/api/clients/payment-methods/payment-methods';
import CURRENCIES from '@/utils/currencies';
import { PRIORITIZED_LANGUAGES } from '@/utils/languages';
import { Client, ClientStakeholder, ClientContact, ClientPaymentMethod } from '@/types/clients/client';
import StakeholderModal from '@/app/clients/ClientDetailPage/pages/ClientDetailPageInfo/components/stakeholder-modal';
import ContactModal from '@/app/clients/ClientDetailPage/pages/ClientDetailPageInfo/components/contact-modal';
import PaymentMethodModal from '@/app/clients/ClientDetailPage/pages/ClientDetailPageInfo/components/payment-method-modal';
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

interface ClientCreateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onClientCreated?: () => void;
}

// Form input schema (what the form expects)
const formInputSchema = z.object({
    trade_name: z
        .string()
        .min(1, 'Trade name is required')
        .min(2, 'Trade name must be at least 2 characters')
        .max(128, 'Trade name must be less than 128 characters')
        .trim(),
    client_name: z
        .string()
        .max(128, 'Client name must be less than 128 characters')
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

type WizardStep = 'basic' | 'stakeholders' | 'contacts' | 'paymentMethods';

const STEPS: { id: WizardStep; label: string; translationKey: string }[] = [
    { id: 'basic', label: 'Basic Info', translationKey: 'clients.steps.basicInfo' },
    { id: 'stakeholders', label: 'Stakeholders', translationKey: 'clients.steps.stakeholders' },
    { id: 'contacts', label: 'Contacts', translationKey: 'clients.steps.contacts' },
    { id: 'paymentMethods', label: 'Payment Methods', translationKey: 'clients.steps.paymentMethods' },
];

const ClientCreateModal: React.FC<ClientCreateModalProps> = ({
    open,
    onOpenChange,
    onClientCreated,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    const [sections, setSections] = useState<any[]>([]);

    const [createdClientId, setCreatedClientId] = useState<string | undefined>(undefined);
    const [currentStep, setCurrentStep] = useState<WizardStep>('basic');
    const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(new Set());

    const [stakeholders, setStakeholders] = useState<ClientStakeholder[]>([]);
    const [loadingStakeholders, setLoadingStakeholders] = useState(false);
    const [isStakeholderModalOpen, setIsStakeholderModalOpen] = useState(false);

    const [contacts, setContacts] = useState<ClientContact[]>([]);
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);

    const [paymentMethods, setPaymentMethods] = useState<ClientPaymentMethod[]>([]);
    const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
    const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formInputSchema),
        defaultValues: {
            trade_name: '',
            client_name: '',
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

    // Helper function to populate form with client data

    const _populateFormWithClientData = (clientData: Client) => {
        console.log('clientData', clientData);
        // Reset form with basic data first
        form.reset({
            trade_name: clientData.trade_name || '',
            client_name: clientData.client_name || '',
            tax_code: clientData.tax_code || '',
            tax_code_type: clientData.tax_code_type || 'es_cif',
            email: clientData.email || '',
            phone: clientData.phone || '',
            address_line_1: clientData.address_line_1 || '',
            address_line_2: clientData.address_line_2 || '',
            postal_code: clientData.postal_code || '',
            city: clientData.city || '',
            state_province: clientData.state_province || '',
            country: clientData.country || '',
            url: clientData.url || '',
            notes: clientData.notes || '',
            // Financial fields
            risk: clientData.risk?.toString() || '',
            is_covered_risk: clientData.is_covered_risk || false,
            default_due_days: clientData.default_due_days?.toString() || '',
            default_payment_day: clientData.default_payment_day?.toString() || '',
            language: clientData.language || 'ca',
            currency: clientData.currency || 'EUR',
            custom_fields: {},
        });

        clientData.sections?.forEach((section) => {
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
                        // Check if value is a string that can't be parsed as integer
                        if (typeof value === 'string' && isNaN(parseInt(value))) {
                            errors[fieldName] = `${field.name} must be a valid integer`;
                            isValid = false;
                        } else if (typeof value === 'number' && !Number.isInteger(value)) {
                            errors[fieldName] = `${field.name} must be a valid integer`;
                            isValid = false;
                        }
                        break;
                    case 'float':
                        // Check if value is a string that can't be parsed as float
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

            console.log(`Creating client data:`, finalPayload);

            let response = await postClient(orgId, finalPayload);


            if (response.success) {
                const successMessage = t('clients.clientCreatedSuccess', 'Client created successfully');
                toast.success(successMessage);
                const clientId = (response.success as any)?.client?.id ?? (response.success as any)?.client_id;
                if (clientId) {
                    setCreatedClientId(clientId);
                    setCurrentStep('stakeholders');
                } else {
                    form.reset();
                    onOpenChange(false);
                    onClientCreated?.();
                }
            } else {
                const errorMessage = t('clients.postClientError', 'Failed to create client');
                toast.error(response.error || errorMessage);
            }
        } catch (error) {
            console.error('Error creating client:', error);
            const errorMessage = t('clients.postClientError', 'Failed to create client');
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = async (open: boolean) => {
        if (!open) await handleClose();
        else onOpenChange(true);
    };

    const handleInteractOutside = (e: Event) => {
        if (createdClientId) return;
        if (form.formState.isDirty) {
            e.preventDefault();
            handleOpenChange(false);
        }
    };

    const fetchSections = async () => {
        const response = await getOrgSections(orgId || "", "Clients");
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
            setCreatedClientId(undefined);
            setCurrentStep('basic');
            setCompletedSteps(new Set());
            setStakeholders([]);
            setContacts([]);
            setPaymentMethods([]);
        }
    }, [open, form]);

    const fetchStakeholders = useCallback(async () => {
        if (!orgId || !createdClientId) return;
        setLoadingStakeholders(true);
        try {
            const response = await getClientStakeholders(orgId, createdClientId);
            if (response.success?.stakeholders) setStakeholders(response.success.stakeholders);
            else setStakeholders([]);
        } catch {
            setStakeholders([]);
        } finally {
            setLoadingStakeholders(false);
        }
    }, [orgId, createdClientId]);

    const fetchContacts = useCallback(async () => {
        if (!orgId || !createdClientId) return;
        setLoadingContacts(true);
        try {
            const response = await getClientContacts(orgId, createdClientId, undefined);
            if (response.success?.contacts) setContacts(response.success.contacts);
            else setContacts([]);
        } catch {
            setContacts([]);
        } finally {
            setLoadingContacts(false);
        }
    }, [orgId, createdClientId]);

    const fetchPaymentMethodsList = useCallback(async () => {
        if (!orgId || !createdClientId) return;
        setLoadingPaymentMethods(true);
        try {
            const response = await getPaymentsMethods(orgId, createdClientId, null);
            if (response.success?.payment_methods) setPaymentMethods(response.success.payment_methods);
            else setPaymentMethods([]);
        } catch {
            setPaymentMethods([]);
        } finally {
            setLoadingPaymentMethods(false);
        }
    }, [orgId, createdClientId]);

    useEffect(() => {
        if (currentStep === 'stakeholders' && createdClientId) fetchStakeholders();
    }, [currentStep, createdClientId, fetchStakeholders]);

    useEffect(() => {
        if (currentStep === 'contacts' && createdClientId) fetchContacts();
    }, [currentStep, createdClientId, fetchContacts]);

    useEffect(() => {
        if (currentStep === 'paymentMethods' && createdClientId) fetchPaymentMethodsList();
    }, [currentStep, createdClientId, fetchPaymentMethodsList]);

    const handleClose = async () => {
        if (createdClientId) {
            onClientCreated?.();
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
        onClientCreated?.();
        form.reset();
        onOpenChange(false);
        if (orgId && createdClientId) navigate(`/${orgId}/clients/${createdClientId}`);
    };

    const getCurrentStepIndex = () => STEPS.findIndex((s) => s.id === currentStep);
    const isLastStep = () => getCurrentStepIndex() === STEPS.length - 1;
    const isFirstStep = () => getCurrentStepIndex() === 0;
    const canGoNext = () => !!createdClientId;

    const hasCurrentStepInput = () => {
        switch (currentStep) {
            case 'stakeholders': return stakeholders.length > 0;
            case 'contacts': return contacts.length > 0;
            case 'paymentMethods': return paymentMethods.length > 0;
            default: return false;
        }
    };

    const handleSkipAll = () => { handleFinish(); };

    const isBasicStepLocked = !!createdClientId;
    const formDisabled = isLoading || isBasicStepLocked;


    return (
        <Dialog open={open} onOpenChange={handleOpenChange} >
            <DialogContent
                className="max-w-3xl md:min-w-3xl"
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
                showCloseButton={false}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold mb-4">
                        {t('clients.createNewClient', 'Create New Client')}
                    </DialogTitle>
                </DialogHeader>

                {/* Step Indicator */}
                <div className="flex items-center justify-between gap-2 px-2 py-2">
                    {STEPS.map((step, index) => {
                        const isCompleted = completedSteps.has(step.id);
                        const isCurrent = step.id === currentStep;
                        const isAccessible = index === 0 || createdClientId != null;
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
                                                    {t('clients.tradeName', 'Trade Name')} *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder={t('clients.enterTradeName', 'Trade name')}
                                                        {...field}
                                                        disabled={formDisabled}
                                                        autoFocus
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    {t('clients.tradeNameDescription', 'The business or trading name of the client.')}
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />


                                    <TaxCodeInput
                                        form={form}
                                        name="tax_code"
                                        taxCodeTypeName="tax_code_type"
                                        label={t('clients.taxCode', 'Tax Code')}
                                        placeholder={t('clients.enterTaxCode', 'Tax code')}
                                        disabled={formDisabled}
                                    />
                                </div>

                                <Tabs defaultValue="basic">
                                    <TabsList className="w-full justify-start border-b-2 border-border bg-background mb-4" activeClassName='border-b-2 border-primary -mb-1.5'>
                                        <TabsTrigger className="py-0" value="basic">{t('clients.basicInformation', 'Basic')}</TabsTrigger>
                                        <TabsTrigger className="py-0" value="financials">{t('clients.financialInformation', 'Financial')}</TabsTrigger>
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
                                                                    {t('clients.addressLine1', 'Address')}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder={t('clients.enterAddressLine1', 'Street address')}
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
                                                                    {t('clients.addressLine2', 'Address Line 2')}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder={t('clients.enterAddressLine2', 'Apartment, suite, etc.')}
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
                                                                    {t('clients.city', 'City')}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder={t('clients.enterCity', 'City')}
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
                                                                    {t('clients.postalCode', 'Postal Code')}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder={t('clients.enterPostalCode', 'Postal code')}
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
                                                                    {t('clients.stateProvince', 'State/Province')}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder={t('clients.enterStateProvince', 'State or province')}
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
                                                        label={t('clients.country', 'Country')}
                                                        defaultValue={'ES'}
                                                    />
                                                </div>
                                                <div className="col-span-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">
                                                    <FormField
                                                        control={form.control}
                                                        name="client_name"
                                                        render={({ field }) => (
                                                            <FormItem className="col-span-2">
                                                                <FormLabel>
                                                                    {t('clients.clientName', 'Comercial Name')}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder={t('clients.enterClientName', 'Comercial name')}
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
                                                                    {t('clients.email', 'Email')}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="email"
                                                                        placeholder={t('clients.enterEmail', 'example@example.com')}
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
                                                            label={t('clients.phone', 'Phone')}
                                                            placeholder={t('clients.enterPhone', 'Phone number')}
                                                            disabled={formDisabled}
                                                        />
                                                    </div>

                                                    <FormField
                                                        control={form.control}
                                                        name="url"
                                                        render={({ field }) => (
                                                            <FormItem className="col-span-2">
                                                                <FormLabel>
                                                                    {t('clients.website', 'Website')}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="url"
                                                                        placeholder={t('clients.enterWebsite', 'Website URL')}
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
                                                                {t('clients.notes', 'Notes')}
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Textarea placeholder={t('clients.enterNotes', 'Notes')} {...field} disabled={formDisabled} />
                                                            </FormControl>
                                                            <FormDescription>
                                                                {t('clients.notesDescription', 'Notes about the client')}
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
                                                        <h3 className="text-sm font-bold mb-4 text-muted-foreground border-b border-border pb-2 flex-1">{t('clients.customFields', 'Custom Fields')}</h3>
                                                        <Button variant="ghost" size="icon" onClick={() => navigate(`/${orgId}/admin/fields/clients`)}>
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
                                                                    {t('clients.risk', 'Risk')}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        placeholder={t('clients.enterRisk', 'Risk quantity')}
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
                                                                        {t('clients.isCoveredRisk', 'Risk is Covered')}
                                                                    </FormLabel>
                                                                    <FormDescription>
                                                                        {t('clients.isCoveredRiskDescription', 'Check if this client\'s risk is covered by insurance or guarantees')}
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
                                                                    {t('clients.defaultDueDays', 'Default Due Days')}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        max="365"
                                                                        placeholder={t('clients.enterDefaultDueDays', 'Number of days')}
                                                                        {...field}
                                                                        disabled={formDisabled}
                                                                    />
                                                                </FormControl>
                                                                <FormDescription>
                                                                    {t('clients.defaultDueDaysDescription', 'Default number of days for payment due dates')}
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
                                                                    {t('clients.defaultPaymentDay', 'Default Payment Day')}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        min="1"
                                                                        max="31"
                                                                        placeholder={t('clients.enterDefaultPaymentDay', 'Day of month (1-31)')}
                                                                        {...field}
                                                                        disabled={formDisabled}
                                                                    />
                                                                </FormControl>
                                                                <FormDescription>
                                                                    {t('clients.defaultPaymentDayDescription', 'Default day of the month for payments')}
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
                                                                    {t('clients.language', 'Preferred Language')}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={formDisabled}>
                                                                        <SelectTrigger className="w-full">
                                                                            <SelectValue placeholder={t('clients.selectLanguage', 'Select a language')} />
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
                                                                    {t('clients.currency', 'Preferred Currency')}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={formDisabled}>
                                                                        <SelectTrigger className="w-full"   >
                                                                            <SelectValue placeholder={t('clients.selectCurrency', 'Select a currency')} />
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
                                                            <h3 className="text-sm font-bold mb-4 text-muted-foreground border-b border-border pb-2 flex-1">{t('clients.customFields', 'Custom Fields')}</h3>
                                                            <Button variant="ghost" size="icon" onClick={() => navigate(`/${orgId}/admin/fields/clients`)}>
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
                                                                <h3 className="text-sm font-bold mb-4 text-muted-foreground border-b border-border pb-2 flex-1">{t('clients.customFields', 'Custom Fields')}</h3>
                                                                <Button variant="ghost" size="icon" onClick={() => navigate(`/${orgId}/admin/fields/clients`)}>
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
                                                                {t('clients.noFieldsInSection', 'No fields configured for this section yet.')}
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

                    {currentStep === 'stakeholders' && createdClientId && orgId && (
                        <div className="space-y-4 py-2">
                            <Card className="shadow-none">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 justify-between">
                                        {t('clients.stakeholders', 'Stakeholders')}
                                        <Button onClick={() => setIsStakeholderModalOpen(true)} size="sm" variant="outline">
                                            <Plus className="h-4 w-4" />
                                            {t('clients.addStakeholder', 'Add')}
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="py-0 px-4">
                                    {loadingStakeholders ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : stakeholders.length === 0 ? (
                                        <div className="text-center py-4">
                                            <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                            <p className="text-sm text-muted-foreground">{t('clients.noStakeholders', 'No stakeholders yet')}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-0">
                                            {stakeholders.map((s, index) => (
                                                <div key={s.id}>
                                                    <div className="py-2 flex items-center gap-2 text-sm">
                                                        <span className="font-medium">{s.role || '-'}</span>
                                                        {s.employee && <span className="text-muted-foreground">{s.employee.first_name} {s.employee.last_name}</span>}
                                                    </div>
                                                    {index < stakeholders.length - 1 && <Separator />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            <StakeholderModal
                                open={isStakeholderModalOpen}
                                onOpenChange={setIsStakeholderModalOpen}
                                onStakeholderSaved={() => { fetchStakeholders(); setIsStakeholderModalOpen(false); }}
                                clientId={createdClientId}
                            />
                        </div>
                    )}

                    {currentStep === 'contacts' && createdClientId && orgId && (
                        <div className="space-y-4 py-2">
                            <Card className="shadow-none">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 justify-between">
                                        {t('clients.contacts', 'Contacts')}
                                        <Button onClick={() => setIsContactModalOpen(true)} size="sm" variant="outline">
                                            <Plus className="h-4 w-4" />
                                            {t('clients.addContact', 'Add')}
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
                                            <p className="text-sm text-muted-foreground">{t('clients.noContacts', 'No contacts yet')}</p>
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
                                clientId={createdClientId}
                            />
                        </div>
                    )}

                    {currentStep === 'paymentMethods' && createdClientId && orgId && (
                        <div className="space-y-4 py-2">
                            <Card className="shadow-none">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 justify-between">
                                        {t('clients.paymentMethods', 'Payment Methods')}
                                        <Button onClick={() => setIsPaymentMethodModalOpen(true)} size="sm" variant="outline">
                                            <Plus className="h-4 w-4" />
                                            {t('clients.addPaymentMethod', 'Add')}
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
                                            <p className="text-sm text-muted-foreground">{t('clients.noPaymentMethods', 'No payment methods yet')}</p>
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
                                clientId={createdClientId}
                                orgId={orgId}
                                mode="create"
                            />
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 fixed bottom-0 left-0 right-0 bg-background p-4 rounded-b-lg">
                    <div className="flex gap-2">
                        {!isFirstStep() && currentStep !== 'stakeholders' && (
                            <Button type="button" variant="outline" onClick={handlePrevious} disabled={isLoading}>
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                {t('common.previous', 'Previous')}
                            </Button>
                        )}
                    </div>
                    <div className="flex-1" />
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
                            {createdClientId ? t('common.close', 'Close') : t('common.cancel', 'Cancel')}
                        </Button>
                        {currentStep === 'basic' && !createdClientId && (
                            <Button type="submit" onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {t('clients.creatingClient', 'Creating Client...')}
                                    </>
                                ) : (
                                    t('clients.createClient', 'Create Client')
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

export default ClientCreateModal;
