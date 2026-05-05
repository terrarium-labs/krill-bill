import React from "react";
import { Info, Settings } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { Checkbox } from "@/components/ui/checkbox";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import CurrencyLabel from "@/app/components/labels/currency-label";
import { useBillableItems, IndirectCostLineItem } from "../contexts/BillableItemsContext";
import { formatCurrency, formatPercentage } from "@/utils/miscelanea";
import { useOrg } from "@/app/contexts/OrgContext";

const RangesHoverCard: React.FC<{ item: IndirectCostLineItem }> = ({ item }) => {
    const { t } = useTranslation();
    const { ranges, is_percentage } = item.indirectCost;
    const { org } = useOrg();
    return (
        <HoverCard>
            <HoverCardTrigger asChild>
                <button type="button" className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                    <Info className="h-3.5 w-3.5" />
                </button>
            </HoverCardTrigger>
            <HoverCardContent align="start" className="w-72">
                <p className="text-xs font-medium mb-2">
                    {t("workOrders.indirectCostRanges", "Ranges")}
                </p>
                <div className="flex flex-col gap-1.5">
                    {ranges.map((range, idx) => (
                        <div
                            key={idx}
                            className={`flex justify-between text-xs px-1.5 py-1 rounded ${
                                item.applicableValue === range.value
                                    ? "bg-primary/10 font-medium"
                                    : "text-muted-foreground"
                            }`}
                        >
                            <span>
                                {formatCurrency(range.from_quantity, org?.currency ?? "EUR")} – {range.to_quantity === null ? "∞" : formatCurrency(range.to_quantity, org?.currency ?? "EUR")}
                            </span>
                            <span className="font-medium text-foreground">
                                {is_percentage ? formatPercentage(range.value / 100) : formatCurrency(range.value, org?.currency ?? "EUR")}
                            </span>
                        </div>
                    ))}
                </div>
            </HoverCardContent>
        </HoverCard>
    );
};

const IndirectCostsSection: React.FC = () => {
    const { t } = useTranslation();
    const { toggleIndirectCost, indirectCostCalculations, calculations } = useBillableItems();

    const { lineItems, totalIndirectCosts, netMargin, netMarginPercentage } = indirectCostCalculations;

    const { orgId } = useParams();

    if (lineItems.length === 0) {
        return (
            <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-muted-foreground">
                <Info className="h-5 w-5 shrink-0" />
                <div className="flex-1 text-sm">
                    {t(
                        "workOrders.noIndirectCostsConfigured",
                        "No indirect costs configured yet."
                    )}{" "}
                    <Link
                        to={`/${orgId}/admin/indirect-costs`}
                        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                        <Settings className="h-3.5 w-3.5" />
                        {t("workOrders.goToSettings", "Configure in Settings")}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="space-y-1">
                {lineItems.map((item) => (
                    <div
                        key={item.indirectCost.id}
                        className={`flex items-center justify-between py-2.5 px-3 rounded-md border transition-colors ${
                            item.enabled
                                ? "bg-background border-border"
                                : "bg-muted/50 border-border/50 opacity-60"
                        }`}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <Checkbox
                                checked={item.enabled}
                                onCheckedChange={() => toggleIndirectCost(item.indirectCost.id)}
                            />
                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span
                                        className={`text-sm truncate ${
                                            !item.enabled ? "line-through text-muted-foreground" : ""
                                        }`}
                                    >
                                        {item.indirectCost.name}
                                    </span>
                                    {item.indirectCost.ranges.length > 0 && (
                                        <RangesHoverCard item={item} />
                                    )}
                                </div>
                                {item.indirectCost.description && (
                                    <span className="text-xs text-muted-foreground line-clamp-1">
                                        {item.indirectCost.description}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {item.applicableValue !== null && item.indirectCost.is_percentage && (
                                <span className="text-xs text-muted-foreground">
                                    {formatPercentage(item.applicableValue / 100)}
                                </span>
                            )}
                            <CurrencyLabel
                                data={item.amount}
                                className={`text-sm font-medium min-w-[80px] text-right ${
                                    !item.enabled ? "line-through text-muted-foreground" : ""
                                }`}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Indirect Costs Total & Net Margin */}
            <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                        {t("workOrders.totalIndirectCosts", "Total Indirect Costs")}
                    </span>
                    <CurrencyLabel
                        data={totalIndirectCosts}
                        variant="negative-loss"
                        className="text-sm font-semibold"
                    />
                </div>

                {calculations.totalCostPrice > 0 && (
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                            {t("workOrders.netMargin", "Net Margin")}
                        </span>
                        <span
                            className={`text-sm font-semibold ${
                                netMargin >= 0
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                            }`}
                        >
                            {netMarginPercentage !== null
                                ? `${formatPercentage(netMarginPercentage / 100)} (`
                                : ""}
                            <CurrencyLabel
                                data={netMargin}
                                className={`text-sm font-semibold ${
                                    netMargin >= 0
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-red-600 dark:text-red-400"
                                }`}
                            />
                            {netMarginPercentage !== null ? ")" : ""}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IndirectCostsSection;
