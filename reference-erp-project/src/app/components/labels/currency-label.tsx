import React from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/miscelanea";
import { useOrg } from "@/app/contexts/OrgContext";

export type CurrencyLabelVariant = "gain" | "loss" | "negative-loss";

export type CurrencyLabelData =
    | string
    | number
    | {
          value: number | string;
          currency?: string;
          variant?: CurrencyLabelVariant;
      };

interface CurrencyLabelProps {
    data: CurrencyLabelData | null | undefined;
    variant?: CurrencyLabelVariant;
    blurred?: boolean;
    className?: string;
}

const variantClasses: Record<CurrencyLabelVariant, string> = {
    gain: "text-sm font-medium text-green-600 dark:text-green-400",
    loss: "text-sm font-medium text-red-600 dark:text-red-400",
    "negative-loss": "text-sm font-medium text-red-600 dark:text-red-400",
};

/**
 * CurrencyLabel – Renders a currency value with optional gain/loss styling.
 *
 * @param data - A pre-formatted string, a number, or an object { value, currency?, variant? }
 * @param variant - Optional variant when data is string, or overrides data.variant when data is object. "gain" (green), "loss" (red), "negative-loss" (red + leading minus)
 * @param blurred - When true, applies blur-sm select-none (same as payrolls table sensitive amounts)
 * @param className - Extra class names
 */
const blurClass = "blur-sm select-none";

const CurrencyLabel: React.FC<CurrencyLabelProps> = ({ data, variant: variantProp, blurred = false, className }) => {
    const { org } = useOrg();
    const defaultCurrency = org?.currency ?? "EUR";

    if (data == null) {
        return <span className="text-muted-foreground">-</span>;
    }

    if (typeof data === "string") {
        const resolvedVariant = variantProp;
        const classNames = resolvedVariant ? variantClasses[resolvedVariant] : "text-sm";
        return <span className={cn(classNames, blurred && blurClass, className)}>{data || "-"}</span>;
    }

    const isObject = typeof data === "object" && "value" in data;
    const rawValue = isObject ? data.value : data;
    const currency = isObject ? data.currency : undefined;
    const resolvedVariant = variantProp ?? (isObject ? data.variant : undefined);

    const value =
        typeof rawValue === "string" ? parseFloat(rawValue) : rawValue;
    if (value == null || Number.isNaN(value)) {
        return <span className="text-muted-foreground">-</span>;
    }

    const resolvedCurrency = currency ?? defaultCurrency;
    const amountToFormat = resolvedVariant === "negative-loss" ? Math.abs(value) : value;
    const formatted = formatCurrency(amountToFormat, resolvedCurrency);
    const displayValue = resolvedVariant === "negative-loss" ? `-${formatted}` : formatted;
    const classNames = resolvedVariant ? variantClasses[resolvedVariant] : "text-sm";

    return <span className={cn(classNames, blurred && blurClass, className)}>{displayValue}</span>;
};

export default CurrencyLabel;
