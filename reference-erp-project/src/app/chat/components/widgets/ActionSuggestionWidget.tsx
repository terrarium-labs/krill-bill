import { Icon } from "@iconify/react";
import { useChatContext } from "@/app/chat/context/ChatContext";

interface Action {
    label: string;
    description?: string;
    message: string;
    icon?: string;
    /** Colour hint: "blue" | "green" | "orange" | "red" | "purple" | hex */
    color?: string;
}

export interface ActionSuggestionWidgetData {
    actions: Action[];
}

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    blue:   { bg: "bg-blue-500/10",   border: "border-blue-500/30",   text: "text-blue-400",   icon: "text-blue-400"   },
    green:  { bg: "bg-green-500/10",  border: "border-green-500/30",  text: "text-green-400",  icon: "text-green-400"  },
    orange: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", icon: "text-orange-400" },
    red:    { bg: "bg-red-500/10",    border: "border-red-500/30",    text: "text-red-400",    icon: "text-red-400"    },
    purple: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400", icon: "text-purple-400" },
};

const getColors = (color?: string) =>
    COLOR_MAP[color ?? ""] ?? { bg: "bg-muted/40", border: "border-border", text: "text-foreground", icon: "text-muted-foreground" };

const ActionSuggestionWidget = ({ data }: { data: ActionSuggestionWidgetData }) => {
    const chat = useChatContext();

    return (
        <div className="flex flex-col gap-1.5">
            {data.actions.map((action, i) => {
                const c = getColors(action.color);
                return (
                    <button
                        key={i}
                        onClick={() => chat?.handleSendMessage(action.message)}
                        className={`flex items-start gap-2.5 rounded-md border px-3 py-2 text-left transition-opacity hover:opacity-80 ${c.bg} ${c.border}`}
                    >
                        <Icon
                            icon={action.icon ?? "solar:magic-stick-3-linear"}
                            className={`size-4 mt-0.5 shrink-0 ${c.icon}`}
                        />
                        <div className="flex flex-col min-w-0">
                            <span className={`text-xs font-medium ${c.text}`}>{action.label}</span>
                            {action.description && (
                                <span className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                    {action.description}
                                </span>
                            )}
                        </div>
                        <Icon icon="solar:arrow-right-linear" className="size-3.5 mt-0.5 ml-auto shrink-0 text-muted-foreground/50" />
                    </button>
                );
            })}
        </div>
    );
};

export default ActionSuggestionWidget;
