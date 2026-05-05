import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import { Loader2, Clock } from 'lucide-react';

import { useTranslation } from '@/hooks/useTranslation';
import { postClientContact, patchClientContact } from '@/api/clients/contacts/contacts';
import { ClientContact } from '@/types/clients/client';

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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from '@/components/ui/shadcn-io/tabs';
import { PhoneInput } from '@/app/components/forms-elements/phone-input';
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';

interface ContactModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onContactSaved?: () => void;
    contact?: ClientContact | null;
    clientId: string;
}

const timeSchema = z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time (HH:MM)');

const dayScheduleSchema = z.object({
    is_available: z.boolean(),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
}).refine(
    (data) => {
        if (data.is_available) {
            return data.start_time && data.end_time && timeSchema.safeParse(data.start_time).success && timeSchema.safeParse(data.end_time).success;
        }
        // Even when not available, ensure we have valid time format for display
        return timeSchema.safeParse(data.start_time || '09:00').success && timeSchema.safeParse(data.end_time || '17:00').success;
    },
    {
        message: "Start time and end time must be in valid HH:MM format",
    }
);

const formSchema = z.object({
    name: z
        .string()
        .min(1, 'Name is required')
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be less than 100 characters')
        .trim(),
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address'),
    phone: z
        .string()
        .min(1, 'Phone is required'),
    role: z
        .string()
        .max(50, 'Role must be less than 50 characters')
        .optional(),
    notes: z
        .string()
        .max(500, 'Notes must be less than 500 characters')
        .optional(),
    is_default: z.boolean(),
    schedule: z.object({
        monday: dayScheduleSchema,
        tuesday: dayScheduleSchema,
        wednesday: dayScheduleSchema,
        thursday: dayScheduleSchema,
        friday: dayScheduleSchema,
        saturday: dayScheduleSchema,
        sunday: dayScheduleSchema,
    }).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const ContactModal: React.FC<ContactModalProps> = ({
    open,
    onOpenChange,
    onContactSaved,
    contact,
    clientId,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();

    // Determine if this is edit mode
    const isEditMode = !!contact;

    const formatTimeForInput = (timeString?: string, isStartTime: boolean = true) => {
        if (!timeString) return isStartTime ? '09:00' : '17:00';

        // If it's already in HH:MM format, return as is
        if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString)) {
            return timeString;
        }

        // If it's in HH:MM:SS format, remove seconds
        if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(timeString)) {
            return timeString.slice(0, 5);
        }

        // If it's in ISO format, extract time part
        try {
            const date = new Date(timeString);
            return date.toTimeString().slice(0, 5);
        } catch {
            return isStartTime ? '09:00' : '17:00';
        }
    };

    const getDefaultValues = (contact?: ClientContact | null): FormValues => {
        if (!contact) {
            return {
                name: '',
                email: '',
                phone: '',
                role: '',
                notes: '',
                is_default: false,
                schedule: {
                    monday: { is_available: false, start_time: '09:00', end_time: '17:00' },
                    tuesday: { is_available: false, start_time: '09:00', end_time: '17:00' },
                    wednesday: { is_available: false, start_time: '09:00', end_time: '17:00' },
                    thursday: { is_available: false, start_time: '09:00', end_time: '17:00' },
                    friday: { is_available: false, start_time: '09:00', end_time: '17:00' },
                    saturday: { is_available: false, start_time: '09:00', end_time: '17:00' },
                    sunday: { is_available: false, start_time: '09:00', end_time: '17:00' },
                },
            };
        }

        return {
            name: contact.name || '',
            email: contact.email || '',
            phone: contact.phone || '',
            role: contact.role || '',
            notes: contact.notes || '',
            is_default: contact.is_default || false,
            schedule: contact.schedule ? {
                monday: {
                    is_available: contact.schedule.monday?.is_available || false,
                    start_time: formatTimeForInput(contact.schedule.monday?.start_time, true),
                    end_time: formatTimeForInput(contact.schedule.monday?.end_time, false),
                },
                tuesday: {
                    is_available: contact.schedule.tuesday?.is_available || false,
                    start_time: formatTimeForInput(contact.schedule.tuesday?.start_time, true),
                    end_time: formatTimeForInput(contact.schedule.tuesday?.end_time, false),
                },
                wednesday: {
                    is_available: contact.schedule.wednesday?.is_available || false,
                    start_time: formatTimeForInput(contact.schedule.wednesday?.start_time, true),
                    end_time: formatTimeForInput(contact.schedule.wednesday?.end_time, false),
                },
                thursday: {
                    is_available: contact.schedule.thursday?.is_available || false,
                    start_time: formatTimeForInput(contact.schedule.thursday?.start_time, true),
                    end_time: formatTimeForInput(contact.schedule.thursday?.end_time, false),
                },
                friday: {
                    is_available: contact.schedule.friday?.is_available || false,
                    start_time: formatTimeForInput(contact.schedule.friday?.start_time, true),
                    end_time: formatTimeForInput(contact.schedule.friday?.end_time, false),
                },
                saturday: {
                    is_available: contact.schedule.saturday?.is_available || false,
                    start_time: formatTimeForInput(contact.schedule.saturday?.start_time, true),
                    end_time: formatTimeForInput(contact.schedule.saturday?.end_time, false),
                },
                sunday: {
                    is_available: contact.schedule.sunday?.is_available || false,
                    start_time: formatTimeForInput(contact.schedule.sunday?.start_time, true),
                    end_time: formatTimeForInput(contact.schedule.sunday?.end_time, false),
                },
            } : {
                monday: { is_available: false, start_time: '09:00', end_time: '17:00' },
                tuesday: { is_available: false, start_time: '09:00', end_time: '17:00' },
                wednesday: { is_available: false, start_time: '09:00', end_time: '17:00' },
                thursday: { is_available: false, start_time: '09:00', end_time: '17:00' },
                friday: { is_available: false, start_time: '09:00', end_time: '17:00' },
                saturday: { is_available: false, start_time: '09:00', end_time: '17:00' },
                sunday: { is_available: false, start_time: '09:00', end_time: '17:00' },
            },
        };
    };

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: getDefaultValues(contact),
    });

    const onSubmit = async (values: FormValues) => {
        if (!orgId || !clientId) {
            toast.error('Organization ID and Client ID are required');
            return;
        }

        if (isEditMode && !contact?.id) {
            toast.error('Contact ID is required for editing');
            return;
        }

        setIsLoading(true);
        try {
            // Filter out empty values and prepare schedule
            const cleanedValues = {
                ...Object.fromEntries(Object.entries(values).filter(([_, value]) => value !== null && value !== '')),
            };

            // Only include schedule if at least one day is available
            if (values.schedule) {
                const hasAvailableDays = Object.values(values.schedule).some(day => day.is_available);
                if (hasAvailableDays) {
                    cleanedValues.schedule = values.schedule;
                } else if (isEditMode) {
                    // If no days are available in edit mode, set schedule to default
                    cleanedValues.schedule = {
                        monday: { is_available: false, start_time: '09:00', end_time: '17:00' },
                        tuesday: { is_available: false, start_time: '09:00', end_time: '17:00' },
                        wednesday: { is_available: false, start_time: '09:00', end_time: '17:00' },
                        thursday: { is_available: false, start_time: '09:00', end_time: '17:00' },
                        friday: { is_available: false, start_time: '09:00', end_time: '17:00' },
                        saturday: { is_available: false, start_time: '09:00', end_time: '17:00' },
                        sunday: { is_available: false, start_time: '09:00', end_time: '17:00' },
                    };
                }
            }

            const response = isEditMode
                ? await patchClientContact(orgId, clientId, contact!.id, cleanedValues)
                : await postClientContact(orgId, clientId, cleanedValues);

            if (response.success) {
                const successMessage = isEditMode
                    ? t('clients.contactUpdatedSuccess', 'Contact updated successfully')
                    : t('clients.contactCreatedSuccess', 'Contact created successfully');

                toast.success(successMessage);

                if (!isEditMode) {
                    form.reset();
                }

                onOpenChange(false);

                if (onContactSaved) {
                    onContactSaved();
                }
            } else {
                const errorMessage = isEditMode
                    ? response.error || t('clients.errorUpdatingContact', 'Failed to update contact')
                    : response.error || t('clients.errorCreatingContact', 'Failed to create contact');

                toast.error(errorMessage);
            }
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} contact:`, error);
            const errorMessage = isEditMode
                ? t('clients.errorUpdatingContact', 'Failed to update contact')
                : t('clients.errorCreatingContact', 'Failed to create contact');

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
                    if (!isEditMode) {
                        form.reset();
                    }
                    onOpenChange(false);
                }
            } else {
                if (!isEditMode) {
                    form.reset();
                }
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

    // Reset form when contact changes or modal opens
    useEffect(() => {
        if (open) {
            form.reset(getDefaultValues(contact));
        }
    }, [open, contact, form]);

    const daysOfWeek = [
        { key: 'monday', label: t('days.monday', 'Monday') },
        { key: 'tuesday', label: t('days.tuesday', 'Tuesday') },
        { key: 'wednesday', label: t('days.wednesday', 'Wednesday') },
        { key: 'thursday', label: t('days.thursday', 'Thursday') },
        { key: 'friday', label: t('days.friday', 'Friday') },
        { key: 'saturday', label: t('days.saturday', 'Saturday') },
        { key: 'sunday', label: t('days.sunday', 'Sunday') },
    ];

    const dialogTitle = isEditMode
        ? t('clients.editContact', 'Edit Contact')
        : t('clients.createNewContact', 'Create New Contact');

    const submitButtonText = isEditMode
        ? t('clients.updateContact', 'Update Contact')
        : t('clients.createContact', 'Create Contact');

    const loadingText = isEditMode
        ? t('clients.updatingContact', 'Updating Contact...')
        : t('clients.creatingContact', 'Creating Contact...');

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="max-w-lg md:min-w-lg"
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
                showCloseButton={false}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold mb-4">
                        {dialogTitle}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-6 overflow-y-auto max-h-[70vh] px-2 scrollbar-hide mb-16">
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('clients.contactName', 'Name')} *
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t('clients.enterContactName', 'Enter contact name')}
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
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('clients.contactRole', 'Role')}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t('clients.enterContactRole', 'e.g., Manager, Assistant')}
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Tabs defaultValue="contact">
                            <TabsList className="w-full justify-start border-b-2 border-border bg-background mb-4" activeClassName='border-b-2 border-primary -mb-1.5'>
                                <TabsTrigger className="py-0" value="contact">{t('clients.contactInformation', 'Contact')}</TabsTrigger>
                                <TabsTrigger className="py-0" value="schedule">{t('clients.scheduleInformation', 'Schedule')}</TabsTrigger>
                            </TabsList>

                            <TabsContents>
                                <TabsContent value="contact">
                                    <div className="grid grid-cols-1 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {t('clients.email', 'Email')} *
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="email"
                                                            placeholder={t('clients.enterEmail', 'example@example.com')}
                                                            {...field}
                                                            disabled={isLoading}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div>
                                            <PhoneInput
                                                form={form}
                                                name="phone"
                                                required={true}
                                                label={t('clients.phone', 'Phone')}
                                                placeholder={t('clients.enterPhone', 'Phone number')}
                                                disabled={isLoading}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="notes"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {t('clients.notes', 'Notes')}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder={t('clients.enterNotes', 'Additional notes about this contact...')}
                                                            {...field}
                                                            disabled={isLoading}
                                                            rows={4}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        {t('clients.notesDescription', 'Any additional information about this contact')}
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="is_default"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center justify-between p-4 border rounded-lg">
                                                    <div>
                                                        <FormLabel className="font-medium">
                                                            {t('clients.defaultContact', 'Default Contact')}
                                                        </FormLabel>
                                                        <FormDescription>
                                                            {t('clients.defaultContactDescription', 'Set this as the primary contact for the client')}
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            disabled={isLoading}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </TabsContent>
                                <TabsContent value="schedule">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Clock className="h-4 w-4" />
                                            <h4 className="font-medium text-sm">{t('clients.weeklySchedule', 'Weekly Schedule')}</h4>
                                        </div>

                                        {daysOfWeek.map((day) => (
                                            <div key={day.key} className="border rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="font-medium text-sm">{day.label}</span>
                                                    <FormField
                                                        control={form.control}
                                                        name={`schedule.${day.key}.is_available` as any}
                                                        render={({ field }) => (
                                                            <FormItem className="flex items-center space-x-2">
                                                                <FormControl>
                                                                    <Switch
                                                                        checked={field.value}
                                                                        onCheckedChange={field.onChange}
                                                                        disabled={isLoading}
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="text-sm">
                                                                    {t('clients.available', 'Available')}
                                                                </FormLabel>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                {form.watch(`schedule.${day.key}.is_available` as any) && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <FormField
                                                            control={form.control}
                                                            name={`schedule.${day.key}.start_time` as any}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-sm">
                                                                        {t('clients.startTime', 'Start Time')}
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            type="time"
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
                                                            name={`schedule.${day.key}.end_time` as any}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-sm">
                                                                        {t('clients.endTime', 'End Time')}
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            type="time"
                                                                            {...field}
                                                                            disabled={isLoading}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                            </TabsContents>
                        </Tabs>

                        <DialogFooter className="flex-col sm:flex-row gap-2 fixed bottom-0 left-0 right-0 bg-background p-4">
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
                                        {loadingText}
                                    </>
                                ) : (
                                    submitButtonText
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default ContactModal;
