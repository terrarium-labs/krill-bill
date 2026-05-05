import { useState, useEffect, useCallback, useRef, memo } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Icon } from "@iconify/react";
import { fetchWidget, getCachedWidget, WidgetResponse } from "@/api/chat/widgets";
import ButtonWidget from "./widgets/ButtonWidget";
import ButtonListWidget from "./widgets/ButtonListWidget";
import ActionSuggestionWidget from "./widgets/ActionSuggestionWidget";
import SuggestedResponsesWidget from "./widgets/SuggestedResponsesWidget";
import FormWidget from "./widgets/FormWidget";
import ChartWidget from "./widgets/ChartWidget";

const WIDGET_REGISTRY: Record<string, React.ComponentType<{ data: any }>> = {
    button: ButtonWidget,
    button_list: ButtonListWidget,
    action_suggestion: ActionSuggestionWidget,
    suggested_responses: SuggestedResponsesWidget,
    form: FormWidget,
    chart: ChartWidget,
};

interface ChatWidgetProps {
    /** Raw href, e.g. "charles-widget://{widget_id}" */
    href: string;
    label: React.ReactNode;
    orgId: string;
}

const ChatWidget = memo(({ href, label, orgId }: ChatWidgetProps) => {
    const widgetId = href.replace(/^#charles-widget:/, "").replace(/^\/+/, "").split("?")[0] || null;

    const cached = widgetId && orgId ? getCachedWidget(orgId, widgetId) : null;
    const [widget, setWidget] = useState<WidgetResponse | null>(cached);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hasFetched = useRef(!!cached);

    const load = useCallback(async (skipCache = false) => {
        if (!widgetId || !orgId) return;
        setLoading(true);
        setError(null);
        try {
            const result = await fetchWidget(orgId, widgetId, { skipCache });
            const payload = (result as any)?.success ?? result;
            if ((result as any)?.error) throw new Error((result as any).error);
            setWidget(payload as WidgetResponse);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load widget");
        } finally {
            setLoading(false);
        }
    }, [widgetId, orgId]);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;
        load();
    }, [load]);

    const WidgetComponent = widget ? WIDGET_REGISTRY[widget.type] : null;

    const isRefresh = loading && !!widget;

    return (
        <div className="my-2 w-full flex flex-col gap-1.5 px-2">
            {/* Title bar */}
            {(widget?.title || loading || error) && (
                <div className="flex items-center gap-1.5">
                    {loading
                        ? <Spinner className="size-3" />
                        : <Icon icon="solar:widget-2-linear" className="size-3.5 text-muted-foreground shrink-0" />
                    }
                    <span className="text-xs text-muted-foreground font-medium">
                        {widget?.title ?? label}
                    </span>
                    {!loading && widget && (
                        <button
                            onClick={() => load(true)}
                            title="Refresh"
                            className="ml-auto text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                        >
                            <Icon icon="solar:refresh-linear" className="size-3" />
                        </button>
                    )}
                </div>
            )}

            {/* First load skeleton — no data yet */}
            {loading && !widget && (
                <div className="h-24 rounded-md bg-muted/40 animate-pulse" />
            )}

            {/* Error */}
            {!loading && error && (
                <div className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                    <Icon icon="lucide:alert-circle" className="size-3.5 shrink-0" />
                    {error}
                </div>
            )}

            {/* Widget — stays visible during refresh to preserve height */}
            {!error && widget && WidgetComponent && (
                <div className={isRefresh ? "opacity-50 pointer-events-none transition-opacity" : undefined}>
                    <WidgetComponent data={widget.data} />
                </div>
            )}

            {/* Unknown type */}
            {!loading && !error && widget && !WidgetComponent && (
                <div className="text-xs text-muted-foreground bg-muted/40 border border-border rounded-md px-3 py-2">
                    Unknown widget type: <code className="font-mono">{widget.type}</code>
                </div>
            )}
        </div>
    );
});

ChatWidget.displayName = "ChatWidget";

export default ChatWidget;
