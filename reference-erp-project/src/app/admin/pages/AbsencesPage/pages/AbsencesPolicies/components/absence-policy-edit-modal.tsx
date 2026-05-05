import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { useTranslation } from '@/hooks/useTranslation';
import { patchAbsencePolicy, postAbsencePolicy } from '@/api/orgs/absences/absences';

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
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';
import IdBadge from '@/app/components/id-badge';

/** Policy shape used by this modal (id, name, description, is_default). */
export interface AbsencePolicyForModal {
    id: string;
    name: string;
    description?: string | null;
    is_default?: boolean;
}

interface AbsencePolicyEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAbsencePolicyCreatedOrUpdated?: () => void;
    orgId: string;
    policy?: AbsencePolicyForModal;
    mode: 'create' | 'edit';
    renderActions?: () => React.ReactNode;
}

const formSchema = z.object({
    name: z
        .string()
        .min(1, 'Absence policy name is required')
        .min(2, 'Absence policy name must be at least 2 characters')
        .max(64, 'Absence policy name must be less than 64 characters')
        .trim(),
    description: z
        .string()
        .max(500, 'Description must be less than 500 characters')
        .optional(),
    is_default: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const AbsencePolicyEditModal: React.FC<AbsencePolicyEditModalProps> = ({
    open,
    onOpenChange,
    onAbsencePolicyCreatedOrUpdated,
    orgId,
    policy,
    mode,
    renderActions,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();

    // Determine if we're in edit mode
    const isEditMode = mode === 'edit';

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: policy?.name || '',
            description: policy?.description || '',
            is_default: policy?.is_default ?? false,
        },
    });

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            const requestData = {
                name: values.name,
                description: values.description || null,
                is_default: values.is_default,
            };

            let response;
            if (isEditMode && policy) {
                response = await patchAbsencePolicy(orgId, policy.id, requestData);
            } else {
                response = await postAbsencePolicy(orgId, requestData);
            }

            if (response.success) {
                toast.success(
                    isEditMode
                        ? t('absence-policies.policies.updatedSuccess', 'Absence policy updated successfully')
                        : t('absence-policies.policies.createdSuccess', 'Absence policy created successfully')
                );
                form.reset();
                onOpenChange(false);
                if (onAbsencePolicyCreatedOrUpdated) {
                    onAbsencePolicyCreatedOrUpdated();
                }
            } else {
                toast.error(
                    response.error ||
                    (isEditMode
                        ? t('absence-policies.policies.updateError', 'Failed to update absence policy')
                        : t('absence-policies.policies.createError', 'Failed to create absence policy'))
                );
            }
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} absence policy:`, error);
            toast.error(
                isEditMode
                    ? t('absence-policies.policies.updateError', 'Failed to update absence policy')
                    : t('absence-policies.policies.createError', 'Failed to create absence policy')
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
                name: policy?.name || '',
                description: policy?.description || '',
                is_default: policy?.is_default ?? false,
            });
        }
    }, [open, form, policy]);

    const dialogTitle = isEditMode
        ? t('absence-policies.policies.editPolicy', 'Edit Absence Policy')
        : t('absence-policies.policies.createNew', 'Create New Absence Policy');
    const submitButtonText = isEditMode
        ? t('common.save', 'Save')
        : t('common.create', 'Create');
    const loadingText = isEditMode
        ? t('absence-policies.policies.updating', 'Updating Policy...')
        : t('absence-policies.policies.creating', 'Creating Policy...');

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
                        {isEditMode && policy && renderActions && (
                            <div className="flex items-center gap-2">
                                <IdBadge id={policy.id} hideIcon={true} />
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
                                        {t('absence-policies.policies.name', 'Name')} *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t('absence-policies.policies.namePlaceholder', 'e.g., Standard Leave Policy, Remote Work Policy')}
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
                                        {t('absence-policies.policies.description', 'Description')}
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t('absence-policies.policies.descriptionPlaceholder', 'Optional description for this absence policy')}
                                            {...field}
                                            disabled={isLoading}
                                            rows={3}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="is_default"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <FormLabel>
                                            {t('absence-policies.policies.isDefault', 'Default policy')}
                                        </FormLabel>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                    </div>
                                    <FormDescription className="text-xs text-muted-foreground pl-4">
                                        {t('absence-policies.policies.isDefaultDescription', 'Set as the default absence policy for the organization')}
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
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                form.handleSubmit(onSubmit)(e);
                            }}
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

export default AbsencePolicyEditModal;