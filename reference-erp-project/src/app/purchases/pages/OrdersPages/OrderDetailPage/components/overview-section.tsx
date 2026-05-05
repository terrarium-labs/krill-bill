import { useTranslation } from "react-i18next";
import { useOrder } from "../../contexts/OrderContext";
import { Progress } from "@/components/ui/progress";
import { Package, DollarSign } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Tag from "@/app/components/tag/tag";
import { formatCurrency } from "@/utils/miscelanea";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipContent } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

const OverviewSection = () => {
    const { t } = useTranslation();
    const { order } = useOrder();

    // Calculate delivery percentage
    const deliveryPercentage = order.num_items > 0
        ? Math.round(((order.num_items_delivered || 0) / (order.num_items || 0)) * 100)
        : 0;

    // Calculate total with taxes
    const totalTaxes = order.taxes?.reduce((sum, tax) => 
        sum + (tax.is_negative ? -tax.amount : tax.amount), 0
    ) || 0;

    return (
        <div className="flex gap-4 border border-border rounded-xl">
            {/* KPI Card 1 - Reception Status */}
            <div className="p-5 w-full">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span className="text-sm ">
                            {t('orders.receptionStatus', 'Reception Status')}
                        </span>
                    </div>
                    <Tag text={order.status} className="capitalize" />
                </div>
                <div className="space-y-2">
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-medium">
                            {order.num_items_delivered || 0}
                        </span>
                        <span className="text-lg text-muted-foreground">
                            / {order.num_items || 0}
                        </span>
                        <span className="text-sm text-muted-foreground ml-1">
                            {t('orders.items', 'items')}
                        </span>
                    </div>
                    <Progress value={deliveryPercentage} className="h-1.5" />
                </div>
            </div>

            <div className="py-5">
                <Separator orientation="vertical" className="py-4" />
            </div>

            <div className="p-5 w-full">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm ">
                            {t('orders.economicValue', 'Total Value')}
                        </span>
                    </div>
                    <Tag text={`${order.num_items || 0} ${t('orders.items', 'items')}`} icon={'box'} color="text-primary" />
                </div>

                <div className="flex flex-col gap-0.5">
                    <span className="text-2xl text-primary font-medium">
                        {formatCurrency(order.total_price)}
                    </span>

                    <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">
                            {t('orders.totalPrice', 'Subtotal: ')} {formatCurrency(order.subtotal)} | {t('orders.taxes', 'Taxes: ')} {formatCurrency(totalTaxes)}
                        </span>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    <div className="space-y-1">
                                        {order.taxes && order.taxes.length > 0 ? (
                                            order.taxes.map((tax) => (
                                                <div key={tax.tax} className="flex justify-between gap-4 text-xs">
                                                    <span className="capitalize">{tax.tax}:</span>
                                                    <span>{formatCurrency(tax.amount)}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-xs">{t("orders.noTaxes", "No taxes")}</div>
                                        )}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewSection;

