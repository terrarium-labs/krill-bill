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
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';
import { postChecklist, patchChecklist } from '@/api/orgs/checklists/checklists';
import { Loader2 } from 'lucide-react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';
import { Checklist } from '@/types/general/checklists';

type FormValues = {
    name: string;
    description?: string;
};

interface ChecklistEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onChecklistCreated?: () => void;
    orgId: string;
    checklist?: Checklist | null; // Optional prop for editing
}

const formSchema = z.object({
    name: z.string()
        .min(1, 'Checklist name is required')
        .min(2, 'Checklist name must be at least 2 characters')
        .max(128, 'Checklist name must be less than 128 characters')
        .trim(),
    description: z.string()
        .max(500, 'Description must be less than 500 characters')
        .optional(),
});

const ChecklistEditModal: React.FC<ChecklistEditModalProps> = ({
    open,
    onOpenChange,
    onChecklistCreated,
    orgId,
    checklist
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();

    // Determine if we're in edit mode
    const isEditMode = !!checklist;

    const getDefaultValues = (checklist?: Checklist): FormValues => {
        if (!checklist) {
            return {
                name: "",
                description: "",
            };
        }

        return {
            name: checklist.name || '',
            description: checklist.description || '',
        };
    };

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: getDefaultValues(checklist != null ? checklist : undefined),
    });

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            const requestData = {
                name: values.name,
                description: values.description || null,
                data: checklist?.data || {},
            };

            // Use PATCH for editing, POST for creating
            const response = isEditMode && checklist
                ? await patchChecklist(orgId, checklist.id, requestData)
                : await postChecklist(orgId, requestData);

            if (response.success) {
                const successMessage = isEditMode
                    ? t('checklists.updatedSuccess', 'Checklist updated successfully')
                    : t('checklists.createdSuccess', 'Checklist created successfully');

                toast.success(successMessage);

                if (!isEditMode) {
                    form.reset();
                }

                onOpenChange(false);

                if (onChecklistCreated) {
                    onChecklistCreated();
                }
            } else {
                const errorMessage = isEditMode
                    ? response.error || t('checklists.updateError', 'Failed to update checklist')
                    : response.error || t('checklists.createError', 'Failed to create checklist');

                toast.error(errorMessage);
            }
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} checklist:`, error);
            const errorMessage = isEditMode
                ? t('checklists.updateError', 'Failed to update checklist')
                : t('checklists.createError', 'Failed to create checklist');

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

    // Reset form when checklist changes or modal opens
    useEffect(() => {
        if (open) {
            form.reset(getDefaultValues(checklist != null ? checklist : undefined));
        }
    }, [open, checklist, form]);

    const dialogTitle = isEditMode
        ? t('checklists.editChecklist', 'Edit Checklist')
        : t('checklists.createNew', 'Create New Checklist');

    const submitButtonText = isEditMode
        ? t('common.update', 'Update')
        : t('common.create', 'Create');

    const loadingText = isEditMode
        ? t('checklists.updating', 'Updating...')
        : t('checklists.creating', 'Creating...');

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
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t('checklists.name', 'Name')} *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t('checklists.namePlaceholder', 'e.g., Pre-inspection checklist, Safety checklist')}
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
                                        {t('checklists.description', 'Description')}
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t('checklists.descriptionPlaceholder', 'Optional description for this checklist')}
                                            {...field}
                                            disabled={isLoading}
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

export default ChecklistEditModal;
