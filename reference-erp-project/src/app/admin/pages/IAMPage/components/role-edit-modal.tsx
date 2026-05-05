import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useParams } from 'react-router';
import { Loader2 } from 'lucide-react';

import { useTranslation } from '@/hooks/useTranslation';
import { postOrgRole, patchOrgRole } from '@/api/orgs/roles/roles';
import { Role } from '@/types/general/roles';

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
import IdBadge from '@/app/components/id-badge';

interface RoleEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onRoleCreatedOrUpdated?: () => void;
    role?: Role | null;
    mode: 'create' | 'edit';
    renderActions?: () => React.ReactNode;
}

const formSchema = z.object({
    name: z
        .string()
        .min(1, 'Name is required')
        .min(2, 'Name must be at least 2 characters')
        .max(128, 'Name must be less than 128 characters')
        .trim(),
    description: z
        .string()
        .min(1, 'Description is required')
        .max(500, 'Description must be less than 500 characters')
        .trim(),
});

type FormValues = z.infer<typeof formSchema>;

const RoleEditModal: React.FC<RoleEditModalProps> = ({
    open,
    onOpenChange,
    onRoleCreatedOrUpdated,
    role,
    mode,
    renderActions,
}) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditMode = mode === 'edit';

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            description: '',
        },
    });

    // Reset form when modal opens or role changes
    useEffect(() => {
        if (open) {
            if (isEditMode && role) {
                form.reset({
                    name: role.name || '',
                    description: role.description || '',
                });
            } else {
                form.reset({
                    name: '',
                    description: '',
                });
            }
        }
    }, [open, role, isEditMode, form]);

    const onSubmit = async (values: FormValues) => {
        if (!orgId) {
            toast.error(t('common.error', 'An error occurred'));
            return;
        }

        setIsSubmitting(true);

        try {
            const apiData = {
                name: values.name,
                description: values.description,
            };

            let response;
            if (isEditMode && role?.id) {
                response = await patchOrgRole(orgId, role.id, apiData);
            } else {
                response = await postOrgRole(orgId, apiData);
            }

            if (response.success) {
                toast.success(
                    isEditMode
                        ? t('admin.iam.roleUpdatedSuccessfully', 'Role updated successfully')
                        : t('admin.iam.roleCreatedSuccessfully', 'Role created successfully')
                );
                onRoleCreatedOrUpdated?.();
                onOpenChange(false);
            } else {
                toast.error(
                    isEditMode
                        ? t('admin.iam.errorUpdatingRole', 'Error updating role')
                        : t('admin.iam.errorCreatingRole', 'Error creating role')
                );
            }
        } catch (error) {
            toast.error(
                isEditMode
                    ? t('admin.iam.errorUpdatingRole', 'Error updating role')
                    : t('admin.iam.errorCreatingRole', 'Error creating role')
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = async (open: boolean) => {
        if (!open) {
            if (form.formState.isDirty) {
                const discard = await promptUnsavedChanges();
                if (discard) {
                    if (mode === 'create') {
                        form.reset();
                    }
                    onOpenChange(false);
                }
            } else {
                if (mode === 'create') {
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

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="sm:max-w-[500px]"
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
                showCloseButton={!isEditMode}
            >
                <DialogHeader>
                    <DialogTitle>
                        {isEditMode ? (
                            <div className="flex items-center justify-between w-full">
                                <span>{t('admin.iam.editRole', 'Edit Role')}</span>
                                <div className="flex items-center gap-2">
                                    {role && <IdBadge id={role.id} />}
                                    {renderActions && renderActions()}
                                </div>
                            </div>
                        ) : (
                            t('admin.iam.addRole', 'Add Role')
                        )}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        {/* Name Field */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t('admin.iam.name', 'Name')} *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder={t('admin.iam.namePlaceholder', 'e.g., Manager')}
                                            disabled={isSubmitting}
                                            autoFocus
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Description Field */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t('admin.iam.description', 'Description')} *
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder={t('admin.iam.descriptionPlaceholder', 'Describe the role...')}
                                            disabled={isSubmitting}
                                            rows={4}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                {t('common.cancel', 'Cancel')}
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {isEditMode
                                            ? t('common.updating', 'Updating...')
                                            : t('common.creating', 'Creating...')
                                        }
                                    </>
                                ) : (
                                    isEditMode
                                        ? t('common.update', 'Update')
                                        : t('common.create', 'Create')
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default RoleEditModal;

