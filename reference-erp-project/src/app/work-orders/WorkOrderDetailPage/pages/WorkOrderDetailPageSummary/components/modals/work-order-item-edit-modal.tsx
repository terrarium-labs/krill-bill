import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MultiSelectApi } from '@/app/components/forms-elements/multi-select-api';
import { Loader2 } from 'lucide-react';
import { getOrgItems } from '@/api/items/items';
import { postWorkOrderItem, patchWorkOrderItem } from '@/api/field-service/work-orders/items/items';
import { ItemWorkOrder } from '@/types/field-service/work-orders/items';
import { ItemAvatar } from '@/app/components/avatars/item-avatar';
import IdBadge from '@/app/components/id-badge';
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';
import CustomActionsDropdown from '@/app/components/custom-actions-dropdown';

const formSchema = z.object({
    item_id: z.string().min(1, 'Item is required'),
    quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
    notes: z.string().optional(),
});

type FormInputs = z.infer<typeof formSchema>;

interface WorkOrderMaterialEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string;
    workOrderId: string;
    workOrderItem?: ItemWorkOrder | null;
    onSuccess?: () => void;
    onDelete?: (itemId: string) => void;
}

const WorkOrderMaterialEditModal: React.FC<WorkOrderMaterialEditModalProps> = ({
    open,
    onOpenChange,
    orgId,
    workOrderId,
    workOrderItem,
    onSuccess,
    onDelete,
}) => {
    const { t } = useTranslation();
    const [submitting, setSubmitting] = useState(false);
    const [selectedItemData, setSelectedItemData] = useState<any[]>([]);

    const isEditMode = !!workOrderItem;

    const form = useForm<FormInputs>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            item_id: '',
            quantity: 1,
            notes: '',
        },
    });

    // Reset form when modal opens with item data
    useEffect(() => {
        if (open && workOrderItem) {
            const itemData = workOrderItem.item ? [workOrderItem.item] : [];
            setSelectedItemData(itemData);
            form.reset({
                item_id: workOrderItem.item?.id ?? '',
                quantity: workOrderItem.quantity,
                notes: workOrderItem.notes || '',
            });
        } else if (open && !workOrderItem) {
            // Reset for create mode
            form.reset({
                item_id: '',
                quantity: 1,
                notes: '',
            });
            setSelectedItemData([]);
        }
    }, [open, workOrderItem, form]);

    const onSubmit = async (data: FormInputs) => {
        if (!orgId || !workOrderId) return;

        setSubmitting(true);
        try {
            const payload = {
                item_id: data.item_id,
                quantity: data.quantity,
                notes: data.notes || null,
            };

            let response;
            if (isEditMode && workOrderItem) {
                response = await patchWorkOrderItem(orgId, workOrderId, workOrderItem.id, payload);
            } else {
                response = await postWorkOrderItem(orgId, workOrderId, payload);
            }

            if (response.success) {
                toast.success(
                    isEditMode
                        ? t('workOrders.materialUpdatedSuccessfully', 'Material updated successfully')
                        : t('workOrders.materialAddedSuccessfully', 'Material added successfully')
                );
                form.reset();
                setSelectedItemData([]);
                onOpenChange(false);
                onSuccess?.();
            } else {
                toast.error(
                    response.error ||
                    (isEditMode
                        ? t('workOrders.errorUpdatingMaterial', 'Error updating material')
                        : t('workOrders.errorAddingMaterial', 'Error adding material'))
                );
            }
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'adding'} work order material:`, error);
            toast.error(
                isEditMode
                    ? t('workOrders.errorUpdatingMaterial', 'Error updating material')
                    : t('workOrders.errorAddingMaterial', 'Error adding material')
            );
        } finally {
            setSubmitting(false);
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
            onOpenChange(open);
        }
    };

    const handleInteractOutside = (e: Event) => {
        if (form.formState.isDirty) {
            e.preventDefault();
            handleOpenChange(false);
        }
    };

    const handleDelete = () => {
        if (workOrderItem && onDelete) {
            onDelete(workOrderItem.id);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={handleOpenChange}
            key="work-order-material-modal"
        >
            <DialogContent
                className="max-w-md"
                showCloseButton={false}
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold mb-4">
                        <span>
                            {isEditMode
                                ? t('workOrders.editMaterial', 'Edit Material')
                                : t('workOrders.addMaterial', 'Add Material')}
                        </span>
                        <div className="flex items-center gap-2">
                            {isEditMode && workOrderItem && <IdBadge id={workOrderItem.id} />}
                            {isEditMode && workOrderItem && onDelete && (
                                <CustomActionsDropdown
                                    items={[
                                        {
                                            label: t('common.delete', 'Delete'),
                                            icon: 'trash-2',
                                            onClick: handleDelete,
                                            variant: 'destructive',
                                        },
                                    ]}
                                />
                            )}
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(onSubmit)(e); }} className="space-y-4">
                        <div className="space-y-4 overflow-y-auto max-h-[60vh] px-2 scrollbar-hide">
                            {/* Item Selection */}
                            <FormField
                                control={form.control}
                                name="item_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('workOrders.material', 'Material')} *</FormLabel>
                                        <FormControl>
                                            <MultiSelectApi
                                                fetchOptions={getOrgItems}
                                                fetchArgs={[orgId, undefined, undefined]}
                                                optionsKey="items"
                                                customValueKey={(item) => item.id}
                                                customLabelKey={(item) => <ItemAvatar item={item} showItemCode={true} />}
                                                placeholder={t('workOrders.selectMaterial', 'Select a material...')}
                                                value={field.value ? [field.value] : []}
                                                onChangeValue={(values) => field.onChange(values[0] || '')}
                                                onChangeValueWithItem={(_values, itemsMap) => {
                                                    setSelectedItemData(Array.from(itemsMap.values()));
                                                }}
                                                defaultItems={selectedItemData}
                                                className="w-full truncate"
                                                maxCount={1}
                                                disabled={submitting || isEditMode}
                                                isApiSearchable={true}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                                {/* Quantity */}
                                <FormField
                                    control={form.control}
                                    name="quantity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('workOrders.quantity', 'Quantity')} *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="1"
                                                    min="1"
                                                    {...field}
                                                    value={field.value}
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                    disabled={submitting}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Notes */}
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('workOrders.notes', 'Notes')}</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                disabled={submitting}
                                                rows={3}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="flex gap-2 mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={submitting}
                            >
                                {t('common.cancel', 'Cancel')}
                            </Button>
                            <Button 
                                type="button" 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(onSubmit)(e); }}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {isEditMode
                                            ? t('common.updating', 'Updating...')
                                            : t('common.adding', 'Adding...')}
                                    </>
                                ) : (
                                    isEditMode
                                        ? t('common.update', 'Update')
                                        : t('common.add', 'Add')
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default WorkOrderMaterialEditModal;
