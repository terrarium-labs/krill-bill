import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
    FormDescription,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';
import { patchAbsenceType, postAbsenceType } from '@/api/orgs/absences/absences';
import { Loader2 } from 'lucide-react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { IconPicker, IconName } from '@/components/ui/icon-picker';
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';
import ColorPicker from '@/app/components/forms-elements/color-picker';
import { AbsenceType } from '@/types/general/absences';
import IdBadge from '@/app/components/id-badge';

type FormValues = {
    name: string;
    description?: string;
    color: string;
    icon_url?: string;
};

interface AbsenceTypeEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAbsenceTypeCreatedOrUpdated?: () => void;
    orgId: string;
    absenceType?: AbsenceType | null;
    mode: 'create' | 'edit';
    renderActions?: () => React.ReactNode;
}

const formSchema = z.object({
    name: z.string()
        .min(1, 'Absence type name is required')
        .min(2, 'Absence type name must be at least 2 characters')
        .max(64, 'Absence type name must be less than 64 characters')
        .trim(),
    description: z.string()
        .max(500, 'Description must be less than 500 characters')
        .optional(),
    color: z.string()
        .min(1, 'Color is required'),
    icon_url: z.string().optional(),
});

const AbsenceTypeEditModal: React.FC<AbsenceTypeEditModalProps> = ({
    open,
    onOpenChange,
    onAbsenceTypeCreatedOrUpdated,
    orgId,
    absenceType,
    mode,
    renderActions,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();

    // Determine if we're in edit mode
    const isEditMode = mode === 'edit';

    const getDefaultValues = (absenceType?: AbsenceType): FormValues => {
        if (!absenceType) {
            return {
                name: "",
                description: "",
                color: 'blue', // Default to a blue color
                icon_url: 'palm-tree',
            };
        }

        return {
            name: absenceType.name || '',
            description: absenceType.description || '',
            color: absenceType.color || '#3b82f6',
            icon_url: absenceType.icon_url || 'palm-tree',
        };
    };

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: getDefaultValues(absenceType != null ? absenceType : undefined),
    });

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            const requestData = {
                name: values.name,
                description: values.description || null,
                color: values.color,
                icon_url: values.icon_url || null,
            };

            let response;
            if (isEditMode) {
                // Use PATCH for editing
                response = await patchAbsenceType(orgId, absenceType!.id, requestData);
            } else {
                // Use POST for creating
                response = await postAbsenceType(orgId, requestData);
            }

            if (response.success) {
                const successMessage = isEditMode
                    ? t('absences.types.updatedSuccess', 'Absence type updated successfully')
                    : t('absences.types.createdSuccess', 'Absence type created successfully');

                toast.success(successMessage);

                if (!isEditMode) {
                    form.reset();
                }

                onOpenChange(false);

                if (onAbsenceTypeCreatedOrUpdated) {
                    onAbsenceTypeCreatedOrUpdated();
                }
            } else {
                const errorMessage = isEditMode
                    ? response.error || t('absences.types.updateError', 'Failed to update absence type')
                    : response.error || t('absences.types.createError', 'Failed to create absence type');

                toast.error(errorMessage);
            }
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} absence type:`, error);
            const errorMessage = isEditMode
                ? t('absences.types.updateError', 'Failed to update absence type')
                : t('absences.types.createError', 'Failed to create absence type');

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

    // Reset form when absenceType changes or modal opens
    useEffect(() => {
        if (open) {
            form.reset(getDefaultValues(absenceType != null ? absenceType : undefined));
        }
    }, [open, absenceType, form]);

    const dialogTitle = isEditMode
        ? t('absences.types.editType', 'Edit Absence Type')
        : t('absences.types.createNew', 'Create New Absence Type');

    const submitButtonText = isEditMode
        ? t('common.update', 'Update')
        : t('common.create', 'Create');

    const loadingText = isEditMode
        ? t('absences.types.updating', 'Updating...')
        : t('absences.types.creating', 'Creating...');

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="max-w-lg"
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
                showCloseButton={false}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between text-lg font-semibold">
                        <span>{dialogTitle}</span>
                        {isEditMode && absenceType && renderActions && (
                            <div className="flex items-center gap-2">
                                <IdBadge id={absenceType.id} hideIcon={true} />
                                {renderActions()}
                            </div>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t('absences.types.name', 'Name')} *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t('absences.types.namePlaceholder', 'e.g., Vacation, Sick Leave')}
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
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t('absences.types.description', 'Description')}
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t('absences.types.descriptionPlaceholder', 'Optional description for this absence type')}
                                            {...field}
                                            disabled={isLoading}
                                            rows={3}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="color"
                                render={() => (
                                    <FormItem>
                                        <ColorPicker
                                            form={form}
                                            name="color"
                                            label={t('absences.types.color', 'Color')}
                                            required
                                            disabled={isLoading}
                                        />
                                        <FormDescription className="text-xs text-muted-foreground">
                                            {t(
                                                "absences.types.colorFieldDescription",
                                                "Used in calendars and badges for this absence type.",
                                            )}
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="icon_url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('absences.types.icon', 'Icon')}
                                        </FormLabel>
                                        <FormControl>
                                            <IconPicker
                                                value={field.value as IconName}
                                                onValueChange={(icon) => field.onChange(icon)}
                                                searchPlaceholder={t('absences.types.searchIcon', 'Search for an icon...')}
                                                triggerPlaceholder={t('absences.types.iconPlaceholder', 'Select an icon')}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-xs text-muted-foreground">
                                            {t(
                                                "absences.types.iconFieldDescription",
                                                "Visual cue in lists and quick-add menus.",
                                            )}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
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
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default AbsenceTypeEditModal; 