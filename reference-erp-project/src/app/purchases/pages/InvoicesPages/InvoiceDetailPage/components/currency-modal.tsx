import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { getOrgCurrencies } from "@/api/orgs/currencies/currencies";
import { patchPurchaseInvoice } from "@/api/purchase-invoices/purchase-invoices";
import { Currency } from "@/types/general/currencies";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { MultiSelectApi } from "@/app/components/forms-elements/multi-select-api";
import { useOrg } from "@/app/contexts/OrgContext";

interface CurrencyModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    invoiceId: string;
    currentCurrency: string;
    currentExchangeRate: number;
    onSuccess: () => void;
}

const CurrencyModal = ({
    open,
    onOpenChange,
    invoiceId,
    currentCurrency,
    currentExchangeRate,
    onSuccess,
}: CurrencyModalProps) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCurrencyId, setSelectedCurrencyId] = useState<string[]>([]);
    const [selectedCurrency, setSelectedCurrency] = useState<string>(currentCurrency || "");
    const [exchangeRate, setExchangeRate] = useState<number>(currentExchangeRate || 1);
    const [defaultItems, setDefaultItems] = useState<Currency[] | undefined>(undefined);

    const { org } = useOrg();

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            setSelectedCurrency(currentCurrency || "");
            setExchangeRate(currentExchangeRate || 1);
            if (currentCurrency) {
                setSelectedCurrencyId([currentCurrency]);
                setDefaultItems([{
                    id: null,
                    name: currentCurrency,
                    symbol: currentCurrency,
                    is_fixed: false,
                    exchange_rate: currentExchangeRate || 1,
                    updated_at: "",
                }]);
            } else {
                setSelectedCurrencyId([]);
                setDefaultItems(undefined);
            }
        }
    }, [open, currentCurrency, currentExchangeRate]);

    const handleSave = async () => {
        if (!orgId) return;

        setIsSubmitting(true);
        try {
            const response = await patchPurchaseInvoice(orgId, invoiceId, {
                currency: selectedCurrency,
                exchange_rate: exchangeRate,
            });

            if (response.success) {
                toast.success(t("invoices.currencyUpdated", "Currency updated successfully"));
                onSuccess();
                onOpenChange(false);
            } else {
                toast.error(t("invoices.currencyUpdateFailed", "Failed to update currency"));
            }
        } catch (error) {
            console.error("Error updating currency:", error);
            toast.error(t("invoices.currencyUpdateError", "Error updating currency"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>
                        {t("invoices.currency", "Currency")}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                    {/* Currency selector using MultiSelectApi */}
                    <div className="space-y-2">
                        <Label>{t("invoices.selectCurrency", "Currency")}</Label>
                        <MultiSelectApi
                            fetchOptions={getOrgCurrencies}
                            fetchArgs={[orgId]}
                            optionsKey="currencies"
                            customValueKey={(item: Currency) => item.symbol}
                            customLabelKey={(item: Currency) => (
                                <div className="flex items-center justify-between gap-2 w-full">
                                    <span className="font-medium w-8">{item.symbol}</span>
                                    <span className="text-muted-foreground text-xs">
                                        {item.exchange_rate}
                                    </span>
                                </div>
                            )}
                            customSelectedLabelKey={(item: Currency) => (
                                <span className="font-medium">{item.symbol}</span>
                            )}
                            value={selectedCurrencyId}
                            defaultItems={defaultItems}
                            onChangeValue={(values) => setSelectedCurrencyId(values)}
                            onChangeValueWithItem={(values, _itemsMap, lastItem) => {
                                if (lastItem) {
                                    setSelectedCurrency(lastItem.symbol);
                                    setExchangeRate(lastItem.exchange_rate);
                                } else if (values.length === 0) {
                                    setSelectedCurrency(org?.currency || "");
                                    setExchangeRate(1);
                                }
                            }}
                            maxCount={1}
                            placeholder={t("invoices.selectCurrency", "Select currency...")}
                            searchPlaceholder={t("invoices.searchCurrency", "Search currency...")}
                            emptyText={t("invoices.noCurrenciesFound", "No currencies found.")}
                            className="w-full"
                        />
                    </div>

                    {/* Exchange rate input */}
                    <div className="space-y-2">
                        <Label>{t("invoices.exchangeRate", "Exchange Rate")}</Label>
                        <Input
                            type="number"
                            step="0.0001"
                            min="0"
                            placeholder="1.0000"
                            value={exchangeRate}
                            onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                setExchangeRate(isNaN(value) ? 0 : value);
                            }}
                        />
                        <p className="text-xs text-muted-foreground">
                            {t(
                                "invoices.exchangeRateHint",
                                "You can edit the exchange rate manually if needed."
                            )}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            {t("common.cancel", "Cancel")}
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSubmitting || !selectedCurrency}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {t("common.saving", "Saving...")}
                                </>
                            ) : (
                                t("common.save", "Save")
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CurrencyModal;
