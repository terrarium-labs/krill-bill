import { useState } from 'react';
import { Outlet } from 'react-router';
import {
    SidebarProvider,
    Sidebar,
    SidebarContent,
} from '@/components/ui/sidebar';
import Header from '@/app/components/header';
import { AppSidebar } from '@/app/components/app-sidebar';
import { ChatPanel } from '@/app/components/chat-panel';
import { UnsavedChangesGlobalModal } from '@/app/components/modals/unsaved-changes-modal';

export default function MainLayout() {
    const [chatOpen, setChatOpen] = useState(false);

    return (
        <SidebarProvider>
            <div className="relative flex h-screen w-full flex-row overflow-hidden">
                {/* Sidebar */}
                <Sidebar collapsible="icon">
                    <SidebarContent>
                        <AppSidebar />
                    </SidebarContent>
                </Sidebar>

                {/* Main content area with header and routes */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <header className="flex h-14 shrink-0 bg-background items-center gap-2 transition-[width,height] ease-linear border-b border-border z-10">
                        <div className="flex items-center gap-2 px-4 flex-1 min-w-0 overflow-hidden">
                            <Header
                                onToggleChat={() => setChatOpen(!chatOpen)}
                            />
                        </div>
                    </header>

                    <main className="flex-1 min-h-0 min-w-0 overflow-x-hidden overflow-y-auto scrollbar-hide">
                        <div className="max-w-7xl mx-auto w-full md:px-6 py-6">
                            <Outlet />
                        </div>
                    </main>
                </div>

                {/* Chat panel */}
                {chatOpen && (
                    <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
                )}
            </div>

            {/* Global modals */}
            <UnsavedChangesGlobalModal />
        </SidebarProvider>
    );
}
