import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MultiSelectApi } from "@/app/components/forms-elements/multi-select-api";
import { getOrgTaxes } from "@/api/orgs/taxes/taxes";
import { getSuppliers } from "@/api/suppliers/suppliers";
import CURRENCIES from "@/utils/currencies";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Textarea } from "@/components/ui/textarea";
import { SupplierAvatar } from "@/app/components/avatars/supplier-avatar";
import { formatDecimal } from "@/utils/miscelanea";

interface BuyPricesSectionProps {
    form: UseFormReturn<any>;
    isLoading: boolean;
    orgId: string;
}

const BuyPricesSection: React.FC<BuyPricesSectionProps> = ({ form, isLoading, orgId }) => {
    const { t } = useTranslation();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">

            <div className="flex gap-4 items-start justify-start w-full">
                {/* Price */}
                <FormField
                    control={form.control}
                    name="buy_price_quantity"
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
                                    disabled={isLoading}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        const numValue = value === '' ? undefined : parseFloat(value);
                                        field.onChange(numValue?.toString() || '');
                                    }}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Currency */}
                <FormField
                    control={form.control}
                    name="buy_price_currency"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                {t('items.currency', 'Currency')}
                            </FormLabel>
                            <FormControl>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value || 'EUR'}
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
                <h3 className="text-sm font-bold my-4 text-muted-foreground border-b border-border pb-2 flex-1">{t('items.provider', 'Default Provider')}</h3>
            </div>

            {/* Default Provider */}
            <FormField
                control={form.control}
                name="buy_default_provider"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>
                            {t('items.defaultProvider', 'Default Provider')}
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
                                onChangeValue={(values) => field.onChange(values[0])}
                                value={[form.watch("buy_default_provider") || '']}
                                maxCount={1}
                            />
                        </FormControl>
                        <FormDescription>
                            {t('items.defaultProviderDescription', 'Name of the default supplier')}
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Provider Barcode */}
            <FormField
                control={form.control}
                name="buy_provider_barcode"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>
                            {t('items.providerBarcode', 'Provider Barcode')}
                        </FormLabel>
                        <FormControl>
                            <Input
                                type="text"
                                placeholder={t('items.enterProviderBarcode', 'Enter provider barcode')}
                                {...field}
                                value={field.value ?? ''}
                                disabled={isLoading}
                            />
                        </FormControl>
                        <FormDescription>
                            {t('items.providerBarcodeDescription', 'Barcode from the provider/supplier')}
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
                name="buy_billing_type"
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
                name="buy_billing_period"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>
                            {t('items.billingPeriod', 'Billing Period')}
                        </FormLabel>
                        <FormControl>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value || undefined}
                                disabled={isLoading || form.watch('buy_billing_type') !== 'recurring'}
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
                name="buy_tax_included"
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
                name="buy_taxes"
                key={"taxes_" + form.watch("item_family_id")}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>
                            {t('items.taxes', 'Taxes')}
                        </FormLabel>
                        <FormControl>
                            <MultiSelectApi
                                disabled={form.watch("buy_tax_included") === false}
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
                                value={form.watch("buy_taxes") || []}
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
                                    const selectedValues = form.watch("buy_taxes") || [];

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
                name="buy_warranty_period"
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
                name="buy_warranty_unit"
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
                name="buy_notes"
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

export default BuyPricesSection;

