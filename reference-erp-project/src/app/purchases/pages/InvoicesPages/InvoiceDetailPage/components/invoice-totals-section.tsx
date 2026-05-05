import React from "react";
import { Percent, ArrowRightLeft } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import CurrencyLabel from "@/app/components/labels/currency-label";
import { useInvoice } from "../../contexts/InvoiceContext";
import { useOrg } from "@/app/contexts/OrgContext";
import { formatPercentage } from "@/utils/miscelanea";

interface InvoiceTotalsSectionProps {
    // Accordion state
    accordionValue: string | undefined;
    onAccordionValueChange: (value: string | undefined) => void;
}

const InvoiceTotalsSection: React.FC<InvoiceTotalsSectionProps> = ({
    accordionValue,
    onAccordionValueChange,
}) => {
    const { t } = useTranslation();
    const { org } = useOrg();
    const {
        invoice,
        calculations,
        setGlobalDiscount,
        toggleGlobalDiscount,
        toggleItemDiscount
    } = useInvoice();

    // Get data from context
    const showItemDiscount = invoice.item_discount_enabled;
    const showGlobalDiscount = invoice.discount > 0;
    const globalDiscountPercent = invoice.discount;

    const {
        subtotalBeforeDiscount,
        itemsDiscount,
        globalDiscountAmount,
        subtotal,
        taxesByType,
        total
    } = calculations;

    // Determine if invoice uses a foreign currency
    const localCurrency = org?.currency ?? "EUR";
    const invoiceCurrency = invoice.currency || localCurrency;
    const exchangeRate = invoice.exchange_rate ?? 1;
    const isForeignCurrency = invoiceCurrency !== localCurrency && exchangeRate !== 1;

    // Helper to create currency data object for CurrencyLabel
    const currencyData = (value: number) =>
        isForeignCurrency ? { value, currency: invoiceCurrency } : value;

    // Convert amount from invoice currency to local currency
    // Convention: 1 localCurrency = exchangeRate invoiceCurrency
    const toLocal = (amount: number) => amount / exchangeRate;

    return (
        <div className="w-96 space-y-2">
            {/* Discount Accordion */}
            <Accordion
                type="single"
                collapsible
                className="w-full"
                value={accordionValue}
                onValueChange={onAccordionValueChange}
            >
                <AccordionItem value="discount" className="border-none">
                    <AccordionTrigger className="py-2 hover:no-underline">
                        <div className="flex items-center gap-2">
                            <Percent className="h-4 w-4" />
                            <span className="text-sm font-medium">
                                {t("invoices.discountOptions", "Descuento")}
                            </span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2 pb-4">
                        {/* Per-Item Discount Switch */}
                        <div className="flex items-center justify-between">
                            <Label htmlFor="item-discount" className="text-sm cursor-pointer">
                                {t("invoices.discountPerItem", "Descuento por producto")}
                            </Label>
                            <Switch
                                id="item-discount"
                                checked={showItemDiscount}
                                onCheckedChange={toggleItemDiscount}
                            />
                        </div>
                        {/* Global Discount Switch */}
                        <div className="flex items-center justify-between">
                            <Label htmlFor="global-discount" className="text-sm cursor-pointer">
                                {t("invoices.globalDiscount", "Descuento global")}
                            </Label>
                            <Switch
                                id="global-discount"
                                checked={showGlobalDiscount}
                                onCheckedChange={toggleGlobalDiscount}
                            />
                        </div>

                        {/* Global Discount Input */}
                        {showGlobalDiscount && (
                            <div className="px-1">
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={globalDiscountPercent}
                                        onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
                                        placeholder="0"
                                        className="h-8"
                                        step="any"
                                    />
                                    <span className="text-sm text-muted-foreground">%</span>
                                </div>
                            </div>
                        )}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            {/* Subtotal before discount */}
            <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">
                    {t("invoices.subtotalBeforeDiscount", "Subtotal sin descuento")}
                </span>
                <CurrencyLabel data={currencyData(subtotalBeforeDiscount)} className="font-medium" />
            </div>

            {/* Items discount */}
            {itemsDiscount > 0 && (
                <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">
                        {t("invoices.itemsDiscount", "Descuento por producto")}
                    </span>
                    <CurrencyLabel data={isForeignCurrency ? { value: itemsDiscount, currency: invoiceCurrency } : itemsDiscount} variant="negative-loss" className="font-medium" />
                </div>
            )}

            {/* Global discount */}
            {globalDiscountAmount > 0 && (
                <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">
                        {t("invoices.globalDiscount", "Descuento global")} ({formatPercentage(globalDiscountPercent / 100)})
                    </span>
                    <CurrencyLabel data={isForeignCurrency ? { value: globalDiscountAmount, currency: invoiceCurrency } : globalDiscountAmount} variant="negative-loss" className="font-medium" />
                </div>
            )}

            {/* Subtotal after discount */}
            <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">
                    {t("invoices.subtotal", "Subtotal")}
                </span>
                <CurrencyLabel data={currencyData(subtotal)} className="font-medium" />
            </div>

            {/* Taxes by type */}
            {Object.entries(taxesByType).map(([taxType, amount]) => (
                <div key={taxType} className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground capitalize">
                        {taxType}:
                    </span>
                    <CurrencyLabel data={currencyData(amount)} className="font-medium" />
                </div>
            ))}

            {/* Exchange rate row (only for foreign currency invoices) */}
            {isForeignCurrency && (
                <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                        {t("invoices.exchangeRate", "Tipo de cambio")}
                    </span>
                    <span className="text-sm font-medium">
                        1 {localCurrency} = {exchangeRate.toFixed(4)} {invoiceCurrency}
                    </span>
                </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-center py-2">
                <span className="text-base font-semibold">
                    {t("invoices.total", "Total")}
                </span>
                <div className="flex flex-col items-end">
                    <CurrencyLabel data={currencyData(total)} className="text-base font-bold" />
                    {isForeignCurrency && (
                        <CurrencyLabel
                            data={{ value: toLocal(total), currency: localCurrency }}
                            className="text-xs text-muted-foreground font-normal"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default InvoiceTotalsSection;
