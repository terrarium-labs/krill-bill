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

interface SaleInvoiceTotalsSectionProps {
    accordionValue: string | undefined;
    onAccordionValueChange: (value: string | undefined) => void;
}

const SaleInvoiceTotalsSection: React.FC<SaleInvoiceTotalsSectionProps> = ({
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
        toggleItemDiscount,
        isReadOnly,
    } = useInvoice();

    const showItemDiscount = invoice.item_discount_enabled;
    const showGlobalDiscount = invoice.discount > 0;
    const globalDiscountPercent = invoice.discount;

    const {
        subtotalBeforeDiscount,
        itemsDiscount,
        globalDiscountAmount,
        subtotal,
        taxesByType,
        total,
        totalCostPrice,
        totalMargin
    } = calculations;

    const localCurrency = org?.currency ?? "EUR";
    const invoiceCurrency = invoice.currency || localCurrency;
    const exchangeRate = invoice.exchange_rate ?? 1;
    const isForeignCurrency = invoiceCurrency !== localCurrency && exchangeRate !== 1;

    const currencyData = (value: number) =>
        isForeignCurrency ? { value, currency: invoiceCurrency } : value;

    const toLocal = (amount: number) => amount / exchangeRate;

    return (
        <div className="w-96 space-y-2">
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
                        <div className="flex items-center justify-between">
                            <Label htmlFor="item-discount" className="text-sm cursor-pointer">
                                {t("invoices.discountPerItem", "Descuento por producto")}
                            </Label>
                            <Switch
                                id="item-discount"
                                checked={showItemDiscount}
                                onCheckedChange={toggleItemDiscount}
                                disabled={isReadOnly}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="global-discount" className="text-sm cursor-pointer">
                                {t("invoices.globalDiscount", "Descuento global")}
                            </Label>
                            <Switch
                                id="global-discount"
                                checked={showGlobalDiscount}
                                onCheckedChange={toggleGlobalDiscount}
                                disabled={isReadOnly}
                            />
                        </div>
                        {showGlobalDiscount && (
                            <div className="px-1">
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={globalDiscountPercent}
                                        onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
                                        placeholder="0"
                                        className="disabled:opacity-80 disabled:cursor-not-allowed h-8"
                                        step="any"
                                        disabled={isReadOnly}
                                    />
                                    <span className="text-sm text-muted-foreground">%</span>
                                </div>
                            </div>
                        )}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">
                    {t("invoices.subtotalBeforeDiscount", "Subtotal sin descuento")}
                </span>
                <CurrencyLabel data={currencyData(subtotalBeforeDiscount)} className="font-medium" />
            </div>

            {itemsDiscount > 0 && (
                <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">
                        {t("invoices.itemsDiscount", "Descuento por producto")}
                    </span>
                    <CurrencyLabel data={isForeignCurrency ? { value: itemsDiscount, currency: invoiceCurrency } : itemsDiscount} variant="negative-loss" className="font-medium" />
                </div>
            )}

            {globalDiscountAmount > 0 && (
                <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">
                        {t("invoices.globalDiscount", "Descuento global")} ({globalDiscountPercent}%)
                    </span>
                    <CurrencyLabel data={isForeignCurrency ? { value: globalDiscountAmount, currency: invoiceCurrency } : globalDiscountAmount} variant="negative-loss" className="font-medium" />
                </div>
            )}

            <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">
                    {t("invoices.subtotal", "Subtotal")}
                </span>
                <CurrencyLabel data={currencyData(subtotal)} className="font-medium" />
            </div>

            {Object.entries(taxesByType).map(([taxType, amount]) => (
                <div key={taxType} className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground capitalize">{taxType}:</span>
                    <CurrencyLabel data={currencyData(amount)} className="font-medium" />
                </div>
            ))}

            {totalCostPrice > 0 && (
                <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">
                        {t("invoices.totalCostPrice", "PC Total")}
                    </span>
                    <CurrencyLabel data={currencyData(totalCostPrice)} className="font-medium" />
                </div>
            )}

            {totalMargin != null && (
                <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">
                        {t("invoices.margin", "Margen")}
                    </span>
                    <span className={`text-sm font-medium ${totalMargin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatPercentage(totalMargin/100)} (<CurrencyLabel data={currencyData(subtotal - totalCostPrice)} className={`text-sm font-medium ${totalMargin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />)
                    </span>
                </div>
            )}

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

            <div className="flex justify-between items-center py-2">
                <span className="text-base font-semibold">{t("invoices.total", "Total")}</span>
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

export default SaleInvoiceTotalsSection;
