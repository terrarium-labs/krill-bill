import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";
import { WorkOrder } from "@/types/field-service/work-orders/work-orders";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface OrdersAIInsightsCardProps {
    workOrders: WorkOrder[];
}

const OrdersAIInsightsCard = ({ workOrders }: OrdersAIInsightsCardProps) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const insightsData = useMemo(() => {
        const withInsights = workOrders.filter((wo) => wo.ai_insights);
        if (withInsights.length === 0) return null;

        const priorityRank: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
        const sorted = [...withInsights].sort((a, b) => {
            const pa = priorityRank[a.priority ?? ""] ?? 0;
            const pb = priorityRank[b.priority ?? ""] ?? 0;
            return pb - pa;
        });

        const combined = sorted
            .slice(0, 5)
            .map((wo) => {
                const label = wo.name || wo.id.slice(0, 8);
                return `**${label}:** ${wo.ai_insights}`;
            })
            .join("\n\n---\n\n");

        return { content: combined, count: withInsights.length };
    }, [workOrders]);

    if (!insightsData) return null;

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="rounded-lg border bg-muted/20 overflow-hidden">
                <CollapsibleTrigger className="flex items-center gap-2 w-full px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer">
                    {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="font-semibold text-sm">
                        {t("missionControl.orders.aiInsights", "AI Insights")}
                    </span>
                    <Badge variant="secondary" className="ml-auto text-xs tabular-nums">
                        {insightsData.count}
                    </Badge>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-xs px-4 pb-3 max-h-40 overflow-y-auto">
                        <MarkdownRenderer breakAll={false} content={insightsData.content} textSizeMultiplier={0.8} />
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
};

export default OrdersAIInsightsCard;
