import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Settings, ChevronLeft, ChevronRight, Check, Plus, SquarePen, Trash2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { postEmployee } from '@/api/employees/employees';
import { Employee, EmployeeEmergencyContact, EmployeePaymentMethod } from '@/types/employees/employees';
import Tag from '@/app/components/tag/tag';
import { Badge } from '@/components/ui/badge';
import { getEmployeeEmergencyContacts } from '@/api/employees/emergency-contacts/emergency-contacts';
import { getEmployeePaymentsMethods } from '@/api/employees/payments-methods/payments-methods';
import { getEmployeeSkills, deleteEmployeeSkill } from '@/api/employees/skills/skills';
import EmployeeEmergencyContactEditModal from '@/app/employees/EmployeeDetailPage/pages/EmployeeDetailPageSummary/components/employee-emergency-contact-edit-modal';
import EmployeePaymentMethodModal from '@/app/employees/EmployeeDetailPage/pages/EmployeeDetailPageSummary/components/employee-payment-method-modal';
import EmployeeSkillsAddModal from '@/app/employees/EmployeeDetailPage/pages/EmployeeDetailPageSummary/components/employee-skills-add-modal';
import EmployeeSkillEditModal from '@/app/employees/EmployeeDetailPage/pages/EmployeeDetailPageSummary/components/employee-skill-edit-modal';
import { Skill } from '@/types/general/skills';
import { getSkillDescriptionForLevel } from '@/utils/skills';
import StarsLabel from '@/app/components/labels/stars-label';
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
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from '@/components/ui/shadcn-io/tabs';
import { PhoneInput } from '@/app/components/forms-elements/phone-input';
import CountriesInput from '@/app/components/forms-elements/countries-input';
import { DateTimePicker } from '@/app/components/forms-elements/date-time-picker';
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';
import { getOrgSections } from '@/api/orgs/sections/sections';
import CustomFieldsSection from '@/app/components/custom-fields-section';
import { Textarea } from '@/components/ui/textarea';
import { MultiSelectApi } from '@/app/components/forms-elements/multi-select-api';
import { MultiSelectApiHierarchy } from '@/app/components/forms-elements/multi-select-api-hierarchy';
import { MultiSelect } from '@/app/components/forms-elements/multi-select';
import { getOrgJobTitles } from '@/api/orgs/job-titles/job-titles';
import { getWorkplaces } from '@/api/orgs/workplaces/workplaces';
import WorkplaceLabel from '@/app/components/labels/workplace-label';
import { Workplace } from '@/types/general/workplaces';
import { getAbsencePolicies } from '@/api/orgs/absences/absences';
import { getTimePolicies } from '@/api/orgs/time-policies/time-policies';
import { getOrgEmployees } from '@/api/employees/employees';
import { getOrgGroups } from '@/api/orgs/groups/groups';
import { formatDateForAPI } from '@/utils/miscelanea';
import { DynamicIcon } from 'lucide-react/dynamic';
import { EmployeeAvatar } from '@/app/components/avatars/employee-avatar';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Users, CreditCard, Hexagon } from 'lucide-react';

interface EmployeeCreateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEmployeeCreated?: () => void;
    /** Render custom action buttons in the header (right side, next to ID badge). Receives the employee and a close function. */
    renderActions?: (employee: Employee, closeModal: () => void) => React.ReactNode;
}

// Form input schema
const formInputSchema = z.object({
    first_name: z
        .string()
        .min(1, 'First name is required')
        .min(2, 'First name must be at least 2 characters')
        .max(100, 'First name must be less than 100 characters')
        .trim(),
    last_name: z
        .string()
        .min(1, 'Last name is required')
        .min(2, 'Last name must be at least 2 characters')
        .max(100, 'Last name must be less than 100 characters')
        .trim(),
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address')
        .trim(),
    national_id_number: z
        .string()
        .min(1, 'ID is required')
        .max(50, 'ID must be less than 50 characters')
        .optional(),
    tax_id_number: z
        .string()
        .max(50, 'Tax ID must be less than 50 characters')
        .optional(),
    phone: z
        .string()
        .optional(),
    date_of_birth: z
        .date()
        .optional()
        .nullable(),
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
    notes: z
        .string()
        .max(500, 'Notes must be less than 500 characters')
        .optional(),
    // HR fields
    status: z.array(z.string()).optional(),
    job_title_id: z.array(z.string()).optional(),
    org_user_workplace_id: z.array(z.string()).optional(),
    org_absence_policy_id: z.array(z.string()).optional(),
    org_time_policy_id: z.array(z.string()).optional(),
    reporting_to_ids: z.array(z.string()).optional(),
    reporting_absence_to_ids: z.array(z.string()).optional(),
    groups_ids: z.array(z.string()).optional(),
    custom_fields: z.record(z.string(), z.any()).optional(),
});

type FormValues = z.infer<typeof formInputSchema>;

// Wizard steps (basic = create form; then optional additional info). No financials (contracts/payrolls) in this modal.
type WizardStep = 'basic' | 'emergencyContacts' | 'paymentMethods' | 'skills';

const STEPS: { id: WizardStep; label: string; translationKey: string }[] = [
    { id: 'basic', label: 'Basic Info', translationKey: 'employees.steps.basicInfo' },
    { id: 'emergencyContacts', label: 'Emergency Contacts', translationKey: 'employees.steps.emergencyContacts' },
    { id: 'paymentMethods', label: 'Payment Methods', translationKey: 'employees.steps.paymentMethods' },
    { id: 'skills', label: 'Skills', translationKey: 'employees.steps.skills' },
];

const EmployeeCreateModal: React.FC<EmployeeCreateModalProps> = ({
    open,
    onOpenChange,
    onEmployeeCreated,
    renderActions: _renderActions,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    const [sections, setSections] = useState<any[]>([]);

    // Wizard state
    const [createdEmployeeId, setCreatedEmployeeId] = useState<string | undefined>(undefined);
    const [currentStep, setCurrentStep] = useState<WizardStep>('basic');
    const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(new Set());

    // Emergency contacts step
    const [emergencyContacts, setEmergencyContacts] = useState<EmployeeEmergencyContact[]>([]);
    const [loadingEmergencyContacts, setLoadingEmergencyContacts] = useState(false);
    const [isEmergencyContactModalOpen, setIsEmergencyContactModalOpen] = useState(false);

    // Payment methods step
    const [paymentMethods, setPaymentMethods] = useState<EmployeePaymentMethod[]>([]);
    const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
    const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);

    // Skills step
    const [skills, setSkills] = useState<Skill[]>([]);
    const [loadingSkills, setLoadingSkills] = useState(false);
    const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
    const [isSkillEditModalOpen, setIsSkillEditModalOpen] = useState(false);
    const [skillToEdit, setSkillToEdit] = useState<Skill | null>(null);


    const form = useForm<FormValues>({
        resolver: zodResolver(formInputSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
            email: '',
            national_id_number: '',
            tax_id_number: '',
            phone: '',
            date_of_birth: undefined,
            address_line_1: '',
            address_line_2: '',
            postal_code: '',
            city: '',
            state_province: '',
            country: '',
            notes: '',
            status: [],
            job_title_id: [],
            org_user_workplace_id: [],
            org_absence_policy_id: [],
            org_time_policy_id: [],
            reporting_to_ids: [],
            reporting_absence_to_ids: [],
            groups_ids: [],
            custom_fields: {},
        },
    });

    // Function to validate custom fields
    const validateCustomFields = (customFields: Record<string, any> = {}, allSections: any[]): { isValid: boolean; errors: Record<string, string> } => {
        const errors: Record<string, string> = {};
        let isValid = true;

        const allFields = allSections.flatMap(section => section.fields || []);

        allFields.forEach((field: any) => {
            if (!field.is_shown_by_default) return;

            const fieldName = `custom_fields.${field.id}`;
            const value = customFields[field.id];
            const isRequired = !field.is_nullable;

            if (isRequired) {
                if (value === undefined || value === null || value === '' ||
                    (Array.isArray(value) && value.length === 0)) {
                    errors[fieldName] = `${field.name} is required`;
                    isValid = false;
                }
            }

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
            Object.entries(customFieldsValidation.errors).forEach(([fieldName, error]) => {
                form.setError(fieldName as any, { type: 'manual', message: error });
            });
            toast.error('Please fix the errors in custom fields before submitting');
            return;
        }

        setIsLoading(true);
        try {
            const { custom_fields, ...regularFields } = values;

            // Convert array fields to single values or null for single-select fields
            const processedFields: any = { ...regularFields };
            processedFields.status = values.status && values.status.length > 0 ? values.status[0] : null;
            processedFields.job_title_id = values.job_title_id && values.job_title_id.length > 0 ? values.job_title_id[0] : null;
            processedFields.org_user_workplace_id = values.org_user_workplace_id && values.org_user_workplace_id.length > 0 ? values.org_user_workplace_id[0] : null;
            processedFields.org_absence_policy_id = values.org_absence_policy_id && values.org_absence_policy_id.length > 0 ? values.org_absence_policy_id[0] : null;
            processedFields.org_time_policy_id = values.org_time_policy_id && values.org_time_policy_id.length > 0 ? values.org_time_policy_id[0] : null;
            processedFields.reporting_to_id = values.reporting_to_ids && values.reporting_to_ids.length > 0 ? values.reporting_to_ids[0] : null;
            processedFields.reporting_absence_to_ids = values.reporting_absence_to_ids && values.reporting_absence_to_ids.length > 0 ? values.reporting_absence_to_ids : [];
            processedFields.groups_ids = values.groups_ids && values.groups_ids.length > 0 ? values.groups_ids : [];

            // Convert date_of_birth to YYYY-MM-DD format using local date components to avoid timezone issues
            if (processedFields.date_of_birth instanceof Date) {
                processedFields.date_of_birth = formatDateForAPI(processedFields.date_of_birth);
            }

            // Prepare custom fields for submission
            let fieldsPayload = {};
            if (custom_fields && Object.keys(custom_fields).length > 0) {
                fieldsPayload = Object.fromEntries(
                    Object.entries(custom_fields).filter(([_, value]) => {
                        if (value === null || value === undefined || value === '') return false;
                        if (Array.isArray(value)) return value.length > 0;
                        if (typeof value === 'boolean') return true;
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

            console.log(`Creating employee data:`, finalPayload);

            let response;
            response = await postEmployee(orgId, finalPayload);

            if (response.success) {
                const successMessage = t('employees.employeeCreatedSuccess', 'Employee created successfully');
                toast.success(successMessage);
                const employeeId = (response.success as any)?.employee?.id ?? (response.success as any)?.employee_id;
                if (employeeId) {
                    setCreatedEmployeeId(employeeId);
                    setCurrentStep('emergencyContacts');
                } else {
                    form.reset();
                    onOpenChange(false);
                    onEmployeeCreated?.();
                }
            } else {
                const errorMessage = t('employees.postEmployeeError', 'Failed to create employee');
                toast.error(response.error || errorMessage);
            }
        } catch (error) {
            console.error(`Error creating employee:`, error);
            const errorMessage = t('employees.postEmployeeError', 'Failed to create employee');
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = async (open: boolean) => {
        if (!open) {
            await handleClose();
        } else {
            onOpenChange(true);
        }
    };

    const handleInteractOutside = (e: Event) => {
        if (createdEmployeeId) return;
        if (form.formState.isDirty) {
            e.preventDefault();
            handleOpenChange(false);
        }
    };

    const fetchSections = async () => {
        const response = await getOrgSections(orgId || "", "Employees");
        if (response.success) {
            setSections(response.success.sections);
        }
    };

    // Helper functions to filter sections
    const getBasicSection = () => sections.find(section => section.handler === 'basic');
    const getHRSection = () => sections.find(section => section.handler === 'hr');
    const getOtherSections = () => sections.filter(section =>
        section.handler !== 'basic' && section.handler !== 'hr'
    );

    // Reset form and wizard state when modal opens
    useEffect(() => {
        if (open) {
            fetchSections();
            form.reset();
            setCreatedEmployeeId(undefined);
            setCurrentStep('basic');
            setCompletedSteps(new Set());
            setEmergencyContacts([]);
            setPaymentMethods([]);
            setSkills([]);
        }
    }, [open, form]);

    // Fetch data for optional steps when entering step and we have createdEmployeeId
    const fetchEmergencyContacts = useCallback(async () => {
        if (!orgId || !createdEmployeeId) return;
        setLoadingEmergencyContacts(true);
        try {
            const response = await getEmployeeEmergencyContacts(orgId, createdEmployeeId, null);
            if (response.success?.emergency_contacts) {
                setEmergencyContacts(response.success.emergency_contacts);
            }
        } catch {
            setEmergencyContacts([]);
        } finally {
            setLoadingEmergencyContacts(false);
        }
    }, [orgId, createdEmployeeId]);

    const fetchPaymentMethods = useCallback(async () => {
        if (!orgId || !createdEmployeeId) return;
        setLoadingPaymentMethods(true);
        try {
            const response = await getEmployeePaymentsMethods(orgId, createdEmployeeId, null);
            if (response.success?.payment_methods) {
                setPaymentMethods(response.success.payment_methods);
            }
        } catch {
            setPaymentMethods([]);
        } finally {
            setLoadingPaymentMethods(false);
        }
    }, [orgId, createdEmployeeId]);

    const fetchSkills = useCallback(async () => {
        if (!orgId || !createdEmployeeId) return;
        setLoadingSkills(true);
        try {
            const response = await getEmployeeSkills(orgId, createdEmployeeId);
            if (response.success?.skills) {
                setSkills(response.success.skills as Skill[]);
            }
        } catch {
            setSkills([]);
        } finally {
            setLoadingSkills(false);
        }
    }, [orgId, createdEmployeeId]);

    const handleDeleteSkill = async (skillId: string) => {
        if (!orgId || !createdEmployeeId) return;
        try {
            const response = await deleteEmployeeSkill(orgId, createdEmployeeId, { skills: [skillId] });
            if (response.success) {
                toast.success(t('employees.skillDeletedSuccessfully', 'Skill deleted successfully'));
                fetchSkills();
            } else if (response.error) {
                toast.error(response.error.message || t('employees.errorDeletingSkill', 'Error deleting skill'));
            }
        } catch {
            toast.error(t('employees.errorDeletingSkill', 'Error deleting skill'));
        }
    };

    useEffect(() => {
        if (currentStep === 'emergencyContacts' && createdEmployeeId) fetchEmergencyContacts();
    }, [currentStep, createdEmployeeId, fetchEmergencyContacts]);

    useEffect(() => {
        if (currentStep === 'paymentMethods' && createdEmployeeId) fetchPaymentMethods();
    }, [currentStep, createdEmployeeId, fetchPaymentMethods]);

    useEffect(() => {
        if (currentStep === 'skills' && createdEmployeeId) fetchSkills();
    }, [currentStep, createdEmployeeId, fetchSkills]);

    const handleClose = async () => {
        if (createdEmployeeId) {
            onEmployeeCreated?.();
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
        // Do not go back to first step (basic); from 2nd step (emergencyContacts) we don't show Previous at all
        if (idx > 1) setCurrentStep(STEPS[idx - 1].id);
    };

    const handleFinish = () => {
        onEmployeeCreated?.();
        form.reset();
        onOpenChange(false);
        if (orgId && createdEmployeeId) {
            navigate(`/${orgId}/employees/${createdEmployeeId}`);
        }
    };

    const getCurrentStepIndex = () => STEPS.findIndex((s) => s.id === currentStep);
    const isLastStep = () => getCurrentStepIndex() === STEPS.length - 1;
    const isFirstStep = () => getCurrentStepIndex() === 0;
    const canGoNext = () => !!createdEmployeeId;

    const hasCurrentStepInput = () => {
        switch (currentStep) {
            case 'emergencyContacts':
                return emergencyContacts.length > 0;
            case 'paymentMethods':
                return paymentMethods.length > 0;
            case 'skills':
                return skills.length > 0;
            default:
                return false;
        }
    };

    const handleSkipAll = () => {
        handleFinish();
    };

    /** When true, basic step form is read-only (employee already created and step was revisited). */
    const isBasicStepLocked = !!createdEmployeeId;
    const formDisabled = isLoading || isBasicStepLocked;

    const dialogTitle = t('employees.createEmployee', 'Create Employee');

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="max-w-3xl md:min-w-3xl"
                showCloseButton={false}
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold mb-4">
                        <span>{dialogTitle}</span>
                    </DialogTitle>
                </DialogHeader>

                {/* Step Indicator */}
                <div className="flex items-center justify-between gap-2 px-2 py-2">
                    {STEPS.map((step, index) => {
                        const isCompleted = completedSteps.has(step.id);
                        const isCurrent = step.id === currentStep;
                        const isAccessible = index === 0 || createdEmployeeId != null;

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
                                    <div
                                        className={cn(
                                            'w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs',
                                            isCurrent && 'bg-primary text-primary-foreground',
                                            isCompleted && !isCurrent && 'bg-primary/20 text-primary',
                                            !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                                        )}
                                    >
                                        {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
                                    </div>
                                    <span className="hidden sm:inline">{t(step.translationKey, step.label)}</span>
                                </button>
                                {index < STEPS.length - 1 && (
                                    <div
                                        className={cn(
                                            'h-[2px] flex-1 mx-1',
                                            isCompleted ? 'bg-primary/50' : 'bg-muted'
                                        )}
                                    />
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
                                        name="first_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    {t('employees.firstName', 'First Name')} *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder={t('employees.enterFirstName', 'First name')}
                                                        {...field}
                                                        disabled={formDisabled}
                                                        autoFocus
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="last_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    {t('employees.lastName', 'Last Name')} *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder={t('employees.enterLastName', 'Last name')}
                                                        {...field}
                                                        disabled={formDisabled}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <Tabs defaultValue="basic">
                                    <TabsList className="w-full justify-start border-b-2 border-border bg-background mb-4" activeClassName='border-b-2 border-primary -mb-1.5'>
                                        <TabsTrigger className="py-0" value="basic">{t('employees.basicInformation', 'Basic')}</TabsTrigger>
                                        <TabsTrigger className="py-0" value="hr">{t('employees.hrInformation', 'HR Info.')}</TabsTrigger>
                                        {getOtherSections().map((section) => (
                                            <TabsTrigger key={section.id} className="py-0" value={section.id}>
                                                {section.title}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>

                                    <TabsContents className='p-1'>
                                        <TabsContent value="basic">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">
                                                <div className="col-span-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">
                                                    <FormField
                                                        control={form.control}
                                                        name="address_line_1"
                                                        render={({ field }) => (
                                                            <FormItem className="col-span-2">
                                                                <FormLabel>
                                                                    {t('employees.addressLine1', 'Address')}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder={t('employees.enterAddressLine1', 'Street address')}
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
                                                                    {t('employees.addressLine2', 'Address Line 2')}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder={t('employees.enterAddressLine2', 'Apartment, suite, etc.')}
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
                                                                    {t('employees.city', 'City')}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder={t('employees.enterCity', 'City')}
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
                                                                    {t('employees.postalCode', 'Postal Code')}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder={t('employees.enterPostalCode', 'Postal code')}
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
                                                                    {t('employees.stateProvince', 'State/Province')}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder={t('employees.enterStateProvince', 'State or province')}
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
                                                        label={t('employees.country', 'Country')}
                                                        defaultValue={'ES'}
                                                    />
                                                </div>

                                                <div className="col-span-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">
                                                    <FormField
                                                        control={form.control}
                                                        name="national_id_number"
                                                        render={({ field }) => (
                                                            <FormItem className="col-span-2">
                                                                <FormLabel>
                                                                    {t('employees.nationalIdNumber', 'DNI / Passport Number')} *
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder={t('employees.enterNationalIdNumber', 'DNI / Passport Number')}
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
                                                        name="tax_id_number"
                                                        render={({ field }) => (
                                                            <FormItem className="col-span-2">
                                                                <FormLabel>
                                                                    {t('employees.taxIdNumber', 'S.S. Number')}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder={t('employees.enterTaxIdNumber', 'Social Security Number')}
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
                                                                    {t('employees.email', 'Email')} *
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="email"
                                                                        placeholder={t('employees.enterEmail', 'example@example.com')}
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
                                                            label={t('employees.phone', 'Phone')}
                                                            placeholder={t('employees.enterPhone', 'Phone number')}
                                                            disabled={formDisabled}
                                                        />
                                                    </div>

                                                    <div className="col-span-2">
                                                        <DateTimePicker
                                                            form={form}
                                                            name="date_of_birth"
                                                            showMonthYearPicker={true}
                                                            label={t('employees.dateOfBirth', 'Date of Birth')}
                                                            placeholder={t('employees.enterDateOfBirth', 'Select date of birth')}
                                                            disabled={formDisabled}
                                                            showTime={false}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Notes Section */}
                                                <FormField
                                                    control={form.control}
                                                    name="notes"
                                                    render={({ field }) => (
                                                        <FormItem className="col-span-2">
                                                            <FormLabel>
                                                                {t('employees.notes', 'Notes')}
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Textarea
                                                                    placeholder={t('employees.enterNotes', 'Notes')}
                                                                    {...field}
                                                                    disabled={formDisabled}
                                                                />
                                                            </FormControl>
                                                            <FormDescription>
                                                                {t('employees.notesDescription', 'Notes about the employee')}
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
                                                        <h3 className="text-sm font-bold mb-4 text-muted-foreground border-b border-border pb-2 flex-1">
                                                            {t('employees.customFields', 'Custom Fields')}
                                                        </h3>
                                                        <Button variant="ghost" size="icon" onClick={() => navigate(`/${orgId}/admin/fields/employees`)}>
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

                                        <TabsContent value="hr">
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                                    <FormField
                                                        control={form.control}
                                                        name="status"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    {t('employees.status', 'Status')}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <MultiSelect
                                                                        options={[
                                                                            {
                                                                                value: 'active',
                                                                                label: <Tag text={t('employees.statusActive', 'Active')} color="green" />
                                                                            },
                                                                            {
                                                                                value: 'inactive',
                                                                                label: <Tag text={t('employees.statusInactive', 'Inactive')} color="gray" />
                                                                            },
                                                                        ]}
                                                                        selected={field.value || []}
                                                                        onSelectedChange={field.onChange}
                                                                        placeholder={t('employees.selectStatus', 'Select status')}
                                                                        searchPlaceholder={t('employees.searchStatus', 'Search status...')}
                                                                        emptyText={t('employees.noStatus', 'No status found.')}
                                                                        disabled={formDisabled}
                                                                        maxCount={1}
                                                                        searchable={false}
                                                                        className="w-full truncate"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="job_title_id"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    {t('employees.jobTitle', 'Job Title')}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <MultiSelectApi
                                                                        fetchOptions={getOrgJobTitles}
                                                                        fetchArgs={[orgId || ""]}
                                                                        optionsKey="job_titles"
                                                                        customValueKey={(item) => item.id}
                                                                        customLabelKey={(item) =>
                                                                            <Tag text={item.name} />
                                                                        }
                                                                        placeholder={t('employees.selectJobTitle', 'Select job title')}
                                                                        searchPlaceholder={t('employees.searchJobTitle', 'Search job titles...')}
                                                                        emptyText={t('employees.noJobTitles', 'No job titles found.')}
                                                                        disabled={formDisabled}
                                                                        value={field.value || []}
                                                                        onChangeValue={field.onChange}
                                                                        maxCount={1}
                                                                        className="w-full truncate"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="org_user_workplace_id"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    {t('employees.workplace', 'Workplace')}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <MultiSelectApi
                                                                        fetchOptions={getWorkplaces}
                                                                        fetchArgs={[orgId || ""]}
                                                                        optionsKey="workplaces"
                                                                        customValueKey={(item) => item.id}
                                                                        customLabelKey={(item: Workplace) => (
                                                                            <WorkplaceLabel data={item} />
                                                                        )}
                                                                        customSelectedLabelKey={(item: Workplace) => (
                                                                            <WorkplaceLabel data={item} />
                                                                        )}
                                                                        placeholder={t('employees.selectWorkplace', 'Select workplace')}
                                                                        searchPlaceholder={t('employees.searchWorkplace', 'Search workplaces...')}
                                                                        emptyText={t('employees.noWorkplaces', 'No workplaces found.')}
                                                                        disabled={formDisabled}
                                                                        value={field.value || []}
                                                                        onChangeValue={field.onChange}
                                                                        maxCount={1}
                                                                        className="w-full truncate"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="groups_ids"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    {t('employees.groups', 'Groups')}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <MultiSelectApiHierarchy
                                                                        fetchOptions={getOrgGroups}
                                                                        fetchArgs={[orgId]}
                                                                        optionsKey="groups"
                                                                        parentKey="parent"
                                                                        customValueKey={(item) => item.id}
                                                                        customLabelKey={(item) => (
                                                                            <div className="font-medium text-sm flex items-center gap-2">
                                                                                <DynamicIcon name={item.icon_url as any} className="h-4 w-4" />
                                                                                <span className="text-sm">{item.name}</span>
                                                                            </div>
                                                                        )}
                                                                        placeholder={t('employees.selectGroups', 'Select groups')}
                                                                        searchPlaceholder={t('employees.searchGroups', 'Search groups...')}
                                                                        emptyText={t('employees.noGroups', 'No groups found.')}
                                                                        disabled={formDisabled}
                                                                        value={field.value || []}
                                                                        onChangeValue={field.onChange}
                                                                        className="w-full truncate"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <div className="flex items-center justify-between gap-2 col-span-2">
                                                        <h3 className="text-sm font-bold my-4 text-muted-foreground border-b border-border pb-2 flex-1">{t('employees.policiesAssignment', 'Policies Assignment')}</h3>
                                                    </div>

                                                    <FormField
                                                        control={form.control}
                                                        name="org_time_policy_id"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    {t('employees.timePolicy', 'Time Policy')}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <MultiSelectApi
                                                                        fetchOptions={getTimePolicies}
                                                                        fetchArgs={[orgId || ""]}
                                                                        optionsKey="time_policies"
                                                                        customValueKey={(item) => item.id}
                                                                        customLabelKey={(item) => item.name}
                                                                        placeholder={t('employees.selectTimePolicy', 'Select time policy')}
                                                                        searchPlaceholder={t('employees.searchTimePolicy', 'Search time policies...')}
                                                                        emptyText={t('employees.noTimePolicies', 'No time policies found.')}
                                                                        disabled={formDisabled}
                                                                        value={field.value || []}
                                                                        onChangeValue={field.onChange}
                                                                        maxCount={1}
                                                                        className="w-full truncate"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="reporting_to_ids"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    {t('employees.reportingTo', 'Reporting To')}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <MultiSelectApi
                                                                        fetchOptions={getOrgEmployees}
                                                                        fetchArgs={[orgId, undefined, undefined, undefined, undefined, undefined, undefined]}
                                                                        optionsKey="employees"
                                                                        enableParams="hidden"
                                                                        defaultParams="employees"
                                                                        customValueKey={(item) => item.id}
                                                                        customLabelKey={(item) => <EmployeeAvatar employee={item} />}
                                                                        placeholder={t('employees.selectReportingTo', 'Select manager')}
                                                                        searchPlaceholder={t('employees.searchReportingTo', 'Search users...')}
                                                                        emptyText={t('employees.noUsers', 'No users found.')}
                                                                        disabled={formDisabled}
                                                                        value={field.value || []}
                                                                        onChangeValue={field.onChange}
                                                                        maxCount={1}
                                                                        className="w-full truncate"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="org_absence_policy_id"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    {t('employees.absencePolicy', 'Absence Policy')}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <MultiSelectApi
                                                                        fetchOptions={getAbsencePolicies}
                                                                        fetchArgs={[orgId || ""]}
                                                                        optionsKey="absence_policies"
                                                                        customValueKey={(item) => item.id}
                                                                        customLabelKey={(item) => item.name}
                                                                        placeholder={t('employees.selectAbsencePolicy', 'Select absence policy')}
                                                                        searchPlaceholder={t('employees.searchAbsencePolicy', 'Search absence policies...')}
                                                                        emptyText={t('employees.noAbsencePolicies', 'No absence policies found.')}
                                                                        disabled={formDisabled}
                                                                        value={field.value || []}
                                                                        onChangeValue={field.onChange}
                                                                        maxCount={1}
                                                                        className="w-full truncate"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="reporting_absence_to_ids"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    {t('employees.reportingAbsenceTo', 'Reporting Absence To')}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <MultiSelectApi
                                                                        fetchOptions={getOrgEmployees}
                                                                        fetchArgs={[orgId, undefined, undefined, undefined, undefined, undefined, undefined]}
                                                                        optionsKey="employees"
                                                                        enableParams="hidden"
                                                                        defaultParams="employees"
                                                                        customValueKey={(item) => item.id}
                                                                        customLabelKey={(item) => <EmployeeAvatar employee={item} />}
                                                                        placeholder={t('employees.selectReportingAbsenceTo', 'Select users')}
                                                                        searchPlaceholder={t('employees.searchReportingAbsenceTo', 'Search users...')}
                                                                        emptyText={t('employees.noUsers', 'No users found.')}
                                                                        disabled={formDisabled}
                                                                        value={field.value || []}
                                                                        onChangeValue={field.onChange}
                                                                        className="w-full truncate"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                </div>

                                                {/* Custom HR Fields */}
                                                {getHRSection() && getHRSection()?.fields && getHRSection()?.fields.length > 0 && (
                                                    <div className="mt-6">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <h3 className="text-sm font-bold mb-4 text-muted-foreground border-b border-border pb-2 flex-1">
                                                                {t('employees.customFields', 'Custom Fields')}
                                                            </h3>
                                                            <Button variant="ghost" size="icon" onClick={() => navigate(`/${orgId}/admin/fields/employees`)}>
                                                                <Settings className="h-4 w-4 text-muted-foreground" />
                                                            </Button>
                                                        </div>
                                                        <CustomFieldsSection
                                                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                                            fields={getHRSection()?.fields || []}
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
                                                                <h3 className="text-sm font-bold mb-4 text-muted-foreground border-b border-border pb-2 flex-1">
                                                                    {t('employees.customFields', 'Custom Fields')}
                                                                </h3>
                                                                <Button variant="ghost" size="icon" onClick={() => navigate(`/${orgId}/admin/fields/employees`)}>
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
                                                                {t('employees.noFieldsInSection', 'No fields configured for this section yet.')}
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

                    {currentStep === 'emergencyContacts' && createdEmployeeId && orgId && (
                        <div className="space-y-4 py-2">
                            <Card className="shadow-none">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 justify-between">
                                        {t('employees.emergencyContacts', 'Emergency Contacts')}
                                        <Button onClick={() => setIsEmergencyContactModalOpen(true)} size="sm" variant="outline">
                                            <Plus className="h-4 w-4" />
                                            {t('employees.addEmergencyContact', 'Add')}
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="py-0 px-4">
                                    {loadingEmergencyContacts ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : emergencyContacts.length === 0 ? (
                                        <div className="text-center py-4">
                                            <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                            <p className="text-sm text-muted-foreground">{t('employees.noEmergencyContacts', 'No emergency contacts yet')}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-0">
                                            {emergencyContacts.map((contact, index) => (
                                                <div key={contact.id}>
                                                    <div className="py-2 flex items-center gap-2">
                                                        <span className="font-medium text-sm">{contact.name || '-'}</span>
                                                        {contact.relationship && <span className="text-xs text-muted-foreground">{contact.relationship}</span>}
                                                        {contact.phone && <span className="text-xs text-muted-foreground">{contact.phone}</span>}
                                                    </div>
                                                    {index < emergencyContacts.length - 1 && <Separator />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            <EmployeeEmergencyContactEditModal
                                open={isEmergencyContactModalOpen}
                                onOpenChange={setIsEmergencyContactModalOpen}
                                onEmergencyContactSaved={() => { fetchEmergencyContacts(); setIsEmergencyContactModalOpen(false); }}
                                employeeId={createdEmployeeId}
                            />
                        </div>
                    )}

                    {currentStep === 'paymentMethods' && createdEmployeeId && orgId && (
                        <div className="space-y-4 py-2">
                            <Card className="shadow-none">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 justify-between">
                                        {t('employees.paymentMethods', 'Payment Methods')}
                                        <Button onClick={() => setIsPaymentMethodModalOpen(true)} size="sm" variant="outline">
                                            <Plus className="h-4 w-4" />
                                            {t('employees.addPaymentMethod', 'Add')}
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
                                            <p className="text-sm text-muted-foreground">{t('employees.noPaymentMethods', 'No payment methods yet')}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-0">
                                            {paymentMethods.map((pm, index) => (
                                                <div key={pm.id}>
                                                    <div className="py-2 flex items-center gap-2">
                                                        <span className="font-medium text-sm">{pm.bank}</span>
                                                        {pm.iban && <span className="text-xs font-mono text-muted-foreground">{pm.iban}</span>}
                                                    </div>
                                                    {index < paymentMethods.length - 1 && <Separator />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            <EmployeePaymentMethodModal
                                open={isPaymentMethodModalOpen}
                                onOpenChange={setIsPaymentMethodModalOpen}
                                onPaymentMethodCreated={() => { fetchPaymentMethods(); setIsPaymentMethodModalOpen(false); }}
                                employeeId={createdEmployeeId}
                                orgId={orgId}
                                mode="create"
                            />
                        </div>
                    )}

                    {currentStep === 'skills' && createdEmployeeId && orgId && (
                        <div className="space-y-4 py-2">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        {t('employees.skills', 'Skills')}
                                        <Badge variant="secondary">{skills.length}</Badge>
                                    </h3>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsSkillModalOpen(true)}
                                    >
                                        <Plus className="h-4 w-4" />
                                        {t('employees.addSkill', 'Add')}
                                    </Button>
                                </div>
                                {loadingSkills ? (
                                    <div className="flex items-center justify-center p-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : skills.length === 0 ? (
                                    <div className="text-sm text-muted-foreground py-6 text-center">
                                        <Hexagon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                        <p>{t('employees.noSkills', 'No skills yet')}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {skills.map((skill) => (
                                            <div key={skill.id} className="flex items-center justify-between gap-2 text-sm py-2 px-2 rounded border">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium">{skill.name}</div>
                                                    {getSkillDescriptionForLevel(skill.description, skill.level ?? 1) && (
                                                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                            {getSkillDescriptionForLevel(skill.description, skill.level ?? 1)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <StarsLabel level={skill.level ?? 1} variant="default" size="md" />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => {
                                                            setSkillToEdit(skill);
                                                            setIsSkillEditModalOpen(true);
                                                        }}
                                                    >
                                                        <SquarePen className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDeleteSkill(skill.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <EmployeeSkillsAddModal
                                    open={isSkillModalOpen}
                                    onOpenChange={setIsSkillModalOpen}
                                    onSuccess={() => { fetchSkills(); setIsSkillModalOpen(false); }}
                                    orgId={orgId}
                                    employeeId={createdEmployeeId}
                                />
                                <EmployeeSkillEditModal
                                    open={isSkillEditModalOpen}
                                    onOpenChange={(open) => {
                                        setIsSkillEditModalOpen(open);
                                        if (!open) setSkillToEdit(null);
                                    }}
                                    orgId={orgId}
                                    employeeId={createdEmployeeId}
                                    skill={skillToEdit}
                                    onSuccess={fetchSkills}
                                />
                            </div>
                        </div>
                    )}

                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 fixed bottom-0 left-0 right-0 bg-background p-4 rounded-b-lg">
                    <div className="flex gap-2">
                        {!isFirstStep() && currentStep !== 'emergencyContacts' && (
                            <Button type="button" variant="outline" onClick={handlePrevious} disabled={isLoading}>
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                {t('common.previous', 'Previous')}
                            </Button>
                        )}
                    </div>
                    <div className="flex-1" />
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
                            {createdEmployeeId ? t('common.close', 'Close') : t('common.cancel', 'Cancel')}
                        </Button>
                        {currentStep === 'basic' && !createdEmployeeId && (
                            <Button type="submit" onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {t('employees.creating', 'Creating...')}
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
        </Dialog>
    );
};

export default EmployeeCreateModal;
