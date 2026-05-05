import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MultiSelectApi } from "@/app/components/forms-elements/multi-select-api";
import { getOrgTaxes } from "@/api/orgs/taxes/taxes";
import CURRENCIES from "@/utils/currencies";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { formatDecimal } from "@/utils/miscelanea";

interface ItemSellPricesSectionProps {
    form: UseFormReturn<any>;
    isLoading: boolean;
    orgId: string;
}

const ItemSellPricesSection: React.FC<ItemSellPricesSectionProps> = ({ form, isLoading, orgId }) => {
    const { t } = useTranslation();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">

            {/* Pricing Mode */}
            <FormField
                control={form.control}
                name="sell_pricing_mode"
                render={({ field }) => (
                    <FormItem className="col-span-2 mb-4">
                        <FormLabel>
                            {t('items.pricingMode', 'Pricing Mode')}
                        </FormLabel>
                        <FormControl>
                            <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value || 'price_fixed'}
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

            <div className="flex gap-4 items-start justify-start w-full col-span-1">
                {/* Price */}
                <FormField
                    control={form.control}
                    name="sell_price_quantity"
                    render={({ field }) => (
                        <FormItem className="flex-1">
                            <FormLabel>
                                {t('items.price', 'Price')}
                            </FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder={t('items.enterPrice', 'Enter price')}
                                    {...field}
                                    value={field.value ?? ''}
                                    disabled={isLoading || form.watch('sell_pricing_mode') === 'margin_fixed'}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        field.onChange(value);
                                        const numValue = value === '' ? 0 : parseFloat(value);

                                        // Calculate margin if PMC is available and price_fixed mode
                                        if (form.watch('sell_pricing_mode') === 'price_fixed' && numValue > 0 && form.watch("pmc") !== null && form.watch("pmc") !== undefined) {
                                            const pmc = parseFloat(form.watch("pmc")?.toString() || "0");
                                            const margin = ((1 - (pmc / numValue)) * 100).toFixed(2);
                                            form.setValue("sell_margin", margin);
                                        }
                                    }}
                                />
                            </FormControl>
                            <FormDescription>
                                {form.watch('sell_pricing_mode') === 'margin_fixed'
                                    ? t('items.priceCalculatedDescription', 'Price will be dynamically calculated based on the margin')
                                    : null
                                }
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Currency */}
                <FormField
                    control={form.control}
                    name="sell_price_currency"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                {t('items.currency', 'Currency')}
                            </FormLabel>
                            <FormControl>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value || 'EUR'}
                                    disabled={isLoading || form.watch('sell_pricing_mode') === 'margin_fixed'}
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
                name="sell_margin"
                render={({ field }) => (
                    <FormItem className="col-span-1">
                        <FormLabel>
                            {t('items.margin', 'Margin')} (%)
                        </FormLabel>
                        <FormControl>
                            <Input
                                type="number"
                                disabled={isLoading || !form.watch("pmc") || form.watch('sell_pricing_mode') === 'price_fixed'}
                                step="0.01"
                                placeholder={t('items.enterMargin', 'Enter margin percentage')}
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    field.onChange(value);
                                    const numValue = value === '' ? undefined : parseFloat(value);

                                    // Calculate sell price from margin (only when margin_fixed mode)
                                    if (form.watch('sell_pricing_mode') === 'margin_fixed' && numValue !== undefined && form.watch("pmc") !== null && form.watch("pmc") !== undefined) {
                                        if (numValue < 100) {
                                            const pmc = parseFloat(form.watch("pmc")?.toString() || "0");
                                            const price = pmc / (1 - numValue / 100);
                                            form.setValue("sell_price_quantity", parseFloat(price.toFixed(2)).toString());
                                        }
                                    }
                                }}
                            />
                        </FormControl>
                        <FormDescription>
                            {form.watch('sell_pricing_mode') === 'price_fixed'
                                ? t('items.marginCalculatedDescription', 'Margin will be dynamically calculated based on the price')
                                : t('items.marginDescription', 'Profit margin percentage')
                            }
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="flex items-center justify-between gap-2 col-span-2">
                <h3 className="text-sm font-bold my-4 text-muted-foreground border-b border-border pb-2 flex-1">{t('items.billing', 'Billing Information')}</h3>
            </div>

            {/* Billing Type */}
            <FormField
                control={form.control}
                name="sell_billing_type"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>
                            {t('items.billingType', 'Billing Type')}
                        </FormLabel>
                        <FormControl>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value || 'one-off'}
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

            {/* Billing Period (only if recurring) */}

            <FormField
                control={form.control}
                name="sell_billing_period"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>
                            {t('items.billingPeriod', 'Billing Period')}
                        </FormLabel>
                        <FormControl>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value || undefined}
                                disabled={isLoading || form.watch('sell_billing_type') !== 'recurring'}
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
                <h3 className="text-sm font-bold my-4 text-muted-foreground border-b border-border pb-2 flex-1">{t('items.taxes', 'Taxes')}</h3>
            </div>

            {/* Tax Included */}
            <FormField
                control={form.control}
                name="sell_tax_included"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 ">
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
                                checked={field.value || true}
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
                name="sell_taxes"
                key={"taxes_" + form.watch("item_family_id")}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>
                            {t('items.taxes', 'Taxes')}
                        </FormLabel>
                        <FormControl>
                            <MultiSelectApi
                                disabled={form.watch("sell_tax_included") === false}
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
                                value={form.watch("sell_taxes") || []}
                                customIsItemDisabled={(item, allOptions) => {
                                    // Extract the tax type from the label (e.g., "IVA", "Ret. IRPF", "Rec. Eq.")
                                    const getTypeFromLabel = (label: any) => {
                                        if (label?.props?.children) {
                                            const text = label.props.children;
                                            // Extract text before the opening parenthesis
                                            const match = text.match(/^([^(]+)/);
                                            return match ? match[1].trim() : '';
                                        }
                                        return '';
                                    };

                                    const currentType = getTypeFromLabel(item.label);
                                    const selectedValues = form.watch("sell_taxes") || [];

                                    // Get the selected options from all available options
                                    const selectedOptions = allOptions.filter((opt: any) =>
                                        selectedValues.includes(opt.value)
                                    );

                                    // Check if there's already a tax of the same type selected
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
                <h3 className="text-sm font-bold my-4 text-muted-foreground border-b border-border pb-2 flex-1">{t('items.other', 'Other')}</h3>
            </div>

            {/* Warranty Period */}
            <FormField
                control={form.control}
                name="sell_warranty_period"
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
                                value={field.value ?? ''}
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
                name="sell_warranty_unit"
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
                name="sell_notes"
                render={({ field }) => (
                    <FormItem className="col-span-2">
                        <FormLabel>
                            {t('items.priceNotes', 'Notes')}
                        </FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder={t('items.enterPriceNotes', 'Additional notes about this price')}
                                {...field}
                                value={field.value ?? ''}
                                disabled={isLoading}
                                rows={3}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
};

export default ItemSellPricesSection;