import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { useChatContext } from "@/app/chat/context/ChatContext";

export interface ButtonWidgetData {
    label: string;
    /** Message sent to the chat when clicked */
    message: string;
    icon?: string;
    variant?: "default" | "outline" | "secondary" | "destructive" | "ghost";
}

const ButtonWidget = ({ data }: { data: ButtonWidgetData }) => {
    const chat = useChatContext();

    const handleClick = () => {
        if (!data.message || !chat) return;
        chat.handleSendMessage(data.message);
    };

    return (
        <Button
            size="sm"
            variant={data.variant ?? "outline"}
            className="gap-1.5 h-7 text-xs shadow-none"
            onClick={handleClick}
        >
            {data.icon && <Icon icon={data.icon} className="size-3.5" />}
            {data.label}
        </Button>
    );
};

export default ButtonWidget;
