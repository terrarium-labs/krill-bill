import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { createOrgWorkplaceHoliday } from '@/api/orgs/workplaces/holidays/holidays';
import { formatDateForAPI } from '@/utils/miscelanea';

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
import { Textarea } from '@/components/ui/textarea';
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';
import { DateTimePicker } from '@/app/components/forms-elements/date-time-picker';
import TipsCard from '@/app/components/cards/tips-card';
import { useChatContext } from '@/app/chat/context/ChatContext';

interface WorkplaceHolidayAddModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onHolidayCreated?: () => void;
    orgId: string;
    workplaceId: string;
}

// Form input schema
const formInputSchema = z.object({
    name: z.string().min(1, 'Holiday name is required'),
    holiday_date: z.date({ message: 'Date is required' }),
    description: z.string().optional(),
});

type FormValues = z.infer<typeof formInputSchema>;

const WorkplaceHolidayAddModal: React.FC<WorkplaceHolidayAddModalProps> = ({
    open,
    onOpenChange,
    onHolidayCreated,
    orgId,
    workplaceId,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();
    const { autoSendMessage } = useChatContext();

    const getDefaultDate = () => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const form = useForm<FormValues>({
        resolver: zodResolver(formInputSchema),
        defaultValues: {
            name: '',
            holiday_date: getDefaultDate(),
            description: '',
        },
    });

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            form.reset({
                name: '',
                holiday_date: getDefaultDate(),
                description: '',
            });
        }
    }, [open, form]);

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            const payload = {
                name: values.name,
                holiday_date: formatDateForAPI(values.holiday_date, "day") || null,
                description: values.description || null,
            };

            const response = await createOrgWorkplaceHoliday(orgId, workplaceId, payload);

            if (response.success) {
                toast.success(t('workplaces.holiday.created', 'Holiday created successfully'));
                form.reset();
                onOpenChange(false);
                if (onHolidayCreated) {
                    onHolidayCreated();
                }
            } else {
                toast.error(response.error || t('workplaces.holiday.createError', 'Failed to create holiday'));
            }
        } catch (error) {
            console.error('Error creating holiday:', error);
            toast.error(t('workplaces.holiday.createError', 'Failed to create holiday'));
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

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="max-w-2xl"
                showCloseButton={false}
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                        {t('workplaces.holiday.add', 'Add Holiday')}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-6 overflow-y-auto max-h-[60vh] px-2 scrollbar-hide">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">
                            {/* Holiday Name */}
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>
                                            {t('workplaces.holiday.name', 'Holiday Name')} *
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                placeholder={t('workplaces.holiday.enterName', 'Enter holiday name')}
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Holiday Date */}
                            <div className="col-span-2">
                                <DateTimePicker
                                    form={form}
                                    name="holiday_date"
                                    showMonthYearPicker={true}
                                    label={t('workplaces.holiday.date', 'Date')}
                                    showTime={false}
                                    disabled={isLoading}
                                    required
                                />
                            </div>


                            {/* Description */}
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>
                                            {t('workplaces.holiday.description', 'Description')}
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder={t('workplaces.holiday.enterDescription', 'Additional notes about this holiday')}
                                                {...field}
                                                disabled={isLoading}
                                                rows={3}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="col-span-2">
                                <TipsCard
                                    title={t('workplaces.holiday.multiDayTipTitle', 'Tip')}
                                    summary={t(
                                        'workplaces.holiday.multiDayTipBody',
                                        'For vacations or holidays that span several days, it is easier to ask Charles (the assistant) to help you set them up instead of adding one date at a time here.',
                                    )}
                                    buttonLabel={t('workplaces.holiday.askCharles', 'Ask Charles')}
                                    onClick={() => {
                                        void autoSendMessage(
                                            t(
                                                'workplaces.holiday.multiDayAskCharlesMessage',
                                                'Charles, help me add multi-day holidays for my workplace calendar. workplace_id: {{workplaceId}}',
                                                { workplaceId },
                                            ),
                                        );
                                        handleOpenChange(false);
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={isLoading}
                        >
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button type="submit" onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t('workplaces.holiday.creating', 'Creating...')}
                                </>
                            ) : (
                                t('workplaces.holiday.create', 'Create')
                            )}
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default WorkplaceHolidayAddModal;

