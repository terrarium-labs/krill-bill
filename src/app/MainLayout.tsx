import { useState, useContext } from 'react';
import { Outlet } from 'react-router';
import { useNavigate } from 'react-router';
import { UserCircle } from 'lucide-react';
import {
    SidebarProvider,
    Sidebar,
    SidebarContent,
    SidebarFooter,
} from '@/components/ui/sidebar';
import { useSidebar } from '@/components/ui/sidebar';
import Header from '@/app/components/header';
import { AppSidebar } from '@/app/components/app-sidebar';
import { ChatPanel } from '@/app/components/chat-panel';
import { UnsavedChangesGlobalModal } from '@/app/components/modals/unsaved-changes-modal';
import { Button } from '@/components/ui/button';
import { OrgContext } from '@/contexts/OrgContext';

const OrgSelectorFooter = () => {
    const navigate = useNavigate();
    const { open } = useSidebar();
    // Safely get org from context without throwing error if not in OrgProvider
    const orgContext = useContext(OrgContext);

    if (!orgContext) return null;

    const { org } = orgContext;
    const orgName = org?.business_name || org?.name;

    if (!orgName) return null;

    return (
        <SidebarFooter>
            <Button
                variant="theme-secondary"
                onClick={() => {
                    localStorage.removeItem('selectedOrgId');
                    localStorage.removeItem('selectedOrgName');
                    navigate('/orgs');
                }}
                title={orgName}
                className={`w-full flex items-center rounded-md text-sm font-medium ${
                    open ? 'gap-3 px-3 py-2 h-9' : 'justify-center p-2 h-9'
                }`}
            >
                <UserCircle size={20} className="flex-shrink-0" />
                <span className={`${open ? 'flex-1 text-left truncate' : 'hidden'}`}>{orgName}</span>
            </Button>
        </SidebarFooter>
    );
};

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
                    <OrgSelectorFooter />
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
