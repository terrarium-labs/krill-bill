import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { useTranslation } from '@/hooks/useTranslation';
import { postOrgSections, patchOrgSections } from '@/api/orgs/sections/sections';

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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';

interface SectionEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSectionCreated?: () => void;
    orgId: string;
    section?: {
        id: string;
        title: string;
        handler: string;
    };
    table_name: string;
}

const formSchema = z.object({
    title: z
        .string()
        .min(1, 'Section title is required')
        .min(2, 'Section title must be at least 2 characters')
        .max(64, 'Section title must be less than 64 characters')
        .trim(),
    handler: z
        .string()
        .min(1, 'Handler is required')
        .min(2, 'Handler must be at least 2 characters')
        .max(32, 'Handler must be less than 32 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Handler can only contain letters, numbers, and underscores')
        .trim(),
});

type FormValues = z.infer<typeof formSchema>;

const SectionEditModal: React.FC<SectionEditModalProps> = ({
    open,
    onOpenChange,
    onSectionCreated,
    orgId,
    section,
    table_name,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();

    // Determine if we're in edit mode
    const isEditMode = !!section;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: section?.title || '',
            handler: section?.handler || '',
        },
    });

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            const requestData = {
                title: values.title,
                handler: values.handler,
                table_name: table_name,
            };

            let response;
            if (isEditMode && section) {
                response = await patchOrgSections(orgId, section.id, requestData);
            } else {
                response = await postOrgSections(orgId, requestData);
            }

            if (response.success) {
                toast.success(
                    isEditMode
                        ? t('admin.customFields.section.updatedSuccess', 'Section updated successfully')
                        : t('admin.customFields.section.createdSuccess', 'Section created successfully')
                );
                form.reset();
                onOpenChange(false);
                if (onSectionCreated) {
                    onSectionCreated();
                }
            } else {
                toast.error(
                    response.error ||
                    (isEditMode
                        ? t('admin.customFields.section.updateError', 'Failed to update section')
                        : t('admin.customFields.section.createError', 'Failed to create section'))
                );
            }
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} section:`, error);
            toast.error(
                isEditMode
                    ? t('admin.customFields.section.updateError', 'Failed to update section')
                    : t('admin.customFields.section.createError', 'Failed to create section')
            );
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

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            form.reset({
                title: section?.title || '',
                handler: section?.handler || '',
            });
        }
    }, [open, form, section]);

    const dialogTitle = isEditMode
        ? t('admin.customFields.section.editSection', 'Edit Section')
        : t('admin.customFields.section.createNew', 'Create New Section');
    const submitButtonText = isEditMode
        ? t('common.save', 'Save')
        : t('common.create', 'Create');
    const loadingText = isEditMode
        ? t('admin.customFields.section.updating', 'Updating Section...')
        : t('admin.customFields.section.creating', 'Creating Section...');

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="max-w-lg"
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
                showCloseButton={false}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                        {dialogTitle}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t('admin.customFields.section.title', 'Title')} *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t('admin.customFields.section.titlePlaceholder', 'e.g., Contact Information, Additional Details')}
                                            {...field}
                                            disabled={isLoading}
                                            autoFocus
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs text-muted-foreground">
                                        {t(
                                            "admin.customFields.section.titleFieldDescription",
                                            "Heading shown when users expand this section of custom fields.",
                                        )}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="handler"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t('admin.customFields.section.handler', 'Handler')} *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t('admin.customFields.section.handlerPlaceholder', 'e.g., contact_info, additional_details')}
                                            {...field}
                                            disabled={isLoading}
                                            onChange={(e) => {
                                                // Convert to lowercase and replace spaces with underscores
                                                const value = e.target.value.toLowerCase().replace(/\s+/g, '_');
                                                field.onChange(value);
                                            }}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs text-muted-foreground">
                                        {t(
                                            "admin.customFields.section.handlerHelp",
                                            "Unique identifier for this section. Only letters, numbers, and underscores allowed.",
                                        )}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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
                        <Button
                            type="submit"
                            onClick={form.handleSubmit(onSubmit)}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
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

export default SectionEditModal;
