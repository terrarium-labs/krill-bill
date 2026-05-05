import MarkdownRenderer from "@/app/components/MarkdownRenderer";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Ticket } from "@/types/field-service/tickets/tickets";
import { getColorClasses } from "@/utils/miscelanea";

interface TicketInsightsCardProps {
    data: Ticket | null;
}

// Get tag color
export const getInsightsLevelColor = (level: string): string => {
    switch (level) {
        case "low":
            return "green";
        case "medium":
            return "yellow";
        case "high":
            return "orange";
        case "urgent":
            return "red";
        default:
            return "gray";
    }
};

const TicketInsightsCard = ({ data }: TicketInsightsCardProps) => {
    const { t } = useTranslation();
    const insights = typeof data === "string" ? data : data?.ai_insights;
    const levelColor =
        data?.ai_insights_level != null
            ? getColorClasses(getInsightsLevelColor(data.ai_insights_level))
            : "";
    return (
        <div className={`rounded-lg border px-4 py-3 space-y-3 ${levelColor}`}>
            <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 shrink-0" />
                <span className="font-semibold">
                    {t("tickets.aiInsights", "AI Insights")}
                </span>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                <MarkdownRenderer breakAll={false} content={insights ?? ""} textSizeMultiplier={0.9} />
            </div>
        </div>
    );
};

export default TicketInsightsCard;