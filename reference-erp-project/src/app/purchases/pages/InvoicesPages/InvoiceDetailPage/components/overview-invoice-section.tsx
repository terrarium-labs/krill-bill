import { useTranslation } from "react-i18next";
import { useInvoice } from "../../contexts/InvoiceContext";
import { Building2, DollarSign } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatPercentage } from "@/utils/miscelanea";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipContent } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { TAX_CODES } from "@/utils/taxes";
import { SupplierAvatar } from "@/app/components/avatars/supplier-avatar";
import { MultiSelectApi } from "@/app/components/forms-elements/multi-select-api";
import { getSuppliers } from "@/api/suppliers/suppliers";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useParams } from "react-router-dom";
import { Supplier } from "@/types/suppliers/supplier";
import { useEffect } from "react";

const OverviewInvoiceSection = () => {
    const { t } = useTranslation();
    const { invoice, calculations, setData } = useInvoice();
    const { orgId } = useParams<{ orgId: string }>();

    // Get supplier directly from context
    const supplier = invoice.supplier || null;

    const form = useForm({
        defaultValues: {
            supplier_id: supplier?.id || '',
        },
    });

    // Watch form changes and update context
    useEffect(() => {
        const subscription = form.watch((values) => {
            if (values.supplier_id) {
                setData({ supplier: { id: values.supplier_id } as Supplier });
            }
        });

        return () => subscription.unsubscribe();
    }, [form, setData]);

    const handleSupplierChange = (values: string[]) => {
        if (values.length > 0) {
            form.setValue('supplier_id', values[0]);
        }
    };

    const handleSupplierChangeWithItem = (values: string[], items: Map<string, Supplier>) => {
        if (values.length > 0) {
            const selectedSupplier = items.get(values[0]);
            if (selectedSupplier) {
                setData({ supplier: selectedSupplier });
            }
        }
        // Don't clear supplier if no values - let the form handle it
    };

    // Format supplier address
    const formatSupplierAddress = () => {
        if (!supplier) return t('invoices.noSupplier', 'No supplier information');

        const addressParts = [
            supplier.address_line_1,
            supplier.address_line_2,
            supplier.postal_code && supplier.city ? `${supplier.postal_code}, ${supplier.city}` : supplier.postal_code || supplier.city,
            supplier.state_province,
            supplier.country
        ].filter(Boolean);

        return addressParts.length > 0
            ? addressParts.join(', ')
            : t('invoices.noAddress', 'No address');
    };

    // Use calculations from context
    const { totalTaxes, subtotal, itemsDiscount, globalDiscountAmount, total } = calculations;

    // Use invoice currency for all amounts
    const invoiceCurrency = invoice.currency || undefined;

    return (
        <div className="flex gap-4 border border-border rounded-xl">
            {/* Left Card - Supplier Information */}
            <div className="p-5 w-full">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Building2 className="h-4 w-4" />
                    <span className="text-sm">
                        {t('invoices.supplierInformation', 'Supplier Information')}
                    </span>
                </div>

                <Form {...form}>
                    <div className="space-y-1">
                        {/* Supplier Name */}
                        <FormField
                            control={form.control}
                            name="supplier_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <MultiSelectApi
                                            fetchOptions={getSuppliers}
                                            fetchArgs={[orgId || ""]}
                                            optionsKey="suppliers"
                                            customValueKey={(item: any) => item.id}
                                            customLabelKey={(item: any) => <SupplierAvatar supplier={item as Supplier} showNameExtra={true} />}
                                            placeholder={t('invoices.selectSupplier', 'Select supplier')}
                                            searchPlaceholder={t('invoices.searchSupplier', 'Search suppliers...')}
                                            emptyText={t('invoices.noSuppliersFound', 'No suppliers found')}
                                            onChangeValue={(values) => handleSupplierChange(values)}
                                            onChangeValueWithItem={(values, items) => handleSupplierChangeWithItem(values, items)}
                                            value={field.value ? [field.value] : []}
                                            defaultItems={invoice.supplier ? [invoice.supplier] : undefined}
                                            maxCount={1}
                                            className="w-full truncate -mx-1! px-1! py-1! h-8 border-none bg-muted"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Tax Code (NIF) */}
                        {supplier?.tax_code && (
                            <div className="flex items-center gap-1">
                                {TAX_CODES.find(tax => tax.id === supplier?.tax_code_type) && <span className="text-sm flex items-center gap-1 justify-center">
                                    {TAX_CODES.find(tax => tax.id === supplier?.tax_code_type)?.label}
                                </span>}
                                {supplier?.tax_code && <span className="text-sm capitalize">
                                    {supplier?.tax_code}
                                </span>}
                            </div>
                        )}
                        {/* Address */}
                        <div className="text-sm capitalize line-clamp-1 break-all">
                            {formatSupplierAddress()}
                        </div>
                    </div>
                </Form>
            </div>

            <div className="py-5">
                <Separator orientation="vertical" className="py-4" />
            </div>

            {/* Right Card - Financial Data */}
            <div className="p-5 w-full">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">
                        {t('invoices.financialSummary', 'Financial Summary')}
                    </span>
                </div>

                <div className="space-y-3 flex gap-3 justify-between items-center">
                    {/* Total */}
                    <div>
                        <span className="text-2xl text-primary font-semibold">
                            {formatCurrency(total, invoiceCurrency)}
                        </span>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {t('invoices.totalAmount', 'Total Amount')}
                        </p>
                    </div>

                    {/* Financial Breakdown */}
                    <div className="space-y-1">
                        {/* Subtotal */}
                        <div className="flex justify-between items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                {t('invoices.subtotal', 'Subtotal')}:
                            </span>
                            <span className="text-sm font-medium">
                                {formatCurrency(subtotal, invoiceCurrency)}
                            </span>
                        </div>

                        {/* Item Discount */}
                        {itemsDiscount > 0 && (
                            <div className="flex justify-between items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    {t('invoices.itemsDiscount', 'Item Discount')}:
                                </span>
                                <span className="text-sm font-medium text-red-500">
                                    -{formatCurrency(itemsDiscount, invoiceCurrency)}
                                </span>
                            </div>
                        )}

                        {/* Global Discount */}
                        {globalDiscountAmount > 0 && (
                            <div className="flex justify-between items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    {t('invoices.globalDiscount', 'Global Discount')} ({formatPercentage(invoice.discount / 100)}):
                                </span>
                                <span className="text-sm font-medium text-red-500">
                                    -{formatCurrency(globalDiscountAmount, invoiceCurrency)}
                                </span>
                            </div>
                        )}

                        {/* Taxes */}
                        <div className="flex justify-between items-center gap-2">
                            <div className="flex items-center gap-1">
                                <span className="text-sm text-muted-foreground">
                                    {t('invoices.taxes', 'Taxes')}:
                                </span>
                                {Object.keys(calculations.taxesByType).length > 0 && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                                <div className="space-y-1">
                                                    {Object.entries(calculations.taxesByType).map(([taxType, amount]) => (
                                                        <div key={taxType} className="flex justify-between gap-4 text-xs">
                                                            <span className="capitalize">{taxType}:</span>
                                                            <span>{formatCurrency(amount, invoiceCurrency)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                            <span className="text-sm font-medium">
                                {formatCurrency(totalTaxes, invoiceCurrency)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewInvoiceSection;
