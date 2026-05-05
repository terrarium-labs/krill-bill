import { useChatContext } from "@/app/chat/context/ChatContext";

interface SuggestedResponse {
    label: string;
    /** If omitted, sends `label` as-is */
    message?: string;
}

export interface SuggestedResponsesWidgetData {
    responses: SuggestedResponse[];
}

const SuggestedResponsesWidget = ({ data }: { data: SuggestedResponsesWidgetData }) => {
    const chat = useChatContext();

    return (
        <div className="flex flex-wrap gap-1.5">
            {data.responses.map((r, i) => (
                <button
                    key={i}
                    onClick={() => chat?.handleSendMessage(r.message ?? r.label)}
                    className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                >
                    {r.label}
                </button>
            ))}
        </div>
    );
};

export default SuggestedResponsesWidget;
