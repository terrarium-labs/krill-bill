import { PenSquare, MessageSquare, ArrowLeft } from "lucide-react";
import { useChatContext } from "@/app/chat/context/ChatContext";
import { useTranslation } from "react-i18next";
import { NavMain } from "@/app/components/nav-main";
import { NavUser } from "@/app/components/nav-user";
import { TeamSwitcher } from "@/app/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import CustomScroller from "react-custom-scroller";
import "@/styles/custom_scrollbar.css";

interface ChatHistoryItem {
  id: string;
  title: string;
}

export default function ChatSidebar() {
  const { t } = useTranslation();
  const { setMessagesList, setChatRunning, setAgentMode } = useChatContext();

  const chatHistory: ChatHistoryItem[] = [];

  const handleNewChat = () => {
    setMessagesList([]);
    setChatRunning(false);
  };

  const handleBackToApp = () => {
    setAgentMode(false);
  };

  const chatNavItems = [
    {
      title: t("chat.sidebar.newChat", "Nuevo Chat"),
      icon: PenSquare,
      onClick: handleNewChat,
    },
    {
      title: t("chat.sidebar.backToApp", "Volver a la app"),
      icon: ArrowLeft,
      onClick: handleBackToApp,
    },
  ];

  return (
    <Sidebar collapsible="none">
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <CustomScroller className="h-full">
          <NavMain items={chatNavItems} />
          <SidebarGroup>
            <SidebarGroupLabel>
              {t("chat.sidebar.yourChats", "Tus Chats")}
            </SidebarGroupLabel>
            <SidebarMenu>
              {chatHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground px-3 py-2">
                  {t("chat.sidebar.noChats", "No se encontraron chats")}
                </p>
              ) : (
                chatHistory.map((chat) => (
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton asChild>
                      <button className="w-full text-left">
                        <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{chat.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroup>
        </CustomScroller>
      </SidebarContent>
      <SidebarFooter>
        <NavUser onNavigate={() => setAgentMode(false)} />
      </SidebarFooter>
    </Sidebar>
  );
}
