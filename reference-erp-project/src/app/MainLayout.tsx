import AppSidebar from "@/app/components/sidebars/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import MainRoutes from "./MainRoutes";
import DynamicBreadcrumb from "@/app/components/dynamic-breadcrumb";
import ChatPanel from "@/app/chat/ChatPanel";
import { ChatProvider, useChatContext } from "@/app/chat/context/ChatContext";
import ChatSidebar from "@/app/components/sidebars/chat-sidebar";
import FloatingChatShell from "@/app/chat/components/floating-chat-shell";
import { useLocation, useNavigate, useParams } from "react-router";
import { OrgProvider } from "./contexts/OrgContext";
import { OrgMeProvider } from "./contexts/OrgMeContext";
import "@/styles/custom_scrollbar.css";
import CustomScroller from "react-custom-scroller";
import { MainNotifications } from "./components/main-notifications";
import { UnsavedChangesGlobalModal } from "./components/forms-elements/modal-unsaved";
import { DocsModalProvider } from "./components/modals/docs-modal";
import { MissionControlShellProvider } from "./mission-control/context/MissionControlShellContext";
import MissionControlSidebar from "@/app/components/sidebars/mission-control-sidebar";
import { cn } from "@/lib/utils";

function AgentModeLayout() {
  return (
    <div className="flex h-screen w-screen">
      <SidebarProvider>
        <ChatSidebar />
        <div className="flex-1 min-w-0 h-full">
          <ChatPanel fullscreen />
        </div>
      </SidebarProvider>
    </div>
  );
}

function DefaultLayout() {
  const location = useLocation();
  const { orgId } = useParams<{ orgId: string }>();
  const isMissionControl =
    !!orgId &&
    (location.pathname === `/${orgId}/mission-control` ||
      location.pathname.startsWith(`/${orgId}/mission-control/`));

  const [sidebarOpen, setSidebarOpen] = useState(
    (localStorage.getItem("sidebar-open") || "true") === "true"
  );

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <SidebarProvider
        open={isMissionControl ? false : sidebarOpen}
        onOpenChange={
          isMissionControl
            ? () => { }
            : (open) => {
              localStorage.setItem("sidebar-open", open.toString());
              setSidebarOpen(open);
            }
        }
      >
        {isMissionControl ? (
          <MissionControlShellProvider>
            <MissionControlSidebar />
          </MissionControlShellProvider>
        ) : (
          <AppSidebar />
        )}
        <SidebarInset className="flex flex-col h-screen min-w-0">
          {!isMissionControl && (
            <>
              <header className="flex h-14 shrink-0 bg-transparent! items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 min-w-0 z-10">
                <div className="flex items-center gap-2 p-4 flex-1 min-w-0 overflow-hidden">
                  <SidebarTrigger className="-ml-1 shrink-0" />
                  <Separator
                    orientation="vertical"
                    className="mr-2 data-[orientation=vertical]:h-4 shrink-0"
                  />
                  <DynamicBreadcrumb />
                </div>
                <div className="px-2 sm:px-4 shrink-0 flex items-center gap-2">
                  <MainNotifications />
                </div>
              </header>
            </>
          )}
          <div className="flex-1 min-h-0 min-w-0 overflow-x-hidden overflow-y-auto scrollbar-hide">
            <CustomScroller
              className="h-full w-full"
              innerClassName="flex flex-grow flex-col gap-4"
            >
              <div className={cn(
                "max-w-420 mx-auto w-full md:px-6", isMissionControl && "max-w-full md:px-2")}>
                <MainRoutes />
              </div>
            </CustomScroller>
          </div>
        </SidebarInset>
      </SidebarProvider>

      <FloatingChatShell />
    </div>
  );
}

function MainLayoutContent() {
  const { agentMode } = useChatContext();

  if (agentMode) {
    return <AgentModeLayout />;
  }

  return <DefaultLayout />;
}

export default function MainLayout() {
  const navigate = useNavigate();
  const { orgId } = useParams<{ orgId: string }>();

  useEffect(() => {
    if (!orgId) {
      // If no orgId in URL, check for last org in localStorage
      const lastOrgId = localStorage.getItem("last-org-id");
      if (lastOrgId) {
        navigate(`/${lastOrgId}`);
      } else {
        navigate("/orgs");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  return (
    <OrgProvider>
      <OrgMeProvider>
        <ChatProvider>
          <DocsModalProvider>
            <MainLayoutContent />
            <UnsavedChangesGlobalModal />
          </DocsModalProvider>
        </ChatProvider>
      </OrgMeProvider>
    </OrgProvider>
  );
}
