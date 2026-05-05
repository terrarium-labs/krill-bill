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
    FormDescription,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import IdBadge from "@/app/components/id-badge";
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';
import {
    patchOrgOrderType,
    postOrgOrderType,
    getOrgOrderTypes,
} from '@/api/orgs/order-types/order-types';
import { Loader2 } from 'lucide-react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';
import { OrderType } from '@/types/general/order-types';
import { useParams } from 'react-router';
import { MultiSelectApiHierarchy } from '@/app/components/forms-elements/multi-select-api-hierarchy';

type FormValues = {
    name: string;
    description: string;
    parent_type_id?: string;
};

interface OrderTypeEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTypeCreated?: () => void;
    mode: 'create' | 'edit';
    orderTypeToEdit?: OrderType | null;
    renderActions?: ReactNode;
    allOrderTypes: OrderType[];
}

const formSchema = z.object({
    name: z.string()
        .min(1, 'Type name is required')
        .min(2, 'Type name must be at least 2 characters')
        .max(100, 'Type name must be less than 100 characters')
        .trim(),
    description: z.string()
        .max(500, 'Description must be less than 500 characters'),
    parent_type_id: z.string().optional(),
});

const OrderTypeEditModal: React.FC<OrderTypeEditModalProps> = ({
    open,
    onOpenChange,
    onTypeCreated,
    mode,
    orderTypeToEdit,
    renderActions,
    allOrderTypes,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();
    const { orgId } = useParams();

    // Determine if we're in edit mode
    const isEditMode = mode === 'edit';

    const getDefaultValues = (type?: OrderType): FormValues => {
        if (!type) {
            return {
                name: "",
                description: "",
                parent_type_id: undefined,
            };
        }

        return {
            name: type.name || '',
            description: type.description || '',
            parent_type_id: type.parent_type?.id || undefined,
        };
    };

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: getDefaultValues(orderTypeToEdit != null ? orderTypeToEdit : undefined),
    });

    const onSubmit = async (values: FormValues) => {
        if (!orgId) return;

        setIsLoading(true);
        try {
            const requestData = {
                name: values.name,
                description: values.description,
                parent_type_id: values.parent_type_id || undefined,
            };

            let response;
            if (isEditMode) {
                // Use PATCH for editing
                response = await patchOrgOrderType(orgId, orderTypeToEdit!.id, requestData);
            } else {
                // Use POST for creating
                response = await postOrgOrderType(orgId, requestData);
            }

            if (response.success) {
                const successMessage = isEditMode
                    ? t('admin.orderTypes.updatedSuccess', 'Order type updated successfully')
                    : t('admin.orderTypes.createdSuccess', 'Order type created successfully');

                toast.success(successMessage);

                if (!isEditMode) {
                    form.reset();
                }

                onOpenChange(false);

                if (onTypeCreated) {
                    onTypeCreated();
                }
            } else {
                const errorMessage = isEditMode
                    ? response.error || t('admin.orderTypes.updateError', 'Failed to update order type')
                    : response.error || t('admin.orderTypes.createError', 'Failed to create order type');

                toast.error(errorMessage);
            }
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} order type:`, error);
            const errorMessage = isEditMode
                ? t('admin.orderTypes.updateError', 'Failed to update order type')
                : t('admin.orderTypes.createError', 'Failed to create order type');

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

    // Reset form when orderTypeToEdit changes or modal opens
    useEffect(() => {
        if (open) {
            form.reset(getDefaultValues(orderTypeToEdit != null ? orderTypeToEdit : undefined));
        }
    }, [open, orderTypeToEdit, form, isEditMode]);

    const dialogTitle = isEditMode
        ? t('admin.orderTypes.editType', 'Edit Order Type')
        : t('admin.orderTypes.createNew', 'Create New Order Type');

    const submitButtonText = isEditMode
        ? t('common.update', 'Update')
        : t('common.create', 'Create');

    const loadingText = isEditMode
        ? t('admin.orderTypes.updating', 'Updating...')
        : t('admin.orderTypes.creating', 'Creating...');

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
                        {isEditMode && orderTypeToEdit && (
                            <div className="flex items-center gap-2">
                                <IdBadge id={orderTypeToEdit.id} />
                                {renderActions}
                            </div>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
                        {/* Name */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t('admin.orderTypes.name', 'Name')} *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t('admin.orderTypes.namePlaceholder', 'e.g., Purchase Order, Sales Order')}
                                            {...field}
                                            disabled={isLoading}
                                            autoFocus
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Parent Type */}
                        <FormField
                            control={form.control}
                            name="parent_type_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t('admin.orderTypes.parentType', 'Parent Type')}
                                    </FormLabel>
                                    <FormControl>
                                        <MultiSelectApiHierarchy
                                            parentKey="parent_type"
                                            fetchOptions={getOrgOrderTypes}
                                            fetchArgs={[orgId!]}
                                            optionsKey="order_types"
                                            customValueKey={(item) => item.id}
                                            customLabelKey={(item) => item.name}
                                            customIsItemDisabled={(item) => {
                                                if (!isEditMode || !orderTypeToEdit) return false;

                                                // Can't set self as parent
                                                if (item.id === orderTypeToEdit.id) return true;

                                                // Can't set any descendant as parent (to prevent circular references)
                                                let current: OrderType | undefined = item;
                                                while (current?.parent_type) {
                                                    if (current.parent_type.id === orderTypeToEdit.id) {
                                                        return true;
                                                    }
                                                    // Find the parent in allOrderTypes to continue traversal
                                                    current = allOrderTypes.find(t => t.id === current!.parent_type!.id);
                                                }
                                                return false;
                                            }}
                                            value={field.value ? [field.value] : []}
                                            defaultItems={orderTypeToEdit?.parent_type ? [orderTypeToEdit.parent_type] : undefined}
                                            onChangeValue={(values) => field.onChange(values[0] || undefined)}
                                            placeholder={t('admin.orderTypes.selectParent', 'Select parent type (optional)')}
                                            searchPlaceholder={t('common.search', 'Search...')}
                                            emptyText={t('common.noResults', 'No results found')}
                                            disabled={isLoading}
                                            maxCount={1}
                                            className="w-full"
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs text-muted-foreground">
                                        {t(
                                            "admin.orderTypes.parentTypeDescription",
                                            "Parent groups for this type in the hierarchy (e.g. sales vs purchase families).",
                                        )}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Description */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t('admin.orderTypes.description', 'Description')}
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t('admin.orderTypes.descriptionPlaceholder', 'Optional description for this type')}
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

export default OrderTypeEditModal;
