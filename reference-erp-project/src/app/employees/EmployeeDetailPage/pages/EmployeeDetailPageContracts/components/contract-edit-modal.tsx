import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { useTranslation } from '@/hooks/useTranslation';
import { postEmployeeContract } from '@/api/employees/contracts/contracts';
import { EmployeeContract } from '@/types/employees/contracts';

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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';
import { DateTimePicker } from '@/app/components/forms-elements/date-time-picker';
import { formatDateForAPI } from '@/utils/miscelanea';

interface ContractEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onContractCreated?: () => void;
    contract?: EmployeeContract | null;
    mode?: 'create' | 'update';
    /** When provided (e.g. from create-employee wizard), used instead of useEmployee().employee.id */
    employeeId?: string;
}

// Form schema
const formInputSchema = z.object({
    type: z.enum(['permanent', 'temporary', 'internship', 'contractor', 'agency_worker', 'apprenticeship']),
    start_date: z.date(),
    end_date: z.date().optional().nullable(),
    annual_gross_salary: z.string().min(1, 'Annual salary is required'),
    num_salary_payments_per_year: z.enum(['12', '14']),
    price_per_hour: z.string().optional(),
    overtime_price_per_hour: z.string().optional(),
}).refine((data) => {
    // If end_date exists, validate that it's after start_date
    if (data.end_date && data.start_date) {
        return data.end_date > data.start_date;
    }
    return true;
}, {
    message: 'End date must be after start date',
    path: ['end_date'], // This will show the error on the end_date field
});

type FormValues = z.infer<typeof formInputSchema>;

const ContractEditModal: React.FC<ContractEditModalProps> = ({
    open,
    onOpenChange,
    onContractCreated,
    contract = null,
    mode = 'create',
    employeeId: employeeIdProp,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const employeeId = employeeIdProp;

    const form = useForm<FormValues>({
        resolver: zodResolver(formInputSchema),
        defaultValues: {
            type: 'permanent',
            start_date: undefined,
            end_date: undefined,
            annual_gross_salary: '',
            num_salary_payments_per_year: '12',
            price_per_hour: '',
            overtime_price_per_hour: '',
        },
    });

    // Populate form when in update mode
    useEffect(() => {
        if (open && contract && mode === 'update') {
            form.reset({
                type: contract.type,
                start_date: new Date(contract.start_date),
                end_date: contract.end_date ? new Date(contract.end_date) : undefined,
                annual_gross_salary: contract.annual_gross_salary.toString(),
                num_salary_payments_per_year: contract.num_salary_payments_per_year.toString() as '12' | '14',
                price_per_hour: contract.price_per_hour != null ? contract.price_per_hour.toString() : '',
                overtime_price_per_hour: contract.overtime_price_per_hour != null ? contract.overtime_price_per_hour.toString() : '',
            });
        } else if (open && mode === 'create') {
            form.reset({
                type: 'permanent',
                start_date: undefined,
                end_date: undefined,
                annual_gross_salary: '',
                num_salary_payments_per_year: '12',
                price_per_hour: '',
                overtime_price_per_hour: '',
            });
        }
    }, [open, contract, mode, form]);

    const onSubmit = async (values: FormValues) => {
        if (!orgId || !employeeId) {
            toast.error(t('common.error', 'An error occurred'));
            return;
        }

        setIsLoading(true);

        try {
            // Transform form values to API format
            const apiData: Record<string, unknown> = {
                type: values.type,
                start_date: formatDateForAPI(values.start_date),
                end_date:
                    values.type !== 'permanent'
                        ? values.end_date
                            ? formatDateForAPI(values.end_date)
                            : null
                        : null,
                annual_gross_salary: parseFloat(values.annual_gross_salary),
                num_salary_payments_per_year: parseInt(values.num_salary_payments_per_year) as 12 | 14,
            };

            if (values.price_per_hour?.trim()) {
                const parsed = parseFloat(values.price_per_hour);
                if (!Number.isNaN(parsed)) apiData.price_per_hour = parsed;
            }
            if (values.overtime_price_per_hour?.trim()) {
                const parsed = parseFloat(values.overtime_price_per_hour);
                if (!Number.isNaN(parsed)) apiData.overtime_price_per_hour = parsed;
            }

            const response = await postEmployeeContract(orgId, employeeId, apiData);

            if (response.success) {
                toast.success(
                    mode === 'update'
                        ? t('employees.contracts.contractUpdated', 'Contract updated successfully')
                        : t('employees.contracts.contractCreated', 'Contract created successfully')
                );
                form.reset();
                onOpenChange(false);
                if (onContractCreated) {
                    onContractCreated();
                }
            } else {
                toast.error(
                    mode === 'update'
                        ? t('employees.contracts.errorUpdatingContract', 'Error updating contract')
                        : t('employees.contracts.errorCreatingContract', 'Error creating contract')
                );
            }
        } catch (error) {
            console.error('Error submitting contract:', error);
            toast.error(t('common.error', 'An error occurred'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = async (newOpen: boolean) => {
        if (!newOpen && form.formState.isDirty) {
            const discard = await promptUnsavedChanges();
            if (discard) {
                form.reset();
                onOpenChange(false);
            }
        } else {
            if (!newOpen) {
                form.reset();
            }
            onOpenChange(newOpen);
        }
    };

    const contractTypeOptions = [
        { value: 'permanent', label: t('employees.contracts.types.permanent', 'Permanent') },
        { value: 'temporary', label: t('employees.contracts.types.temporary', 'Temporary') },
        { value: 'internship', label: t('employees.contracts.types.internship', 'Internship') },
        { value: 'contractor', label: t('employees.contracts.types.contractor', 'Contractor') },
        { value: 'agency_worker', label: t('employees.contracts.types.agencyWorker', 'Agency Worker') },
        { value: 'apprenticeship', label: t('employees.contracts.types.apprenticeship', 'Apprenticeship') },
    ];

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" showCloseButton={false}>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <DialogHeader>
                            <DialogTitle>
                                {mode === 'update'
                                    ? t('employees.contracts.editContract', 'Edit Contract')
                                    : t('employees.contracts.newContract', 'New Contract')
                                }
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 grid grid-cols-1 gap-4 items-start justify-start">
                            {/* Contract Type */}
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('employees.contracts.type', 'Type')}</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder={t('employees.contracts.selectType', 'Select type')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {contractTypeOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className={`grid ${form.watch('type') !== 'permanent' ? 'grid-cols-2' : 'grid-cols-1'} gap-4 items-start justify-start`}>
                            {/* Start Date */}
                            <DateTimePicker
                                form={form}
                                name="start_date"
                                showMonthYearPicker={true}
                                label={t('employees.contracts.startDate', 'Start Date')}
                                required={true}
                                showTime={false}
                                placeholder={t('employees.contracts.selectStartDate', 'Select start date')}
                            />

                            {/* End Date */}
                            {form.watch('type') !== 'permanent' ? <DateTimePicker
                                form={form}
                                name="end_date"
                                showMonthYearPicker={true}
                                label={t('employees.contracts.endDate', 'End Date')}
                                required={false}
                                showTime={false}
                                placeholder={t('employees.contracts.selectEndDate', 'Select end date (optional)')}
                            /> : <div></div>}
                        </div>

                        <div className="space-y-4 grid grid-cols-2 gap-4 items-start justify-start">
                            {/* Annual Gross Salary */}
                            <FormField
                                control={form.control}
                                name="annual_gross_salary"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('employees.contracts.annualSalary', 'Annual Salary')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="50000"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Number of Payments Per Year */}
                            <FormField
                                control={form.control}
                                name="num_salary_payments_per_year"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('employees.contracts.paymentsPerYear', 'Payments/Year')}</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="12">12</SelectItem>
                                                <SelectItem value="14">14</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-4 grid grid-cols-2 gap-4 items-start justify-start">
                            {/* Price per Hour */}
                            <FormField
                                control={form.control}
                                name="price_per_hour"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('employees.contracts.pricePerHour', 'Price per Hour')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder={t('employees.contracts.optional', 'Optional')}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Overtime Price per Hour */}
                            <FormField
                                control={form.control}
                                name="overtime_price_per_hour"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('employees.contracts.overtimePricePerHour', 'Overtime Price per Hour')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder={t('employees.contracts.optional', 'Optional')}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
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
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {mode === 'update'
                                            ? t('employees.contracts.updatingContract', 'Updating Contract...')
                                            : t('employees.contracts.creatingContract', 'Creating Contract...')
                                        }
                                    </>
                                ) : (
                                    mode === 'update'
                                        ? t('employees.contracts.updateContract', 'Update Contract')
                                        : t('employees.contracts.createContract', 'Create Contract')
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default ContractEditModal;

