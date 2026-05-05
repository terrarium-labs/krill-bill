import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { useTranslation } from 'react-i18next';
import { postOrgRate, patchOrgRate } from '@/api/orgs/rates/rates';
import { Rate } from '@/types/general/rates';

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
import IdBadge from '@/app/components/id-badge';
import Tag from '@/app/components/tag/tag';

interface ItemRateEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onRateCreated: () => void;
    rate?: Rate | null;
    mode?: 'create' | 'update';
    /** Custom actions (e.g. delete dropdown) shown in the header when in update mode. */
    renderActions?: () => React.ReactNode;
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

const ItemRateEditModal: React.FC<ItemRateEditModalProps> = ({
    open,
    onOpenChange,
    onRateCreated,
    rate = null,
    mode = 'create',
    renderActions,
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

    // Populate form with rate data for update mode
    const populateFormWithRateData = (rateData: Rate) => {
        form.reset({
            name: rateData.name || '',
            status: rateData.status || 'active',
            valid_from: rateData.valid_from ? new Date(rateData.valid_from) : new Date(),
            due_date: rateData.due_date ? new Date(rateData.due_date) : undefined,
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
            if (mode === 'update' && rate?.id) {
                response = await patchOrgRate(orgId, rate.id, payload);
            } else {
                response = await postOrgRate(orgId, payload);
            }

            if (response.success) {
                const successMessage = mode === 'update'
                    ? t('rates.rateUpdatedSuccess', 'Rate updated successfully')
                    : t('rates.rateCreatedSuccess', 'Rate created successfully');
                toast.success(successMessage);
                form.reset();
                onOpenChange(false);
                if (onRateCreated) {
                    onRateCreated();
                }
            } else {
                const errorMessage = mode === 'update'
                    ? t('rates.updateRateError', 'Failed to update rate')
                    : t('rates.createRateError', 'Failed to create rate');
                toast.error(response.error || errorMessage);
            }
        } catch (error) {
            console.error(`Error ${mode === 'update' ? 'updating' : 'creating'} rate:`, error);
            const errorMessage = mode === 'update'
                ? t('rates.updateRateError', 'Failed to update rate')
                : t('rates.createRateError', 'Failed to create rate');
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
            if (mode === 'update' && rate) {
                populateFormWithRateData(rate);
            } else {
                form.reset({
                    name: '',
                    status: 'active',
                    valid_from: new Date(),
                    due_date: undefined,
                });
            }
        }
    }, [open, mode, rate]);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="max-w-2xl"
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
                showCloseButton={false}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between text-lg font-semibold">
                        <span>
                            {mode === 'create'
                                ? t('rates.createRate', 'Create New Rate')
                                : t('rates.editRate', 'Edit Rate')}
                        </span>
                        {mode === 'update' && rate && renderActions && (
                            <div className="flex items-center gap-2">
                                <IdBadge id={rate.id} hideIcon={true} />
                                {renderActions()}
                            </div>
                        )}
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
                                            {t('rates.name', 'Name')} *
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t('rates.enterName', 'Rate name')}
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
                                            {t('rates.status', 'Status')} *
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder={t('rates.selectStatus', 'Select status')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="active">
                                                    <Tag text="active" className="capitalize" />
                                                </SelectItem>
                                                <SelectItem value="inactive">
                                                    <Tag text="inactive" className="capitalize" />
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
                                label={t('rates.validFrom', 'Valid From')}
                                required={true}
                                disabled={isLoading}
                                description={t('rates.validFromDescription', 'Date when this rate becomes valid')}
                                showTime={true}
                            />

                            <DateTimePicker
                                form={form}
                                name="due_date"
                                showMonthYearPicker={true}
                                label={t('rates.validTo', 'Valid To')}
                                required={false}
                                disabled={isLoading}
                                description={t('rates.validToDescription', 'Expiration date for this rate')}
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
                                            ? t('rates.updatingRate', 'Updating Rate...')
                                            : t('rates.creatingRate', 'Creating Rate...')
                                        }
                                    </>
                                ) : (
                                    mode === 'update'
                                        ? t('rates.updateRate', 'Update Rate')
                                        : t('rates.createRate', 'Create Rate')
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default ItemRateEditModal;

