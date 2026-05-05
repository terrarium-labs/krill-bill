import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { useChatContext } from "@/app/chat/context/ChatContext";

interface ButtonItem {
    label: string;
    message: string;
    icon?: string;
    variant?: "default" | "outline" | "secondary" | "destructive" | "ghost";
    description?: string;
}

export interface ButtonListWidgetData {
    buttons: ButtonItem[];
    layout?: "row" | "column";
}

const ButtonListWidget = ({ data }: { data: ButtonListWidgetData }) => {
    const chat = useChatContext();
    const isColumn = data.layout === "column";

    return (
        <div className={`flex gap-2 flex-wrap ${isColumn ? "flex-col" : "flex-row"}`}>
            {data.buttons.map((btn, i) => (
                <Button
                    key={i}
                    size="sm"
                    variant={btn.variant ?? "outline"}
                    className="gap-1.5 h-7 text-xs justify-start shadow-none"
                    onClick={() => chat?.handleSendMessage(btn.message)}
                >
                    {btn.icon && <Icon icon={btn.icon} className="size-3.5 shrink-0" />}
                    <span className="truncate">{btn.label}</span>
                    {btn.description && (
                        <span className="text-muted-foreground font-normal ml-1 hidden sm:inline">
                            — {btn.description}
                        </span>
                    )}
                </Button>
            ))}
        </div>
    );
};

export default ButtonListWidget;
