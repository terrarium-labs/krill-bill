import React, { useState, useEffect, ReactNode } from 'react';
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
import IdBadge from "@/app/components/id-badge";
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';
import { patchOrgStatusTemplate, postOrgStatusTemplate } from '@/api/orgs/status-templates/status-templates';
import { Loader2 } from 'lucide-react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';
import { StatusTemplate } from '@/types/general/status-templates';
import ColorPicker from '@/app/components/forms-elements/color-picker';

type FormValues = {
    name: string;
    description?: string;
    color: string;
};

interface StatusTemplateEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onStatusTemplateCreatedOrUpdated?: () => void;
    orgId: string;
    mode: 'create' | 'edit';
    statusTemplate?: StatusTemplate | null;
    renderActions?: ReactNode;
    hideStatusEditor?: boolean;
}

const formSchema = z.object({
    name: z.string()
        .min(1, 'Status template name is required')
        .min(2, 'Status template name must be at least 2 characters')
        .max(64, 'Status template name must be less than 64 characters')
        .trim(),
    description: z.string()
        .max(500, 'Description must be less than 500 characters')
        .optional(),
    color: z.string()
        .min(1, 'Color is required'),
});

const StatusTemplateEditModal: React.FC<StatusTemplateEditModalProps> = ({
    open,
    onOpenChange,
    onStatusTemplateCreatedOrUpdated,
    orgId,
    mode,
    statusTemplate,
    renderActions,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [statuses, setStatuses] = useState<any[]>([]);
    const { t } = useTranslation();

    // Determine if we're in edit mode
    const isEditMode = mode === 'edit';

    const getDefaultValues = (statusTemplate?: StatusTemplate): FormValues => {
        if (!statusTemplate) {
            return {
                name: "",
                description: "",
                color: 'blue', // Default to a blue color
            };
        }

        return {
            name: statusTemplate.name || '',
            description: statusTemplate.description || '',
            color: statusTemplate.color || 'grey',
        };
    };

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: getDefaultValues(statusTemplate != null ? statusTemplate : undefined),
    });

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            // Format statuses for API - remove internal flags and only include non-deleted statuses
            // Group by category and assign sequential positions within each category
            const activeStatuses = statuses.filter((status) => !status.isDeleted);

            const categorizedStatuses: Record<string, any[]> = {
                not_started: [],
                active: [],
                done: [],
                closed: [],
            };

            activeStatuses.forEach((status) => {
                if (status.category) {
                    if (!categorizedStatuses[status.category]) {
                        categorizedStatuses[status.category] = [];
                    }
                    categorizedStatuses[status.category].push(status);
                }
            });

            const formattedStatuses: any[] = [];
            Object.keys(categorizedStatuses).forEach((category) => {
                const categoryStatuses = categorizedStatuses[category];
                categoryStatuses
                    .sort((a, b) => (a.position || 0) - (b.position || 0))
                    .forEach((status, index) => {
                        formattedStatuses.push({
                            id: status.isNew ? undefined : status.id,
                            name: status.name,
                            description: status.description || null,
                            category: status.category,
                            position: index,
                            color: status.color,
                        });
                    });
            });

            const requestData = {
                name: values.name,
                description: values.description || null,
                color: values.color,
                statuses: formattedStatuses,
            };

            let response;
            if (isEditMode) {
                // Use PATCH for editing
                response = await patchOrgStatusTemplate(orgId, statusTemplate!.id, requestData);
            } else {
                // Use POST for creating
                response = await postOrgStatusTemplate(orgId, requestData);
            }

            if (response.success) {
                const successMessage = isEditMode
                    ? t('statusTemplates.updatedSuccess', 'Status template updated successfully')
                    : t('statusTemplates.createdSuccess', 'Status template created successfully');

                toast.success(successMessage);

                if (!isEditMode) {
                    form.reset();
                    setStatuses([]);
                }

                onOpenChange(false);

                if (onStatusTemplateCreatedOrUpdated) {
                    onStatusTemplateCreatedOrUpdated();
                }
            } else {
                const errorMessage = isEditMode
                    ? response.error || t('statusTemplates.updateError', 'Failed to update status template')
                    : response.error || t('statusTemplates.createError', 'Failed to create status template');

                toast.error(errorMessage);
            }
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} status template:`, error);
            const errorMessage = isEditMode
                ? t('statusTemplates.updateError', 'Failed to update status template')
                : t('statusTemplates.createError', 'Failed to create status template');

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
                    setStatuses([]);
                    onOpenChange(false);
                }
            } else {
                form.reset();
                setStatuses([]);
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

    // Reset form when statusTemplate changes or modal opens
    useEffect(() => {
        if (open) {
            form.reset(getDefaultValues(statusTemplate != null ? statusTemplate : undefined));
        }
    }, [open, statusTemplate, form, isEditMode]);

    const dialogTitle = isEditMode
        ? t('statusTemplates.editTemplate', 'Edit Status Template')
        : t('statusTemplates.createNew', 'Create New Status Template');

    const submitButtonText = isEditMode
        ? t('common.update', 'Update')
        : t('common.create', 'Create');

    const loadingText = isEditMode
        ? t('statusTemplates.updating', 'Updating...')
        : t('statusTemplates.creating', 'Creating...');

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="max-w-2xl md:min-w-md w-full max-h-[90vh] min-h-[40vh] overflow-y-auto flex flex-col"
                showCloseButton={false}
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold">
                        <span>{dialogTitle}</span>
                        {isEditMode && statusTemplate && (
                            <div className="flex items-center gap-2">
                                <IdBadge id={statusTemplate.id} />
                                {renderActions}
                            </div>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-4 overflow-y-auto max-h-[90vh] px-2 scrollbar-hide mb-16">
                        <div className="space-y-4 mt-4">
                            {/* Name and Color Picker Row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    {t('statusTemplates.name', 'Name')} *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder={t('statusTemplates.namePlaceholder', 'e.g., Pending, In Progress, Completed')}
                                                        {...field}
                                                        disabled={isLoading}
                                                        autoFocus
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <FormField
                                        control={form.control}
                                        name="color"
                                        render={() => (
                                            <FormItem>
                                                <ColorPicker
                                                    form={form}
                                                    name="color"
                                                    label={t('statusTemplates.color', 'Color')}
                                                    required
                                                    disabled={isLoading}
                                                />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('statusTemplates.description', 'Description')}
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder={t('statusTemplates.descriptionPlaceholder', 'Optional description for this status template')}
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

                        <DialogFooter className="flex-col rounded-b-lg sm:flex-row gap-2 fixed bottom-0 left-0 right-0 bg-background p-4">
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

export default StatusTemplateEditModal;
