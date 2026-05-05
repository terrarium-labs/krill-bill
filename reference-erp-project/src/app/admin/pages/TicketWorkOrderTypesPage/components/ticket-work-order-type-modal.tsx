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
import {
    patchOrgTicketWorkOrderType,
    postOrgTicketWorkOrderType,
} from '@/api/field-service/tickets-work-orders-types/tickets-work-orders-types';
import { Loader2 } from 'lucide-react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';
import { TicketWorkOrderType } from '@/types/field-service/ticket-work-order-types';
import ColorPicker from '@/app/components/forms-elements/color-picker';

type FormValues = {
    name: string;
    description: string;
    color: string;
};

interface TicketWorkOrderTypeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTypeCreatedOrUpdated?: () => void;
    orgId: string;
    mode: 'create' | 'edit';
    ticketWorkOrderType?: TicketWorkOrderType | null;
    renderActions?: ReactNode;
}

const formSchema = z.object({
    name: z.string()
        .min(1, 'Type name is required')
        .min(2, 'Type name must be at least 2 characters')
        .max(64, 'Type name must be less than 64 characters')
        .trim(),
    description: z.string()
        .max(500, 'Description must be less than 500 characters'),
    color: z.string()
        .min(1, 'Color is required'),
});

const TicketWorkOrderTypeModal: React.FC<TicketWorkOrderTypeModalProps> = ({
    open,
    onOpenChange,
    onTypeCreatedOrUpdated,
    orgId,
    mode,
    ticketWorkOrderType,
    renderActions,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();

    // Determine if we're in edit mode
    const isEditMode = mode === 'edit';

    const getDefaultValues = (type?: TicketWorkOrderType): FormValues => {
        if (!type) {
            return {
                name: "",
                description: "",
                color: 'blue',
            };
        }

        return {
            name: type.name || '',
            description: type.description || '',
            color: type.color || 'grey',
        };
    };

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: getDefaultValues(ticketWorkOrderType != null ? ticketWorkOrderType : undefined),
    });

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            const requestData = {
                name: values.name,
                description: values.description,
                color: values.color,
            };

            let response;
            if (isEditMode) {
                // Use PATCH for editing
                response = await patchOrgTicketWorkOrderType(orgId, ticketWorkOrderType!.id, requestData);
            } else {
                // Use POST for creating
                response = await postOrgTicketWorkOrderType(orgId, requestData);
            }

            if (response.success) {
                const successMessage = isEditMode
                    ? t('admin.ticketWorkOrderTypes.updatedSuccess', 'Ticket work order type updated successfully')
                    : t('admin.ticketWorkOrderTypes.createdSuccess', 'Ticket work order type created successfully');

                toast.success(successMessage);

                if (!isEditMode) {
                    form.reset();
                }

                onOpenChange(false);

                if (onTypeCreatedOrUpdated) {
                    onTypeCreatedOrUpdated();
                }
            } else {
                const errorMessage = isEditMode
                    ? response.error || t('admin.ticketWorkOrderTypes.updateError', 'Failed to update ticket work order type')
                    : response.error || t('admin.ticketWorkOrderTypes.createError', 'Failed to create ticket work order type');

                toast.error(errorMessage);
            }
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} ticket work order type:`, error);
            const errorMessage = isEditMode
                ? t('admin.ticketWorkOrderTypes.updateError', 'Failed to update ticket work order type')
                : t('admin.ticketWorkOrderTypes.createError', 'Failed to create ticket work order type');

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

    // Reset form when ticketWorkOrderType changes or modal opens
    useEffect(() => {
        if (open) {
            form.reset(getDefaultValues(ticketWorkOrderType != null ? ticketWorkOrderType : undefined));
        }
    }, [open, ticketWorkOrderType, form, isEditMode]);

    const dialogTitle = isEditMode
        ? t('admin.ticketWorkOrderTypes.editType', 'Edit Ticket Work Order Type')
        : t('admin.ticketWorkOrderTypes.createNew', 'Create New Ticket Work Order Type');

    const submitButtonText = isEditMode
        ? t('common.update', 'Update')
        : t('common.create', 'Create');

    const loadingText = isEditMode
        ? t('admin.ticketWorkOrderTypes.updating', 'Updating...')
        : t('admin.ticketWorkOrderTypes.creating', 'Creating...');

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="max-w-2xl md:min-w-md w-full max-h-[90vh] overflow-y-auto"
                showCloseButton={false}
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold">
                        <span>{dialogTitle}</span>
                        {isEditMode && ticketWorkOrderType && (
                            <div className="flex items-center gap-2">
                                <IdBadge id={ticketWorkOrderType.id} />
                                {renderActions}
                            </div>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
                        {/* Name and Color Picker Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t('admin.ticketWorkOrderTypes.name', 'Name')} *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder={t('admin.ticketWorkOrderTypes.namePlaceholder', 'e.g., Maintenance, Repair, Installation')}
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
                                                label={t('admin.ticketWorkOrderTypes.color', 'Color')}
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
                                        {t('admin.ticketWorkOrderTypes.description', 'Description')}
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t('admin.ticketWorkOrderTypes.descriptionPlaceholder', 'Optional description for this type')}
                                            {...field}
                                            disabled={isLoading}
                                            rows={3}
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
                                disabled={isLoading}
                            >
                                {t('common.cancel', 'Cancel')}
                            </Button>
                            <Button
                                type="submit"
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
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default TicketWorkOrderTypeModal;
