import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import CurrencyLabel from "@/app/components/labels/currency-label";
import { useBillableItems } from "../contexts/BillableItemsContext";
import { formatPercentage } from "@/utils/miscelanea";

const BillableItemsTotals: React.FC = () => {
    const { t } = useTranslation();
    const { calculations, indirectCostCalculations, commutingCalculations } = useBillableItems();

    const {
        subtotal,
        discountAmount,
        subtotalAfterDiscount,
        taxesByType,
        total,
        totalCostPrice,
        totalMargin,
    } = calculations;

    const {
        totalIndirectCosts,
        netMargin,
        netMarginPercentage,
        lineItems: indirectCostLineItems,
    } = indirectCostCalculations;

    const hasIndirectCosts = indirectCostLineItems.some((item) => item.enabled);
    const hasCommuting = commutingCalculations.subtotal > 0 || commutingCalculations.totalCostPrice > 0;

    const aggregatedTaxesByType: Record<string, number> = { ...taxesByType };
    if (hasCommuting) {
        Object.entries(commutingCalculations.taxesByType).forEach(([taxType, amount]) => {
            aggregatedTaxesByType[taxType] = (aggregatedTaxesByType[taxType] ?? 0) + amount;
        });
    }

    const combinedTotal = total + (hasCommuting ? commutingCalculations.total : 0);

    return (
        <div className="w-96 space-y-1">
            <h3 className="text-lg font-semibold">
                {t("workOrders.financialSummary", "Costs Summary")}
            </h3>

            <div className="flex justify-between items-center py-2 pb-6 gap-2">
                <div className="flex flex-col gap-2 bg-muted px-4 py-2 rounded-md w-full h-20 justify-center">
                    <span className="text-xs text-muted-foreground">
                        {t("workOrders.total", "Total")}
                    </span>
                    <CurrencyLabel data={combinedTotal} className="font-semibold text-2xl" />
                </div>

                <div className="flex flex-col bg-muted px-4 py-2 rounded-md w-full h-20 justify-center">
                    <span className="text-xs text-muted-foreground pb-2">
                        {hasIndirectCosts
                            ? t("workOrders.netMargin", "Net Margin")
                            : t("workOrders.margin", "Margen")}
                    </span>
                    {hasIndirectCosts && netMarginPercentage != null ? (
                        <div className="inline-flex items-end gap-1">
                            <span
                                className={`text-2xl font-semibold ${netMargin >= 0
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                    }`}
                            >
                                {formatPercentage(netMarginPercentage / 100) + " "}
                            </span>
                            <span className={`text-xs ${netMargin >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                                }`}>
                                (<CurrencyLabel
                                    data={netMargin}
                                    className={`text-xs ${netMargin >= 0
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-red-600 dark:text-red-400"
                                        }`}
                                />)
                            </span>
                        </div>
                    ) : totalMargin != null ? (
                        <div className="inline-flex items-center gap-1">
                            <span
                                className={`text-2xl font-semibold ${totalMargin >= 0
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                    }`}
                            >
                                {formatPercentage(totalMargin / 100) + " "}
                            </span>
                            <span className={`text-xs ${totalMargin >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                                }`}>
                                (<CurrencyLabel
                                    data={(subtotalAfterDiscount + commutingCalculations.subtotal) - (totalCostPrice + commutingCalculations.totalCostPrice)}
                                    className={`text-xs ${totalMargin >= 0
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-red-600 dark:text-red-400"
                                        }`}
                                />)
                            </span>
                        </div>
                    ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                    )}
                </div>
            </div>

            {/* Subtotal */}
            <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">
                    {t("workOrders.subtotal", "Subtotal")}
                </span>
                <CurrencyLabel data={subtotal} className="font-medium" />
            </div>

            {discountAmount > 0 && (
                <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">
                        {t("workOrders.discount", "Descuento")}
                    </span>
                    <CurrencyLabel
                        data={discountAmount}
                        variant="negative-loss"
                        className="font-medium"
                    />
                </div>
            )}

            {discountAmount > 0 && (
                <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">
                        {t("workOrders.subtotalAfterDiscount", "Subtotal con dto.")}
                    </span>
                    <CurrencyLabel data={subtotalAfterDiscount} className="font-medium" />
                </div>
            )}

            {/* Commuting */}
            {hasCommuting && (
                <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">
                        {t("workOrders.commuting", "Commuting")}
                    </span>
                    <CurrencyLabel data={commutingCalculations.subtotal} className="font-medium" />
                </div>
            )}

            {/* Aggregated taxes (billable items + commuting) */}
            {Object.entries(aggregatedTaxesByType).map(([taxType, amount]) => (
                <div key={taxType} className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground capitalize">{taxType}:</span>
                    <CurrencyLabel data={amount} className="font-medium" />
                </div>
            ))}

            {/* PC Total */}
            {totalCostPrice > 0 && (
                <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">
                        {t("workOrders.totalCostPrice", "PC Total")}
                    </span>
                    <CurrencyLabel data={totalCostPrice} className="font-medium" />
                </div>
            )}

            {/* Commuting PC */}
            {hasCommuting && commutingCalculations.totalCostPrice > 0 && (
                <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">
                        {t("workOrders.commuting", "Commuting")} {t("workOrders.costPrice", "PC")}
                    </span>
                    <CurrencyLabel data={commutingCalculations.totalCostPrice} className="font-medium" />
                </div>
            )}

            {/* Margin */}
            {totalMargin != null && (
                <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">
                        {t("workOrders.margin", "Margen")}
                    </span>
                    <span
                        className={`text-sm font-medium ${totalMargin >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                            }`}
                    >
                        {formatPercentage(totalMargin / 100)} (
                        <CurrencyLabel
                            data={(subtotalAfterDiscount + commutingCalculations.subtotal) - (totalCostPrice + commutingCalculations.totalCostPrice)}
                            className={`text-sm font-medium ${totalMargin >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                                }`}
                        />
                        )
                    </span>
                </div>
            )}

            {/* Indirect Costs */}
            {hasIndirectCosts && (
                <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">
                        {t("workOrders.totalIndirectCosts", "Indirect Costs")}
                    </span>
                    <CurrencyLabel
                        data={totalIndirectCosts}
                        variant="negative-loss"
                        className="font-medium"
                    />
                </div>
            )}

            {/* Net Margin */}
            {hasIndirectCosts && netMarginPercentage != null && (
                <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">
                        {t("workOrders.netMargin", "Net Margin")}
                    </span>
                    <span
                        className={`text-sm font-medium ${netMargin >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                            }`}
                    >
                        {formatPercentage(netMarginPercentage / 100)} (
                        <CurrencyLabel
                            data={netMargin}
                            className={`text-sm font-medium ${netMargin >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                                }`}
                        />
                        )
                    </span>
                </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-center py-2">
                <span className="text-base font-semibold">
                    {t("workOrders.total", "Total")}
                </span>
                <CurrencyLabel data={combinedTotal} className="text-base font-bold" />
            </div>
        </div>
    );
};

export default BillableItemsTotals;
