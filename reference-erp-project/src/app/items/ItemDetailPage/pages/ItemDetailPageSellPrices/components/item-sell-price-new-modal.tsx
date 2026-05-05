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
import CURRENCIES from '@/utils/currencies';
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { formatDecimal } from '@/utils/miscelanea';

interface ItemSellPriceNewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPriceCreated?: () => void;
    price?: ItemPriceResponse | null; // For update mode
    mode?: 'create' | 'update';
    orgId: string;
    itemId: string;
    itemPmc?: number | null; // Item's cost price for margin calculation
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
    margin: z
        .string()
        .optional()
        .refine((val) => {
            if (!val || val === '') return true;
            const num = parseFloat(val);
            return !isNaN(num);
        }, 'Margin must be a valid number'),
    pricing_mode: z.enum(['margin_fixed', 'price_fixed']),
    billing_type: z.enum(['one-off', 'recurring']),
    billing_period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).nullable().optional(),
    tax_included: z.boolean(),
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
    notes: z.string().optional()
});

// Processing schema (transforms strings to numbers for API)
const processingSchema = formInputSchema.transform((data) => ({
    type: 'sell' as const,
    price_quantity: parseFloat(data.price_quantity),
    price_currency: data.price_currency,
    margin: data.margin && data.margin !== '' ? parseFloat(data.margin) : null,
    billing_type: data.billing_type,
    billing_period: data.billing_period || null,
    price_model: 'flat-rate' as const,
    pricing_mode: data.pricing_mode,
    tax_included: data.tax_included,
    taxes: data.taxes || null,
    warranty_period: data.warranty_period && data.warranty_period !== '' ? parseInt(data.warranty_period) : null,
    warranty_unit: data.warranty_unit || null,
    notes: data.notes || null
}));

type FormValues = z.infer<typeof formInputSchema>;

const ItemSellPriceNewModal: React.FC<ItemSellPriceNewModalProps> = ({
    open,
    onOpenChange,
    onPriceCreated,
    price = null,
    mode = 'create',
    orgId,
    itemId,
    itemPmc = null,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();

    const form = useForm<FormValues>({
        resolver: zodResolver(formInputSchema),
        defaultValues: {
            price_quantity: '',
            price_currency: 'EUR',
            margin: '',
            pricing_mode: 'price_fixed',
            billing_type: 'one-off',
            billing_period: null,
            tax_included: true,
            taxes: [],
            warranty_period: '',
            warranty_unit: null,
            notes: '',
        },
    });

    // Populate form with price data in update mode
    useEffect(() => {
        if (open && mode === 'update' && price) {
            form.reset({
                price_quantity: price.price_quantity?.toString() || '',
                price_currency: price.price_currency || 'EUR',
                margin: price.margin?.toString() || '',
                pricing_mode: 'price_fixed',
                billing_type: price.billing_type || 'one-off',
                billing_period: price.billing_period || null,
                tax_included: price.tax_included ?? true,
                taxes: price.taxes || [],
                warranty_period: price.warranty_period?.toString() || '',
                warranty_unit: price.warranty_unit || null,
                notes: price.notes || '',
            });
        } else if (open && mode === 'create') {
            form.reset({
                price_quantity: '',
                price_currency: 'EUR',
                margin: '',
                pricing_mode: 'price_fixed',
                billing_type: 'one-off',
                billing_period: null,
                tax_included: true,
                taxes: [],
                warranty_period: '',
                warranty_unit: null,
                notes: '',
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
                            ? t('items.prices.updatePrice', 'Update Sell Price')
                            : t('items.prices.addPrice', 'Add Sell Price')
                        }
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-6 overflow-y-auto max-h-[60vh] px-2 scrollbar-hide">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">
                                {/* Price and Currency */}
                                {/* Pricing Mode */}
                                <FormField
                                    control={form.control}
                                    name="pricing_mode"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel>
                                                {t('items.pricingMode', 'Pricing Mode')}
                                            </FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    className="flex gap-4"
                                                    disabled={isLoading}
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="margin_fixed" id="margin_fixed" />
                                                        <Label htmlFor="margin_fixed" className="font-normal cursor-pointer">
                                                            {t('items.marginFixed', 'Margin Fixed')}
                                                        </Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="price_fixed" id="price_fixed" />
                                                        <Label htmlFor="price_fixed" className="font-normal cursor-pointer">
                                                            {t('items.priceFixed', 'Price Fixed')}
                                                        </Label>
                                                    </div>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormDescription>
                                                {field.value === 'price_fixed'
                                                    ? t('items.priceFixedDescription', 'The price is fixed and the margin will be calculated dynamically')
                                                    : t('items.marginFixedDescription', 'The margin is fixed and the price will be calculated dynamically')
                                                }
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

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
                                                        disabled={isLoading || form.watch('pricing_mode') === 'margin_fixed'}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            field.onChange(value);
                                                            const numValue = value === '' ? 0 : parseFloat(value);

                                                            // Calculate margin if PMC is available and price_fixed mode
                                                            if (form.watch('pricing_mode') === 'price_fixed' && numValue > 0 && itemPmc !== null && itemPmc !== undefined) {
                                                                const margin = ((1 - (itemPmc / numValue)) * 100).toFixed(2);
                                                                form.setValue("margin", margin);
                                                            }
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    {form.watch('pricing_mode') === 'margin_fixed'
                                                        ? t('items.priceCalculatedDescription', 'Price will be dynamically calculated based on the margin')
                                                        : null
                                                    }
                                                </FormDescription>
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
                                                        disabled={isLoading || form.watch('pricing_mode') === 'margin_fixed'}
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

                                {/* Margin */}
                                <FormField
                                    control={form.control}
                                    name="margin"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel>
                                                {t('items.margin', 'Margin')} (%)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder={t('items.enterMargin', 'Enter margin percentage')}
                                                    {...field}
                                                    disabled={isLoading || !itemPmc || form.watch('pricing_mode') === 'price_fixed'}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        field.onChange(value);
                                                        const numValue = value === '' ? undefined : parseFloat(value);

                                                        // Calculate sell price from margin (only when margin_fixed mode)
                                                        if (form.watch('pricing_mode') === 'margin_fixed' && numValue !== undefined && itemPmc !== null && itemPmc !== undefined) {
                                                            if (numValue < 100) {
                                                                const price = itemPmc / (1 - numValue / 100);
                                                                form.setValue("price_quantity", parseFloat(price.toFixed(2)).toString());
                                                            }
                                                        }
                                                    }}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                {form.watch('pricing_mode') === 'price_fixed'
                                                    ? t('items.marginCalculatedDescription', 'Margin will be dynamically calculated based on the price')
                                                    : t('items.marginDescription', 'Profit margin percentage')
                                                }
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
                            <Button type="submit" disabled={isLoading}>
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
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default ItemSellPriceNewModal;

