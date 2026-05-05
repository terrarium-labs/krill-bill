import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CharlesAuraCircle } from "@/app/chat/components/charles-chat-empty-aura";
import { useChatContext } from "@/app/chat/context/ChatContext";
import { BrainCircuit, History, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

/** Subtle hover on the aura circle */
const agentMarkShell = "transition-transform duration-300 ease-out hover:scale-105";

/** Shared chrome height — name pill and icon bubbles */
const CHROME_H = "h-10";
const CHROME_ICON_BOX = "size-10";

const bubbleShell =
  "rounded-full border border-border bg-background/75 shadow-lg backdrop-blur-md dark:bg-background/55";

export default function ChatFloatingChrome() {
  const { t } = useTranslation();
  const { toggleChat, setMessagesList, setChatRunning, setAgentMode } =
    useChatContext();

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
      <div
        className={cn(
          bubbleShell,
          CHROME_H,
          "flex items-center gap-1.5 pl-1.5 px-3 text-sm font-semibold leading-none text-foreground"
        )}
      >
        Charles
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                bubbleShell,
                "flex shrink-0 items-center justify-center p-0",
                CHROME_ICON_BOX
              )}
            >
              <Button
                variant="ghost"
                size="icon"
                className="size-full shrink-0 rounded-full border-0 shadow-none hover:bg-accent/90"
                onClick={() => {
                  setAgentMode((prev) => !prev);
                  setChatRunning(false);
                }}
              >
                <BrainCircuit className="h-4 w-4" />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{t("chat.actions.agentMode", "Agent mode")}</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                bubbleShell,
                "flex shrink-0 items-center justify-center p-0",
                CHROME_ICON_BOX
              )}
            >
              <Button
                variant="ghost"
                size="icon"
                className="size-full shrink-0 rounded-full border-0 shadow-none hover:bg-accent/90"
                onClick={() => {
                  setMessagesList([]);
                  setChatRunning(false);
                }}
              >
                <History className="h-4 w-4" />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{t("chat.actions.chatHistory", "Chat history")}</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                bubbleShell,
                "flex shrink-0 items-center justify-center p-0",
                CHROME_ICON_BOX
              )}
            >
              <Button
                variant="ghost"
                size="icon"
                className="size-full shrink-0 rounded-full border-0 shadow-none hover:bg-accent/90"
                onClick={() => {
                  setMessagesList([]);
                  setChatRunning(false);
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{t("chat.actions.newChat", "New chat")}</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                bubbleShell,
                "flex shrink-0 items-center justify-center p-0",
                CHROME_ICON_BOX
              )}
            >
              <Button
                variant="ghost"
                size="icon"
                className="size-full shrink-0 rounded-full border-0 shadow-none hover:bg-accent/90"
                onClick={toggleChat}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{t("chat.actions.closeChat", "Close chat")}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
