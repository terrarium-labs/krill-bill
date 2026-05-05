import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Settings } from 'lucide-react';

import { useTranslation } from '@/hooks/useTranslation';
import { postEmployee, patchEmployee } from '@/api/employees/employees';
import { Employee } from '@/types/employees/employees';
import Tag from '@/app/components/tag/tag';
import IdBadge from '@/app/components/id-badge';
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
import { getAbsencePolicies } from '@/api/orgs/absences/absences';
import { getTimePolicies } from '@/api/orgs/time-policies/time-policies';
import { getOrgEmployees } from '@/api/employees/employees';
import { getOrgGroups } from '@/api/orgs/groups/groups';
import { formatDateForAPI } from '@/utils/miscelanea';
import { DynamicIcon } from 'lucide-react/dynamic';
import { EmployeeAvatar } from '@/app/components/avatars/employee-avatar';

interface EmployeeEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEmployeeCreatedOrUpdated?: () => void;
    employee?: Employee | null;
    mode: 'create' | 'edit';
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

/** Build custom field values for the form using employee sections, the flat `fields` bag, and org section metadata (for date types). */
function buildEmployeeCustomFieldsRecord(
    employeeData: Employee,
    orgSections: { fields?: { id: string; data_type: string }[] | null }[],
): Record<string, any> {
    const fieldMetaById = new Map<string, { data_type: string }>();
    employeeData.sections?.forEach((section) => {
        section.fields?.forEach((field) => {
            fieldMetaById.set(field.id, { data_type: field.data_type });
        });
    });
    orgSections.forEach((section) => {
        section.fields?.forEach((field) => {
            fieldMetaById.set(field.id, { data_type: field.data_type });
        });
    });

    const convertValue = (fieldId: string, raw: unknown): any => {
        if (raw === undefined) return undefined;
        if (raw === null) return null;
        const meta = fieldMetaById.get(fieldId);
        const dt = meta?.data_type;
        if ((dt === 'date' || dt === 'datetime') && typeof raw === 'string' && raw !== '') {
            return new Date(raw);
        }
        return raw;
    };

    const out: Record<string, any> = {};

    employeeData.sections?.forEach((section) => {
        section.fields?.forEach((field) => {
            if (field.value === undefined) return;
            out[field.id] = convertValue(field.id, field.value);
        });
    });

    const flat = employeeData.fields;
    if (flat && typeof flat === 'object' && !Array.isArray(flat)) {
        Object.entries(flat as Record<string, unknown>).forEach(([fieldId, raw]) => {
            if (raw === undefined) return;
            out[fieldId] = convertValue(fieldId, raw);
        });
    }

    return out;
}

const EmployeeEditModal: React.FC<EmployeeEditModalProps> = ({
    open,
    onOpenChange,
    onEmployeeCreatedOrUpdated,
    employee = null,
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

    const populateFormWithEmployeeData = useCallback(
        (employeeData: Employee) => {
            const custom_fields = buildEmployeeCustomFieldsRecord(employeeData, sections);

            form.reset({
                first_name: employeeData.first_name || '',
                last_name: employeeData.last_name || '',
                email: employeeData.email || '',
                national_id_number: employeeData.national_id_number || '',
                tax_id_number: employeeData.tax_id_number || '',
                phone: employeeData.phone || '',
                date_of_birth: employeeData.date_of_birth ? new Date(employeeData.date_of_birth) : undefined,
                address_line_1: employeeData.address_line_1 || '',
                address_line_2: employeeData.address_line_2 || '',
                postal_code: employeeData.postal_code || '',
                city: employeeData.city || '',
                state_province: employeeData.state_province || '',
                country: employeeData.country || '',
                notes: employeeData.notes || '',
                status: employeeData.status ? [employeeData.status] : [],
                job_title_id: employeeData.job_title?.id ? [employeeData.job_title?.id] : [],
                org_user_workplace_id: employeeData.org_user_workplace?.id ? [employeeData.org_user_workplace?.id] : [],
                org_absence_policy_id: employeeData.org_absence_policy?.id ? [employeeData.org_absence_policy?.id] : [],
                org_time_policy_id: employeeData.org_time_policy?.id ? [employeeData.org_time_policy?.id] : [],
                reporting_to_ids: employeeData.reporting_to?.id ? [employeeData.reporting_to.id] : [],
                reporting_absence_to_ids: employeeData.reporting_absence_to?.map((reportingAbsenceTo) => reportingAbsenceTo.id) || [],
                groups_ids: employeeData.groups?.map((group) => group.id) || [],
                custom_fields,
            });
        },
        [form, sections],
    );

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

            console.log(`${isEditMode ? 'Updating' : 'Creating'} employee data:`, finalPayload);

            let response;
            if (isEditMode && employee?.id) {
                response = await patchEmployee(orgId, employee.id, finalPayload);
            } else {
                response = await postEmployee(orgId, finalPayload);
            }

            if (response.success) {
                const successMessage = isEditMode
                    ? t('employees.employeeUpdatedSuccess', 'Employee updated successfully')
                    : t('employees.employeeCreatedSuccess', 'Employee created successfully');
                toast.success(successMessage);
                form.reset();
                onOpenChange(false);
                onEmployeeCreatedOrUpdated?.();
            } else {
                const errorMessage = isEditMode
                    ? t('employees.patchEmployeeError', 'Failed to update employee')
                    : t('employees.postEmployeeError', 'Failed to create employee');
                toast.error(response.error || errorMessage);
            }
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} employee:`, error);
            const errorMessage = isEditMode
                ? t('employees.patchEmployeeError', 'Failed to update employee')
                : t('employees.postEmployeeError', 'Failed to create employee');
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

    useEffect(() => {
        if (open && orgId) {
            fetchSections();
        }
    }, [open, orgId]);

    useEffect(() => {
        if (open && !isEditMode) {
            form.reset();
        }
    }, [open, isEditMode, form]);

    // Populate in edit mode; re-run when org sections load so metadata (e.g. date types) and `fields` merge apply correctly.
    useEffect(() => {
        if (!open || !isEditMode || !employee) return;
        populateFormWithEmployeeData(employee);
    }, [open, isEditMode, employee, populateFormWithEmployeeData]);

    const dialogTitle = isEditMode
        ? t('employees.editEmployee', 'Edit Employee')
        : t('employees.createEmployee', 'Create Employee');

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
                        {isEditMode && employee && (
                            <div className="flex items-center gap-2">
                                <IdBadge id={employee.id} />
                                {renderActions?.(employee, () => handleOpenChange(false))}
                            </div>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-6 overflow-y-auto max-h-[70vh] px-2 scrollbar-hide mb-16">
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
                                                disabled={isLoading}
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
                                                disabled={isLoading}
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
                                                            {t('employees.addressLine2', 'Address Line 2')}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder={t('employees.enterAddressLine2', 'Apartment, suite, etc.')}
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
                                                            {t('employees.city', 'City')}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder={t('employees.enterCity', 'City')}
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
                                                            {t('employees.postalCode', 'Postal Code')}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder={t('employees.enterPostalCode', 'Postal code')}
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
                                                            {t('employees.stateProvince', 'State/Province')}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder={t('employees.enterStateProvince', 'State or province')}
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
                                                                disabled={isLoading}
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
                                                            {t('employees.email', 'Email')} *
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="email"
                                                                placeholder={t('employees.enterEmail', 'example@example.com')}
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
                                                    label={t('employees.phone', 'Phone')}
                                                    placeholder={t('employees.enterPhone', 'Phone number')}
                                                    disabled={isLoading}
                                                />
                                            </div>

                                            <div className="col-span-2">
                                                <DateTimePicker
                                                    form={form}
                                                    name="date_of_birth"
                                                    showMonthYearPicker={true}
                                                    label={t('employees.dateOfBirth', 'Date of Birth')}
                                                    placeholder={t('employees.enterDateOfBirth', 'Select date of birth')}
                                                    disabled={isLoading}
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
                                                            disabled={isLoading}
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
                                                disabled={isLoading}
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
                                                                disabled={isLoading}
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
                                                                disabled={isLoading}
                                                                value={field.value || []}
                                                                onChangeValue={field.onChange}
                                                                defaultItems={employee?.job_title ? [employee.job_title] : undefined}
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
                                                                customLabelKey={(item) =>
                                                                    <div className="font-medium text-sm flex items-center gap-2">
                                                                        <DynamicIcon name={item.icon_url as any} className="h-4 w-4" />
                                                                        <span className="text-sm">{item.name}</span>
                                                                    </div>
                                                                }
                                                                placeholder={t('employees.selectWorkplace', 'Select workplace')}
                                                                searchPlaceholder={t('employees.searchWorkplace', 'Search workplaces...')}
                                                                emptyText={t('employees.noWorkplaces', 'No workplaces found.')}
                                                                disabled={isLoading}
                                                                value={field.value || []}
                                                                onChangeValue={field.onChange}
                                                                defaultItems={employee?.org_user_workplace ? [employee.org_user_workplace] : undefined}
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
                                                                disabled={isLoading}
                                                                value={field.value || []}
                                                                onChangeValue={field.onChange}
                                                                defaultItems={employee?.groups}
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
                                                                disabled={isLoading}
                                                                value={field.value || []}
                                                                onChangeValue={field.onChange}
                                                                defaultItems={employee?.org_time_policy ? [employee.org_time_policy] : undefined}
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
                                                                disabled={isLoading}
                                                                value={field.value || []}
                                                                onChangeValue={field.onChange}
                                                                defaultItems={employee?.reporting_to ? [employee.reporting_to] : undefined}
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
                                                                disabled={isLoading}
                                                                value={field.value || []}
                                                                onChangeValue={field.onChange}
                                                                defaultItems={employee?.org_absence_policy ? [employee.org_absence_policy] : undefined}
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
                                                                disabled={isLoading}
                                                                value={field.value || []}
                                                                onChangeValue={field.onChange}
                                                                defaultItems={employee?.reporting_absence_to || undefined}
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
                                                        disabled={isLoading}
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
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {isEditMode
                                            ? t('employees.updating', 'Updating...')
                                            : t('employees.creating', 'Creating...')
                                        }
                                    </>
                                ) : isEditMode ? (
                                    t('common.update', 'Update')
                                ) : (
                                    t('common.create', 'Create')
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default EmployeeEditModal;
