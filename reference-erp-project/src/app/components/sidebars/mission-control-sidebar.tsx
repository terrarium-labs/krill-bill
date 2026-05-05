import {
    BarChart3,
    ClipboardList,
    GanttChart,
    Map,
    Settings,
    LogOut,
    Home,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavMain } from "@/app/components/nav-main";
import { NavUser } from "@/app/components/nav-user";
import { useMissionControlShell } from "@/app/mission-control/context/MissionControlShellContext";
import { Sidebar, SidebarContent, SidebarFooter } from "@/components/ui/sidebar";
import CustomScroller from "react-custom-scroller";
import "@/styles/custom_scrollbar.css";

export default function MissionControlSidebar() {
    const { t } = useTranslation();
    const { exitMissionControlShell } = useMissionControlShell();

    const missionControlNav = [
        {
            title: t("missionControl.shell.nav.summary", "Home"),
            url: "/mission-control",
            icon: Home,
        },   
        {
            title: t("missionControl.shell.nav.timeline", "Timeline"),
            url: "/mission-control/timeline",
            icon: GanttChart,
        },
        {
            title: t("missionControl.shell.nav.orders", "Orders"),
            url: "/mission-control/orders",
            icon: ClipboardList,
        },
        {
            title: t("missionControl.shell.nav.plan", "Plan"),
            url: "/mission-control/plan",
            icon: Map,
        },
     
        {
            title: t("missionControl.shell.nav.analytics", "Analytics"),
            url: "/mission-control/analytics",
            icon: BarChart3,
        },
        {
            title: t("missionControl.shell.nav.settings", "Settings"),
            url: "/mission-control/settings",
            icon: Settings,
        },
    ];

    return (
        <Sidebar collapsible="icon" className="border-r overflow-X-hidden" >
            <SidebarContent>
                <CustomScroller className="h-full" innerClassName="overflow-x-hidden">
                    <NavMain
                        items={[
                            {
                                title: t("missionControl.shell.backToApp", "Back to app"),
                                icon: LogOut,
                                onClick: exitMissionControlShell,
                            },
                        ]}
                    />
                    <NavMain
                        title={t("missionControl.shell.navGroup", "Mission Control")}
                        items={missionControlNav}
                    />

                </CustomScroller>
            </SidebarContent>
            <SidebarFooter>
                <NavUser onNavigate={exitMissionControlShell} />
            </SidebarFooter>
        </Sidebar>
    );
}
