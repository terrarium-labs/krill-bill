import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { useTranslation } from 'react-i18next';
import { postOrgHourlyRate, patchOrgHourlyRate } from '@/api/orgs/hourly-rates/hourly-rates';
import { HourlyRate } from '@/types/general/hourly-rates';

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

interface HourlyRateEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onHourlyRateCreated: () => void;
    hourlyRate?: HourlyRate | null;
    mode?: 'create' | 'update';
}

// Form schema with validation
const formSchema = z.object({
    name: z
        .string()
        .min(1, 'Name is required')
        .min(2, 'Name must be at least 2 characters')
        .max(128, 'Name must be less than 128 characters')
        .trim(),
    status: z.enum(['active', 'inactive']),
    valid_from: z.date(),
    due_date: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const HourlyRateEditModal: React.FC<HourlyRateEditModalProps> = ({
    open,
    onOpenChange,
    onHourlyRateCreated,
    hourlyRate = null,
    mode = 'create',
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            status: 'active',
            valid_from: new Date(),
            due_date: undefined,
        },
    });

    // Populate form with hourly rate data for update mode
    const populateFormWithHourlyRateData = (hourlyRateData: HourlyRate) => {
        form.reset({
            name: hourlyRateData.name || '',
            status: hourlyRateData.status || 'active',
            valid_from: hourlyRateData.valid_from ? new Date(hourlyRateData.valid_from) : new Date(),
            due_date: hourlyRateData.due_date ? new Date(hourlyRateData.due_date) : undefined,
        });
    };

    const onSubmit = async (values: FormValues) => {
        if (!orgId) {
            toast.error('Organization ID is required');
            return;
        }

        setIsLoading(true);
        try {
            // Prepare the payload
            const payload = {
                name: values.name,
                status: values.status,
                valid_from: values.valid_from.toISOString(),
                ...(values.due_date && { due_date: values.due_date.toISOString() }),
            };

            let response;
            if (mode === 'update' && hourlyRate?.id) {
                response = await patchOrgHourlyRate(orgId, hourlyRate.id, payload);
            } else {
                response = await postOrgHourlyRate(orgId, payload);
            }

            if (response.success) {
                const successMessage = mode === 'update'
                    ? t('hourlyRates.hourlyRateUpdatedSuccess', 'Hourly rate updated successfully')
                    : t('hourlyRates.hourlyRateCreatedSuccess', 'Hourly rate created successfully');
                toast.success(successMessage);
                form.reset();
                onOpenChange(false);
                if (onHourlyRateCreated) {
                    onHourlyRateCreated();
                }
            } else {
                const errorMessage = mode === 'update'
                    ? t('hourlyRates.updateHourlyRateError', 'Failed to update hourly rate')
                    : t('hourlyRates.createHourlyRateError', 'Failed to create hourly rate');
                toast.error(response.error || errorMessage);
            }
        } catch (error) {
            console.error(`Error ${mode === 'update' ? 'updating' : 'creating'} hourly rate:`, error);
            const errorMessage = mode === 'update'
                ? t('hourlyRates.updateHourlyRateError', 'Failed to update hourly rate')
                : t('hourlyRates.createHourlyRateError', 'Failed to create hourly rate');
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

    // Reset form when modal opens/closes
    useEffect(() => {
        if (open) {
            if (mode === 'update' && hourlyRate) {
                populateFormWithHourlyRateData(hourlyRate);
            } else {
                form.reset({
                    name: '',
                    status: 'active',
                    valid_from: new Date(),
                    due_date: undefined,
                });
            }
        }
    }, [open, mode, hourlyRate]);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="max-w-2xl"
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
                showCloseButton={false}
            >
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create'
                            ? t('hourlyRates.createHourlyRate', 'Create New Hourly Rate')
                            : t('hourlyRates.editHourlyRate', 'Edit Hourly Rate')}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Name Field */}
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>
                                            {t('hourlyRates.name', 'Name')} *
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t('hourlyRates.enterName', 'Hourly rate name')}
                                                {...field}
                                                disabled={isLoading}
                                                autoFocus
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Status Field */}
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>
                                            {t('hourlyRates.status', 'Status')} *
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder={t('hourlyRates.selectStatus', 'Select status')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="active">
                                                    {t('hourlyRates.active', 'Active')}
                                                </SelectItem>
                                                <SelectItem value="inactive">
                                                    {t('hourlyRates.inactive', 'Inactive')}
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Valid From Field */}
                            <DateTimePicker
                                form={form}
                                name="valid_from"
                                showMonthYearPicker={true}
                                label={t('hourlyRates.validFrom', 'Valid From')}
                                required={true}
                                disabled={isLoading}
                                description={t('hourlyRates.validFromDescription', 'Date when this hourly rate becomes valid')}
                                showTime={true}
                            />

                            <DateTimePicker
                                form={form}
                                name="due_date"
                                showMonthYearPicker={true}
                                label={t('hourlyRates.validTo', 'Valid To')}
                                required={false}
                                disabled={isLoading}
                                description={t('hourlyRates.validToDescription', 'Expiration date for this hourly rate')}
                                showTime={true}
                            />
                        </div>

                        <DialogFooter className="gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={isLoading}
                            >
                                {t('common.cancel', 'Cancel')}
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {mode === 'update'
                                            ? t('hourlyRates.updatingHourlyRate', 'Updating Hourly Rate...')
                                            : t('hourlyRates.creatingHourlyRate', 'Creating Hourly Rate...')
                                        }
                                    </>
                                ) : (
                                    mode === 'update'
                                        ? t('hourlyRates.updateHourlyRate', 'Update Hourly Rate')
                                        : t('hourlyRates.createHourlyRate', 'Create Hourly Rate')
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default HourlyRateEditModal;

