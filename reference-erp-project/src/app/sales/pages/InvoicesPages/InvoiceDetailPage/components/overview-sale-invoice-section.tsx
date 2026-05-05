import { useTranslation } from "react-i18next";
import { useSaleInvoice } from "../../contexts/SaleInvoiceContext";
import { Building2, DollarSign } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatPercentage } from "@/utils/miscelanea";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipContent } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { TAX_CODES } from "@/utils/taxes";
import { ClientAvatar } from "@/app/components/avatars/client-avatar";
import { MultiSelectApi } from "@/app/components/forms-elements/multi-select-api";
import { getClients } from "@/api/clients/clients";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useParams } from "react-router-dom";
import { Client } from "@/types/clients/client";
import { useEffect } from "react";

const OverviewSaleInvoiceSection = () => {
    const { t } = useTranslation();
    const { invoice, calculations, setData, isReadOnly } = useSaleInvoice();
    const { orgId } = useParams<{ orgId: string }>();

    // Get client directly from context
    const client = invoice.client || null;

    const form = useForm({
        defaultValues: {
            client_id: client?.id || '',
        },
    });

    // Watch form changes and update context
    useEffect(() => {
        const subscription = form.watch((values) => {
            if (values.client_id) {
                setData({ client: { id: values.client_id } as Client });
            }
        });

        return () => subscription.unsubscribe();
    }, [form, setData]);

    const handleClientChange = (values: string[]) => {
        if (values.length > 0) {
            form.setValue('client_id', values[0]);
        }
    };

    const handleClientChangeWithItem = (values: string[], items: Map<string, Client>) => {
        if (values.length > 0) {
            const selectedClient = items.get(values[0]);
            if (selectedClient) {
                setData({ client: selectedClient });
            }
        }
    };

    // Format client address
    const formatClientAddress = () => {
        if (!client) return t('salesInvoices.noClient', 'No client information');

        const addressParts = [
            client.address_line_1,
            client.address_line_2,
            client.postal_code && client.city ? `${client.postal_code}, ${client.city}` : client.postal_code || client.city,
            client.state_province,
            client.country
        ].filter(Boolean);

        return addressParts.length > 0
            ? addressParts.join(', ')
            : t('salesInvoices.noAddress', 'No address');
    };

    // Use calculations from context
    const { totalTaxes, subtotal, itemsDiscount, globalDiscountAmount, total, totalCostPrice, totalMargin } = calculations;

    // Use invoice currency for all amounts
    const invoiceCurrency = invoice.currency || undefined;

    return (
        <div className="flex gap-4 border border-border rounded-xl">
            {/* Left Card - Client Information */}
            <div className="p-5 w-full">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Building2 className="h-4 w-4" />
                    <span className="text-sm">
                        {t('salesInvoices.clientInformation', 'Client Information')}
                    </span>
                </div>

                <Form {...form}>
                    <div className="space-y-1">
                        {/* Client Name */}
                        <FormField
                            control={form.control}
                            name="client_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <MultiSelectApi
                                            fetchOptions={getClients}
                                            fetchArgs={[orgId || ""]}
                                            optionsKey="clients"
                                            customValueKey={(item: any) => item.id}
                                            customLabelKey={(item: any) => <ClientAvatar client={item as Client} showNameExtra={true} />}
                                            placeholder={t('salesInvoices.selectClient', 'Select client')}
                                            searchPlaceholder={t('salesInvoices.searchClient', 'Search clients...')}
                                            emptyText={t('salesInvoices.noClientsFound', 'No clients found')}
                                            onChangeValue={(values) => handleClientChange(values)}
                                            onChangeValueWithItem={(values, items) => handleClientChangeWithItem(values, items)}
                                            value={field.value ? [field.value] : []}
                                            defaultItems={invoice.client ? [invoice.client] : undefined}
                                            maxCount={1}
                                            className="w-full truncate -mx-1! px-1! py-1! h-8 border-none bg-muted disabled:opacity-80"
                                            popoverClassName="max-w-72"
                                            disabled={isReadOnly}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Tax Code (NIF) */}
                        {client?.tax_code && (
                            <div className="flex items-center gap-1">
                                {TAX_CODES.find(tax => tax.id === client?.tax_code_type) && <span className="text-sm flex items-center gap-1 justify-center">
                                    {TAX_CODES.find(tax => tax.id === client?.tax_code_type)?.label}
                                </span>}
                                {client?.tax_code && <span className="text-sm capitalize">
                                    {client?.tax_code}
                                </span>}
                            </div>
                        )}
                        {/* Address */}
                        <div className="text-sm capitalize line-clamp-1 break-all">
                            {formatClientAddress()}
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

                        {/* Cost Price (PC) */}
                        {totalCostPrice > 0 && (
                            <div className="flex justify-between items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    {t('invoices.totalCostPrice', 'PC Total')}:
                                </span>
                                <span className="text-sm font-medium">
                                    {formatCurrency(totalCostPrice, invoiceCurrency)}
                                </span>
                            </div>
                        )}

                        {/* Margin */}
                        {totalMargin != null && (
                            <div className="flex justify-between items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    {t('invoices.margin', 'Margen')}:
                                </span>
                                <span className={`text-sm font-medium ${totalMargin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {formatPercentage(totalMargin / 100)} ({formatCurrency(subtotal - totalCostPrice, invoiceCurrency)})
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewSaleInvoiceSection;
