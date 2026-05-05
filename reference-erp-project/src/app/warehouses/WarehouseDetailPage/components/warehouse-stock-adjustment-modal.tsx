import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { postOrgItemStock } from '@/api/orgs/stocks/stocks';
import { getOrgItems } from '@/api/items/items';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';
import { MultiSelectApi } from '@/app/components/forms-elements/multi-select-api';
import { ItemAvatar } from '@/app/components/avatars/item-avatar';

interface WarehouseStockAdjustmentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAdjustmentSaved?: () => void;
    locationId: string;
}

const formSchema = z.object({
    type: z.enum(['entry', 'exit']),
    item_id: z.array(z.string()).min(1, 'Please select an item'),
    quantity: z.string().min(1, 'Quantity is required').refine((val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
    }, 'Quantity must be a positive number'),
    unit_price: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const WarehouseStockAdjustmentModal: React.FC<WarehouseStockAdjustmentModalProps> = ({
    locationId,
    open,
    onOpenChange,
    onAdjustmentSaved,
}) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: 'entry',
            item_id: [],
            quantity: '1',
            unit_price: '0',
        },
    });

    const selectedType = form.watch('type');

    useEffect(() => {
        if (open) {
            form.reset({
                type: 'entry',
                item_id: [],
                quantity: '1',
                unit_price: '0',
            });
        }
    }, [open, form]);

    const onSubmit = async (values: FormValues) => {
        if (!orgId || !locationId) {
            toast.error(t('common.error', 'An error occurred'));
            return;
        }

        setIsSubmitting(true);
        try {
            const selectedItemId = values.item_id[0];

            const payload: any = {
                type: values.type,
                item_id: selectedItemId,
                quantity: parseFloat(values.quantity),
                location_id: locationId,
            };

            // Only include unit_price for entry type
            if (values.type === 'entry' && values.unit_price) {
                payload.unit_price = parseFloat(values.unit_price);
            }

            const response = await postOrgItemStock(orgId, payload);

            if (response.success) {
                toast.success(
                    t('stock.adjustmentCreated', 'Stock adjustment created successfully')
                );
                form.reset();
                onOpenChange(false);
                if (onAdjustmentSaved) {
                    onAdjustmentSaved();
                }
            } else {
                toast.error(
                    response.error ||
                    t('stock.errorCreatingAdjustment', 'Error creating stock adjustment')
                );
            }
        } catch (error) {
            console.error('Error creating stock adjustment:', error);
            toast.error(t('stock.errorCreatingAdjustment', 'Error creating stock adjustment'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = async (open: boolean) => {
        if (!open && form.formState.isDirty) {
            const discard = await promptUnsavedChanges();
            if (discard) {
                form.reset();
                onOpenChange(false);
            }
        } else {
            if (!open) {
                form.reset();
            }
            onOpenChange(open);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold mb-4">
                        {t('stock.newAdjustment', 'New Stock Adjustment')}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    {/* Type Field */}
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {t('stock.type', 'Type')} <span>*</span>
                                </FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={t('stock.selectType', 'Select type')} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="entry">
                                            {t('stock.entry', 'Entry')}
                                        </SelectItem>
                                        <SelectItem value="exit">
                                            {t('stock.exit', 'Exit')}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Item Field */}
                    <FormField
                        control={form.control}
                        name="item_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {t('stock.item', 'Item')} <span>*</span>
                                </FormLabel>
                                <FormControl>
                                    <MultiSelectApi
                                        fetchOptions={getOrgItems}
                                        fetchArgs={[orgId, undefined, undefined]}
                                        optionsKey="items"
                                        maxCount={1}
                                        placeholder={t('stock.selectItem', 'Select item')}
                                        customValueKey={(item) => item.id}
                                        customLabelKey={(item) => <ItemAvatar item={item} showItemCode={true} />}
                                        onChangeValue={field.onChange}
                                        value={field.value}
                                        className="w-full truncate"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid  grid-cols-1 md:grid-cols-2 items-start justify-start  gap-4">

                        {/* Quantity Field */}
                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem className={selectedType === 'entry' ? 'col-span-1' : 'col-span-2'}>
                                    <FormLabel>
                                        {t('stock.quantity', 'Quantity')} <span>*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="any"
                                            placeholder={t('stock.enterQuantity', 'Enter quantity')}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Unit Price Field - Only visible for entry */}
                        {selectedType === 'entry' && (
                            <FormField
                                control={form.control}
                                name="unit_price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('stock.unitPrice', 'Unit Price')}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="any"
                                                placeholder={t('stock.enterUnitPrice', 'Enter unit price')}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button type="submit" disabled={isSubmitting} onClick={form.handleSubmit(onSubmit)}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('common.save', 'Save')}
                        </Button>
                    </DialogFooter>

                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default WarehouseStockAdjustmentModal;

