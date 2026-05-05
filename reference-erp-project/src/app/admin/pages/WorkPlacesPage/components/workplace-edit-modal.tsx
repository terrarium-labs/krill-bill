import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { postWorkplace, patchWorkplace } from '@/api/orgs/workplaces/workplaces';
import { Workplace } from '@/types/general/workplaces';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DynamicIcon } from 'lucide-react/dynamic';
import { PhoneInput } from '@/app/components/forms-elements/phone-input';
import CountriesInput from '@/app/components/forms-elements/countries-input';
import { TIMEZONE_OPTIONS } from '@/utils/timezones';
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';
import { IconPicker } from '@/components/ui/icon-picker';
import IdBadge from '@/app/components/id-badge';

// Form validation schema
const workplaceSchema = z.object({
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(1, "Phone is required"),
    address_line_1: z.string().min(1, "Address line 1 is required"),
    address_line_2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    postal_code: z.string().min(1, "Postal code is required"),
    state_province: z.string().min(1, "State/Province is required"),
    country: z.string().min(1, "Country is required"),
    timezone: z.string().min(1, "Timezone is required"),
    description: z.string().optional(),
    icon_url: z.string().min(1, "Icon is required"),
});

type FormValues = z.infer<typeof workplaceSchema>;

interface WorkplaceEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onWorkplaceCreated?: () => void;
    orgId: string;
    workplace?: Workplace | null; // Optional workplace data for editing
    mode?: 'create' | 'update'; // Modal mode
    /** Render custom action buttons in the header (right side, next to ID badge). Receives the workplace and a close function. */
    renderActions?: (workplace: Workplace, closeModal: () => void) => React.ReactNode;
}

const WorkplaceEditModal: React.FC<WorkplaceEditModalProps> = ({
    open,
    onOpenChange,
    onWorkplaceCreated,
    orgId,
    workplace = null,
    mode = 'create',
    renderActions,
}) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    // Determine if we're in edit mode
    const isEditMode = mode === 'update' || !!workplace;

    const getDefaultValues = (workplaceData?: Workplace | null): FormValues => {
        if (!workplaceData) {
            return {
                name: "",
                phone: "",
                address_line_1: "",
                address_line_2: "",
                city: "",
                postal_code: "",
                state_province: "",
                country: "ES",
                timezone: "Europe/Madrid",
                description: "",
                icon_url: "map-pin",
            };
        }

        return {
            name: workplaceData.name || "",
            phone: workplaceData.phone || "",
            address_line_1: workplaceData.address_line_1 || "",
            address_line_2: workplaceData.address_line_2 || "",
            city: workplaceData.city || "",
            postal_code: workplaceData.postal_code || "",
            state_province: workplaceData.state_province || "",
            country: workplaceData.country || "ES",
            timezone: workplaceData.timezone || "Europe/Madrid",
            description: workplaceData.description || "",
            icon_url: workplaceData.icon_url || "map-pin",
        };
    };

    const form = useForm<FormValues>({
        resolver: zodResolver(workplaceSchema),
        defaultValues: getDefaultValues(workplace),
    });

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            const requestData = {
                name: values.name,
                phone: values.phone || null,
                address_line_1: values.address_line_1,
                address_line_2: values.address_line_2 || null,
                city: values.city,
                postal_code: values.postal_code,
                state_province: values.state_province,
                country: values.country,
                timezone: values.timezone,
                description: values.description || null,
                icon_url: values.icon_url,
            };

            let response;

            if (isEditMode && workplace) {
                // Use PATCH for editing
                response = await patchWorkplace(orgId, workplace.id, requestData);
            } else {
                // Use POST for creating
                response = await postWorkplace(orgId, requestData);
            }

            if (response.success) {
                const successMessage = isEditMode
                    ? t('admin.workplaces.updatedSuccess', 'Workplace updated successfully')
                    : t('admin.workplaces.createdSuccess', 'Workplace created successfully');

                toast.success(successMessage);

                if (!isEditMode) {
                    form.reset();
                }

                onOpenChange(false);

                if (onWorkplaceCreated) {
                    onWorkplaceCreated();
                }
            } else {
                const errorMessage = isEditMode
                    ? response.error || t('admin.workplaces.updateError', 'Failed to update workplace')
                    : response.error || t('admin.workplaces.createError', 'Failed to create workplace');

                toast.error(errorMessage);
            }
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} workplace:`, error);
            const errorMessage = isEditMode
                ? t('admin.workplaces.updateError', 'Failed to update workplace')
                : t('admin.workplaces.createError', 'Failed to create workplace');
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

    // Reset form when modal opens or workplace changes
    useEffect(() => {
        if (open) {
            form.reset(getDefaultValues(workplace));
        }
    }, [open, workplace, form]);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange} key="new-workplace-dialog">
            <DialogContent
                className="max-w-2xl md:min-w-2xl"
                showCloseButton={false}
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold">
                        <span>
                            {isEditMode
                                ? t('admin.workplaces.edit', 'Edit Workplace')
                                : t('admin.workplaces.createNew', 'Create New Workplace')
                            }
                        </span>
                        {isEditMode && workplace && (
                            <div className="flex items-center gap-2">
                                <IdBadge id={workplace.id} />
                                {renderActions?.(workplace, () => handleOpenChange(false))}
                            </div>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-6 overflow-y-auto max-h-[70vh] px-2 scrollbar-hide mb-16">
                        {/* Basic Information - 2 columns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('admin.workplaces.name', 'Name')} *
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t('admin.workplaces.namePlaceholder', 'e.g., Main Office, Warehouse')}
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
                                name="icon_url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t("common.icon", "Icono")} *
                                        </FormLabel>
                                        <FormControl>
                                            <IconPicker
                                                value={field.value as any}
                                                onValueChange={(icon) => field.onChange(icon)}
                                                searchPlaceholder="Buscar icono..."
                                                triggerPlaceholder="Seleccionar icono"
                                                disabled={isLoading}
                                            >
                                                <div className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-muted h-9 shadow-xs">
                                                    {field.value ? (
                                                        <>
                                                            <DynamicIcon
                                                                name={field.value as any}
                                                                className="h-4 w-4"
                                                            />
                                                            <span className="text-sm">{field.value}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">
                                                            Seleccionar icono
                                                        </span>
                                                    )}
                                                </div>
                                            </IconPicker>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Contact Information - 2 columns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">
                            <div className="col-span-1">
                                <PhoneInput
                                    form={form}
                                    name="phone"
                                    required={true}
                                    label={t('admin.workplaces.phone', 'Phone')}
                                    placeholder="123456789"
                                    disabled={isLoading}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="timezone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('admin.workplaces.timezone', 'Timezone')} *
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder={t('admin.workplaces.timezonePlaceholder', 'Select a timezone')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {TIMEZONE_OPTIONS.map((timezone) => (
                                                    <SelectItem key={timezone.value} value={timezone.value}>
                                                        {timezone.gmt} {timezone.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Address Information */}
                        <FormField
                            control={form.control}
                            name="address_line_1"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t('admin.workplaces.addressLine1', 'Address')} *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t('admin.workplaces.addressLine1Placeholder', 'Street address')}
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
                                <FormItem>
                                    <FormLabel>
                                        {t('admin.workplaces.addressLine2', 'Address Line 2')}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t('admin.workplaces.addressLine2Placeholder', 'Apartment, suite, etc.')}
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Location Details - 2 columns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('admin.workplaces.city', 'City')} *
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t('admin.workplaces.cityPlaceholder', 'City')}
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
                                            {t('admin.workplaces.postalCode', 'Postal Code')} *
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t('admin.workplaces.postalCodePlaceholder', 'Postal/ZIP code')}
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* State and Country - 2 columns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">
                            <FormField
                                control={form.control}
                                name="state_province"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('admin.workplaces.stateProvince', 'State/Province')} *
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t('admin.workplaces.stateProvincePlaceholder', 'State or Province')}
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
                                label={t('admin.workplaces.country', 'Country') + ' *'}
                            />
                        </div>

                        {/* Description */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t('admin.workplaces.description', 'Description')}
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t('admin.workplaces.descriptionPlaceholder', 'Optional description for this workplace')}
                                            {...field}
                                            disabled={isLoading}
                                            rows={3}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
                                        {isEditMode
                                            ? t('admin.workplaces.updating', 'Updating Workplace...')
                                            : t('admin.workplaces.creating', 'Creating Workplace...')
                                        }
                                    </>
                                ) : (
                                    isEditMode
                                        ? t('common.update', 'Update')
                                        : t('common.create', 'Create')
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default WorkplaceEditModal; 