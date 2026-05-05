import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';
import { postOrgOrderTracking, patchOrgOrderTracking } from '@/api/orgs/orders/trackings/trackings';
import { Tracking } from '@/types/orders/trackings';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DateTimePicker } from '@/app/components/forms-elements/date-time-picker';
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';

// Form validation schema
const trackingSchema = z.object({
    tracking_number: z.string().min(1, 'Tracking number is required'),
    url: z.string().url('Invalid URL').optional().or(z.literal('')),
    delivery_date: z.date().optional(),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof trackingSchema>;

interface TrackingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTrackingSaved: () => void;
    tracking?: Tracking | null;
    mode: 'create' | 'update';
    orderId: string;
    orgId: string;
}

const TrackingModal: React.FC<TrackingModalProps> = ({
    open,
    onOpenChange,
    onTrackingSaved,
    tracking,
    mode,
    orderId,
    orgId,
}) => {
    const { t } = useTranslation();
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(trackingSchema),
        defaultValues: {
            tracking_number: '',
            url: '',
            delivery_date: new Date(),
            notes: '',
        },
    });

    const isDirty = form.formState.isDirty;

    useEffect(() => {
        if (tracking && mode === 'update') {
            form.reset({
                tracking_number: tracking.tracking_number || '',
                url: tracking.url || '',
                delivery_date: tracking.delivery_date ? new Date(tracking.delivery_date) : new Date(),
                notes: tracking.notes || '',
            });
        } else {
            form.reset({
                tracking_number: '',
                url: '',
                delivery_date: new Date(),
                notes: '',
            });
        }
    }, [tracking, mode, open, form]);

    const handleClose = async () => {
        if (isDirty) {
            const shouldClose = await promptUnsavedChanges();
            if (!shouldClose) return;
        }
        onOpenChange(false);
    };

    const handleSubmit = async (values: FormValues) => {
        setIsSaving(true);
        try {
            const dataToSend = {
                tracking_number: values.tracking_number,
                url: values.url || undefined,
                delivery_date: values.delivery_date ? values.delivery_date.toISOString() : undefined,
                notes: values.notes || undefined,
            };

            let response;
            if (mode === 'create') {
                response = await postOrgOrderTracking(orgId, orderId, dataToSend);
            } else if (tracking) {
                response = await patchOrgOrderTracking(orgId, orderId, tracking.id, dataToSend);
            }

            if (response?.success) {
                toast.success(
                    mode === 'create'
                        ? t('orders.trackingCreated', 'Tracking created successfully')
                        : t('orders.trackingUpdated', 'Tracking updated successfully')
                );
                form.reset(values);
                onTrackingSaved();
            } else {
                toast.error(
                    mode === 'create'
                        ? t('orders.errorCreatingTracking', 'Failed to create tracking')
                        : t('orders.errorUpdatingTracking', 'Failed to update tracking')
                );
            }
        } catch (error) {
            console.error('Error saving tracking:', error);
            toast.error(
                mode === 'create'
                    ? t('orders.errorCreatingTracking', 'Failed to create tracking')
                    : t('orders.errorUpdatingTracking', 'Failed to update tracking')
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent showCloseButton={false}>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)}>
                        <DialogHeader>
                            <DialogTitle>
                                {mode === 'create'
                                    ? t('orders.createTracking', 'Create Tracking')
                                    : t('orders.updateTracking', 'Update Tracking')}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <FormField
                                control={form.control}
                                name="tracking_number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('orders.trackingNumber', 'Tracking Number')} <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder={t('orders.trackingNumberPlaceholder', 'Enter tracking number')}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('orders.trackingUrl', 'Tracking URL')}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="url"
                                                placeholder={t('orders.trackingUrlPlaceholder', 'https://tracking.example.com/...')}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DateTimePicker
                                form={form}
                                name="delivery_date"
                                showMonthYearPicker={true}
                                label={t('orders.deliveryDate', 'Delivery Date')}
                                placeholder={t('orders.selectDeliveryDate', 'Select delivery date')}
                                showTime={false}
                            />

                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('orders.notes', 'Notes')}
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                placeholder={t('orders.notesPlaceholder', 'Add any additional notes...')}
                                                rows={3}
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
                                onClick={handleClose}
                                disabled={isSaving}
                            >
                                {t('common.cancel', 'Cancel')}
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving
                                    ? t('common.saving', 'Saving...')
                                    : mode === 'create'
                                        ? t('common.create', 'Create')
                                        : t('common.update', 'Update')}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default TrackingModal;
