import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { postOrgItemPrice, patchOrgItemPrice } from '@/api/items/prices/prices';
import { ItemPriceResponse } from '@/types/items/items';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { MultiSelectApi } from '@/app/components/forms-elements/multi-select-api';
import { getOrgTaxes } from '@/api/orgs/taxes/taxes';
import { getSuppliers } from '@/api/suppliers/suppliers';
import CURRENCIES from '@/utils/currencies';
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';
import { SupplierAvatar } from '@/app/components/avatars/supplier-avatar';
import { formatDecimal } from '@/utils/miscelanea';

interface ItemBuyPriceNewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPriceCreated?: () => void;
    price?: ItemPriceResponse | null; // For update mode
    mode?: 'create' | 'update';
    orgId: string;
    itemId: string;
}

// Form input schema
const formInputSchema = z.object({
    price_quantity: z
        .string()
        .min(1, 'Price is required')
        .refine((val) => {
            const num = parseFloat(val);
            return !isNaN(num) && num > 0;
        }, 'Price must be a valid positive number'),
    price_currency: z.string(),
    supplier_id: z.string().min(1, 'Supplier is required'),
    supplier_barcode: z.string().optional(),
    billing_type: z.enum(['one-off', 'recurring']),
    billing_period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).nullable().optional(),
    tax_included: z.boolean(),
    pricing_mode: z.enum(['margin_fixed', 'price_fixed']),
    taxes: z.array(z.string()).nullable().optional(),
    warranty_period: z
        .string()
        .optional()
        .refine((val) => {
            if (!val || val === '') return true;
            const num = parseInt(val);
            return !isNaN(num) && num >= 0;
        }, 'Warranty period must be a valid positive number'),
    warranty_unit: z.enum(['days', 'weeks', 'months', 'years']).nullable().optional(),
    supplier_pvp: z
        .string()
        .optional()
        .refine((val) => {
            if (!val || val === '') return true;
            const num = parseFloat(val);
            return !isNaN(num) && num >= 0;
        }, 'Supplier PVP must be a valid positive number'),
    supplier_discount: z
        .string()
        .optional()
        .refine((val) => {
            if (!val || val === '') return true;
            const num = parseFloat(val);
            return !isNaN(num) && num >= 0 && num <= 100;
        }, 'Supplier discount must be a valid number between 0 and 100'),
    notes: z.string().optional(),
    priority: z
        .string()
        .optional()
        .refine((val) => {
            if (!val || val === '') return true;
            const num = parseInt(val);
            return !isNaN(num) && num >= 1;
        }, 'Priority must be a valid positive number greater than 0'),
});

// Processing schema (transforms strings to numbers for API)
const processingSchema = formInputSchema.transform((data) => ({
    type: 'buy' as const,
    price_quantity: parseFloat(data.price_quantity),
    price_currency: data.price_currency,
    margin: null,
    billing_type: data.billing_type,
    billing_period: data.billing_period || null,
    price_model: 'flat-rate' as const,
    pricing_mode: 'price_fixed',
    tax_included: data.tax_included,
    taxes: data.taxes || null,
    warranty_period: data.warranty_period && data.warranty_period !== '' ? parseInt(data.warranty_period) : null,
    warranty_unit: data.warranty_unit || null,
    supplier_pvp: data.supplier_pvp && data.supplier_pvp !== '' ? parseFloat(data.supplier_pvp) : null,
    supplier_discount: data.supplier_discount && data.supplier_discount !== '' ? parseFloat(data.supplier_discount) : null,
    notes: data.notes || null,
    supplier_id: data.supplier_id || null,
    supplier_barcode: data.supplier_barcode || null,
    priority: data.priority && data.priority !== '' ? parseInt(data.priority) : null,
}));

type FormValues = z.infer<typeof formInputSchema>;

const ItemBuyPriceNewModal: React.FC<ItemBuyPriceNewModalProps> = ({
    open,
    onOpenChange,
    onPriceCreated,
    price = null,
    mode = 'create',
    orgId,
    itemId,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();

    const form = useForm<FormValues>({
        resolver: zodResolver(formInputSchema),
        defaultValues: {
            price_quantity: '',
            price_currency: 'EUR',
            supplier_id: '',
            supplier_barcode: '',
            billing_type: 'one-off',
            billing_period: null,
            tax_included: true,
            pricing_mode: 'price_fixed',
            taxes: [],
            warranty_period: '',
            warranty_unit: null,
            supplier_pvp: '',
            supplier_discount: '',
            notes: '',
            priority: '1',
        },
    });

    // Populate form with price data in update mode
    useEffect(() => {
        if (open && mode === 'update' && price) {
            form.reset({
                price_quantity: price.price_quantity?.toString() || '',
                price_currency: price.price_currency || 'EUR',
                supplier_id: price.supplier_id || '',
                supplier_barcode: price.supplier_barcode || '',
                billing_type: price.billing_type || 'one-off',
                billing_period: price.billing_period || null,
                tax_included: price.tax_included ?? true,
                pricing_mode: 'price_fixed',
                taxes: price.taxes || [],
                warranty_period: price.warranty_period?.toString() || '',
                warranty_unit: price.warranty_unit || null,
                supplier_pvp: (price as any).supplier_pvp?.toString() || '',
                supplier_discount: (price as any).supplier_discount?.toString() || '',
                notes: price.notes || '',
                priority: (price as any).priority?.toString() || '',
            });
        } else if (open && mode === 'create') {
            form.reset({
                price_quantity: '',
                price_currency: 'EUR',
                supplier_id: '',
                supplier_barcode: '',
                billing_type: 'one-off',
                billing_period: null,
                tax_included: true,
                pricing_mode: 'price_fixed',
                taxes: [],
                warranty_period: '',
                warranty_unit: null,
                supplier_pvp: '',
                supplier_discount: '',
                notes: '',
                priority: '1',
            });
        }
    }, [open, mode, price, form]);

    const onSubmit = async (values: FormValues) => {
        // Transform and validate the data using the processing schema
        const transformResult = processingSchema.safeParse(values);
        if (!transformResult.success) {
            toast.error('Please check your input values');
            return;
        }

        setIsLoading(true);
        try {
            const payload = transformResult.data;

            console.log(payload);

            let response;
            if (mode === 'update' && price?.id) {
                response = await patchOrgItemPrice(orgId, itemId, price.id, payload);
            } else {
                response = await postOrgItemPrice(orgId, itemId, payload);
            }

            if (response.success) {
                const successMessage = mode === 'update'
                    ? t('items.prices.priceUpdated', 'Price updated successfully')
                    : t('items.prices.priceCreated', 'Price created successfully');
                toast.success(successMessage);

                form.reset();
                onOpenChange(false);
                if (onPriceCreated) {
                    onPriceCreated();
                }
            } else {
                const errorMessage = mode === 'update'
                    ? t('items.prices.updateError', 'Failed to update price')
                    : t('items.prices.createError', 'Failed to create price');
                toast.error(response.error || errorMessage);
            }
        } catch (error) {
            console.error(`Error ${mode === 'update' ? 'updating' : 'creating'} price:`, error);
            const errorMessage = mode === 'update'
                ? t('items.prices.updateError', 'Failed to update price')
                : t('items.prices.createError', 'Failed to create price');
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

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="max-w-2xl"
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
                showCloseButton={false}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                        {mode === 'update'
                            ? t('items.prices.updatePrice', 'Update Buy Price')
                            : t('items.prices.addPrice', 'Add Buy Price')
                        }
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-6 overflow-y-auto max-h-[60vh] px-2 scrollbar-hide">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">
                            {/* Price and Currency */}
                            <div className="flex gap-4 items-start justify-start w-full col-span-2">
                                <FormField
                                    control={form.control}
                                    name="price_quantity"
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormLabel>
                                                {t('items.price', 'Price')} *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder={t('items.enterPrice', 'Enter price')}
                                                    {...field}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="price_currency"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t('items.currency', 'Currency')}
                                            </FormLabel>
                                            <FormControl>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    disabled={isLoading}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {CURRENCIES.map((currency) => (
                                                            <SelectItem key={currency.code} value={currency.code}>
                                                                {currency.code} ({currency.symbol})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex items-center justify-between gap-2 col-span-2">
                                <h3 className="text-sm font-bold my-4 text-muted-foreground border-b border-border pb-2 flex-1">
                                    {t('items.provider', 'Supplier')}
                                </h3>
                            </div>

                            {/* Default Provider */}
                            <FormField
                                control={form.control}
                                name="supplier_id"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>
                                            {t('items.defaultProvider', 'Supplier')} *
                                        </FormLabel>
                                        <FormControl>
                                            <MultiSelectApi
                                                disabled={isLoading}
                                                fetchOptions={getSuppliers}
                                                fetchArgs={[orgId]}
                                                optionsKey="suppliers"
                                                className='w-full h-9 truncate'
                                                customValueKey={(item) => item.id}
                                                customLabelKey={(item) => <SupplierAvatar supplier={item} showNameExtra={true} />}
                                                placeholder={t('items.selectDefaultProvider', 'Select supplier')}
                                                searchPlaceholder={t('items.searchProvider', 'Search suppliers...')}
                                                emptyText={t('items.noProvidersFound', 'No suppliers found')}
                                                onChangeValue={(values) => field.onChange(values[0] || '')}
                                                value={field.value ? [field.value] : []}
                                                defaultItems={price?.supplier ? [price.supplier] : undefined}
                                                maxCount={1}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            {t('items.defaultProviderDescription', 'Name of the supplier')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Provider Barcode */}
                            <FormField
                                control={form.control}
                                name="supplier_barcode"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>
                                            {t('items.providerBarcode', 'Supplier Barcode')}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                placeholder={t('items.enterProviderBarcode', 'Enter supplier barcode')}
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            {t('items.providerBarcodeDescription', 'Barcode from the supplier')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Priority */}
                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>
                                            {t('items.priority', 'Priority')}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder={t('items.enterPriority', 'Enter priority (1 = highest)')}
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            {t('items.priorityDescription', 'Lower values have higher priority (1 is highest)')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex items-center justify-between gap-2 col-span-2">
                                <h3 className="text-sm font-bold my-4 text-muted-foreground border-b border-border pb-2 flex-1">
                                    {t('items.billing', 'Billing Information')}
                                </h3>
                            </div>

                            {/* Billing Type */}
                            <FormField
                                control={form.control}
                                name="billing_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('items.billingType', 'Billing Type')}
                                        </FormLabel>
                                        <FormControl>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                                disabled={isLoading}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="one-off">
                                                        {t('items.billingType.oneOff', 'One-off')}
                                                    </SelectItem>
                                                    <SelectItem value="recurring">
                                                        {t('items.billingType.recurring', 'Recurring')}
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Billing Period */}
                            <FormField
                                control={form.control}
                                name="billing_period"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('items.billingPeriod', 'Billing Period')}
                                        </FormLabel>
                                        <FormControl>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value || undefined}
                                                disabled={isLoading || form.watch('billing_type') !== 'recurring'}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder={t('items.selectBillingPeriod', 'Select period')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="daily">
                                                        {t('items.billingPeriod.daily', 'Daily')}
                                                    </SelectItem>
                                                    <SelectItem value="weekly">
                                                        {t('items.billingPeriod.weekly', 'Weekly')}
                                                    </SelectItem>
                                                    <SelectItem value="monthly">
                                                        {t('items.billingPeriod.monthly', 'Monthly')}
                                                    </SelectItem>
                                                    <SelectItem value="yearly">
                                                        {t('items.billingPeriod.yearly', 'Yearly')}
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex items-center justify-between gap-2 col-span-2">
                                <h3 className="text-sm font-bold my-4 text-muted-foreground border-b border-border pb-2 flex-1">
                                    {t('items.taxes', 'Taxes')}
                                </h3>
                            </div>

                            {/* Tax Included */}
                            <FormField
                                control={form.control}
                                name="tax_included"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 col-span-2">
                                        <div className="space-y-0.5">
                                            <FormLabel>
                                                {t('items.taxIncluded', 'Tax Included')}
                                            </FormLabel>
                                            <FormDescription>
                                                {t('items.taxIncludedDescription', 'Is tax already included in the price?')}
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            {/* Taxes */}
                            <FormField
                                control={form.control}
                                name="taxes"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>
                                            {t('items.taxes', 'Taxes')}
                                        </FormLabel>
                                        <FormControl>
                                            <MultiSelectApi
                                                disabled={!form.watch("tax_included")}
                                                fetchOptions={getOrgTaxes}
                                                fetchArgs={[orgId, true]}
                                                isApiSearchable={false}
                                                searchable={false}
                                                optionsKey="taxes"
                                                className='w-full h-9 truncate'
                                                customValueKey={(item) => item.id}
                                                customLabelKey={(item) =>
                                                    <div className="flex items-center gap-2">
                                                        {item.type.replace("_", " ") + " (" + formatDecimal(item.amount) + "%)"}
                                                    </div>
                                                }
                                                placeholder={t('items.selectTaxes', 'Select taxes')}
                                                onChangeValue={(values) => field.onChange(values)}
                                                value={form.watch("taxes") || []}
                                                customIsItemDisabled={(item, allOptions) => {
                                                    const getTypeFromLabel = (label: any) => {
                                                        if (label?.props?.children) {
                                                            const text = label.props.children;
                                                            const match = text.match(/^([^(]+)/);
                                                            return match ? match[1].trim() : '';
                                                        }
                                                        return '';
                                                    };

                                                    const currentType = getTypeFromLabel(item.label);
                                                    const selectedValues = form.watch("taxes") || [];

                                                    const selectedOptions = allOptions.filter((opt: any) =>
                                                        selectedValues.includes(opt.value)
                                                    );

                                                    const hasTypeSelected = selectedOptions.some((opt: any) => {
                                                        const optType = getTypeFromLabel(opt.label);
                                                        return optType === currentType && opt.value !== item.value;
                                                    });

                                                    return hasTypeSelected;
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex items-center justify-between gap-2 col-span-2">
                                <h3 className="text-sm font-bold my-4 text-muted-foreground border-b border-border pb-2 flex-1">
                                    {t('items.other', 'Other')}
                                </h3>
                            </div>
                            {/* Supplier PVP */}
                            <FormField
                                control={form.control}
                                name="supplier_pvp"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('items.supplierPvp', 'Supplier PVP')}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder={t('items.enterSupplierPvp', 'Enter supplier PVP')}
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Supplier Discount */}
                            <FormField
                                control={form.control}
                                name="supplier_discount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('items.supplierDiscount', 'Supplier Discount (%)')}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder={t('items.enterSupplierDiscount', 'Enter discount percentage')}
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Warranty Period */}
                            <FormField
                                control={form.control}
                                name="warranty_period"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('items.warrantyPeriod', 'Warranty Period')}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder={t('items.enterWarrantyPeriod', 'Enter period')}
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Warranty Unit */}
                            <FormField
                                control={form.control}
                                name="warranty_unit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('items.warrantyUnit', 'Warranty Unit')}
                                        </FormLabel>
                                        <FormControl>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value || undefined}
                                                disabled={isLoading}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder={t('items.selectWarrantyUnit', 'Select unit')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="days">
                                                        {t('items.warrantyUnit.days', 'Days')}
                                                    </SelectItem>
                                                    <SelectItem value="weeks">
                                                        {t('items.warrantyUnit.weeks', 'Weeks')}
                                                    </SelectItem>
                                                    <SelectItem value="months">
                                                        {t('items.warrantyUnit.months', 'Months')}
                                                    </SelectItem>
                                                    <SelectItem value="years">
                                                        {t('items.warrantyUnit.years', 'Years')}
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />



                            {/* Notes */}
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>
                                            {t('items.priceNotes', 'Notes')}
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder={t('items.enterPriceNotes', 'Additional notes about this price')}
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
                        <Button type="submit" onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {mode === 'update'
                                        ? t('items.prices.updatingPrice', 'Updating...')
                                        : t('items.prices.creatingPrice', 'Creating...')
                                    }
                                </>
                            ) : (
                                mode === 'update'
                                    ? t('items.prices.updatePrice', 'Update Price')
                                    : t('items.prices.createPrice', 'Create Price')
                            )}
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default ItemBuyPriceNewModal;

