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

interface StatusTemplateMetadataModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (values: FormValues) => Promise<void>;
    statusTemplate: StatusTemplate;
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

const StatusTemplateMetadataModal: React.FC<StatusTemplateMetadataModalProps> = ({
    open,
    onOpenChange,
    onSave,
    statusTemplate,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: statusTemplate.name || '',
            description: statusTemplate.description || '',
            color: statusTemplate.color || '#3b82f6',
        },
    });

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            await onSave(values);
            toast.success(t('statusTemplates.updatedSuccess', 'Status template updated successfully'));
            onOpenChange(false);
        } catch (error) {
            console.error('Error updating status template metadata:', error);
            toast.error(t('statusTemplates.updateError', 'Failed to update status template'));
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
                name: statusTemplate.name || '',
                description: statusTemplate.description || '',
                color: statusTemplate.color || '#3b82f6',
            });
        }
    }, [open, statusTemplate, form]);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="max-w-2xl"
                showCloseButton={false}
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
            >
                <DialogHeader>
                    <DialogTitle>
                        {t('statusTemplates.editTemplateDetails', 'Edit Template Details')}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-4 py-4">
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
                                    {t('statusTemplates.updating', 'Updating...')}
                                </>
                            ) : (
                                t('common.update', 'Update')
                            )}
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default StatusTemplateMetadataModal;

