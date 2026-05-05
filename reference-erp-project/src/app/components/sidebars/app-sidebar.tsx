import * as React from "react";
import {
  BadgeDollarSign,
  BookOpen,
  ClipboardList,
  Briefcase,
  PackagePlus,
  Home,
  Radio,
  Settings,
  ShoppingCart,
  UsersRound,
  BarChart3,
} from "lucide-react";

import { NavMain } from "@/app/components/nav-main";
import { NavUser } from "@/app/components/nav-user";
import { TeamSwitcher } from "@/app/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { useDocsModal } from "@/app/components/modals/docs-modal";
import CustomScroller from "react-custom-scroller";
import "@/styles/custom_scrollbar.css";
import { useTranslation } from "react-i18next";
import { useChatContext } from "@/app/chat/context/ChatContext";
import { useNavigate, useParams } from "react-router";
import { useOrgMe } from "@/app/contexts/OrgMeContext";

const AppSidebar = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
  const { t } = useTranslation();
  const { openDocs } = useDocsModal();
  const { me } = useOrgMe();
  const { autoSendMessage } = useChatContext();
  const navigate = useNavigate();
  const { orgId } = useParams<{ orgId: string }>();
  const { state } = useSidebar();

  const isClient = !!me?.client;
  const isEmployee = !!me?.employee;

  // Navigation data with translations
  const data = {
    topMenu: [
      {
        title: t("sidebar.my_zone", "My Zone"),
        url: "/",
        icon: Home,
      },
    ],
    navAdmin: [
      {
        title: t("sidebar.settings", "Settings"),
        icon: Settings,
        url: "/admin",
      },
    ],
    navMain: isClient
      ? [
        {
          title: t("sidebar.purchases", "Purchases"),
          url: "/purchases",
          icon: ShoppingCart,
          items: [
            {
              title: t("sidebar.invoices", "Invoices"),
              url: "/purchases/invoices",
            },
          ],
        },
        {
          title: t("sidebar.inventory", "Inventory"),
          url: "/inventory",
          icon: ClipboardList,
          items: [
            {
              title: t("sidebar.items", "Items"),
              url: "/items",
            },
            {
              title: t("sidebar.rates", "Rates"),
              url: "/rates",
            },
            {
              title: t("sidebar.locations", "Locations"),
              url: "/locations",
            },
          ],
        },
        {
          title: t("sidebar.fieldService", "Field Service"),
          url: "/field-service",
          icon: ClipboardList,
          items: [
            {
              title: t("sidebar.tickets", "Tickets"),
              url: "/tickets-admin",
            },
            {
              title: t("sidebar.orders", "Orders"),
              url: "/work-orders",
            },
          ],
        },
      ]
      : [
        {
          title: t("sidebar.clients", "Clients"),
          url: "/clients",
          icon: Briefcase,
        },
        {
          title: t("sidebar.suppliers", "Suppliers"),
          url: "/suppliers",
          icon: PackagePlus,
        },
        {
          title: t("sidebar.sales", "Sales"),
          url: "/sales",
          icon: BadgeDollarSign,
          items: [
            {
              title: t("sidebar.salesInvoices", "Invoices"),
              url: "/sales/invoices",
            },
          ],
        },
        {
          title: t("sidebar.purchases", "Purchases"),
          url: "/purchases",
          icon: ShoppingCart,
          items: [
            {
              title: t("sidebar.invoices", "Invoices"),
              url: "/purchases/invoices",
            },
            {
              title: t("sidebar.scanner", "Scanner"),
              onClick: () => {
                navigate(`/${orgId}/purchases/invoices`);
                autoSendMessage("Scan an invoice");
              },
              url: "#",
            },
            {
              title: t("sidebar.orders", "Orders"),
              url: "/purchases/orders",
            },
          ],
        },
        {
          title: t("sidebar.inventory", "Inventory"),
          url: "/inventory",
          icon: ClipboardList,
          items: [
            {
              title: t("sidebar.items", "Items"),
              url: "/items",
            },
            {
              title: t("sidebar.rates", "Rates"),
              url: "/rates",
            },
            {
              title: t("sidebar.warehouses", "Warehouses"),
              url: "/locations",
            },
            {
              title: t("sidebar.vehicles", "Vehicles"),
              url: "/vehicles",
            },
          ],
        },
        {
          title: t("sidebar.hr", "HR"),
          icon: UsersRound,
          url: "/hr",
          items: [
            {
              title: t("sidebar.employees", "Employees"),
              url: "/employees",
            },
            {
              title: t("sidebar.payrolls", "Payrolls"),
              url: "/payrolls",
            },
            {
              title: t("sidebar.absences", "Absences"),
              url: "/absences",
            },
            {
              title: t("sidebar.sickLeaves", "Sick Leaves"),
              url: "/sick-leaves",
            },
            {
              title: t("sidebar.timeRecords", "Time Records"),
              url: "/time-records",
            },
            {
              title: t("sidebar.newsEditor", "News Editor"),
              url: "/news-admin",
            },
            {
              title: t("sidebar.signingRequests", "Signing Requests"),
              url: "/signing-requests",
            },
            {
              title: t("sidebar.trainings", "Trainings"),
              url: "/trainings",
            },
          ],
        },
        {
          title: t("sidebar.fieldService", "Field Service"),
          url: "/field-service",
          icon: Radio,
          items: [
            {
              title: t("sidebar.missionControl", "Mission Control"),
              url: "/mission-control",
            },
            {
              title: t("sidebar.tickets", "Tickets"),
              url: "/tickets",
            },
            {
              title: t("sidebar.orders", "Orders"),
              url: "/work-orders",
            },
            {
              title: t("sidebar.onCall", "On Call"),
              url: "/on-call",
            },
          ],
        },
        {
          title: t("sidebar.analytics", "Analytics"),
          icon: BarChart3,
          url: "/analytics",
          items: [
            {
              title: t("sidebar.reports", "Reports"),
              url: "/analytics/reports",
            },
          ],
        },
      ],
  };

  return (
    <Sidebar className="overflow-x-hidden" collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <CustomScroller className={`h-full ${state === "collapsed" ? "" : "pr-3"}`} innerClassName="overflow-x-hidden">
          <NavMain
            items={data.topMenu}
          />
          <NavMain
            key="main-menu"
            title={t("sidebar.mainMenu", "Main Menu")}
            items={data.navMain}
          />
          {isEmployee && (
            <NavMain
              key="admin-menu"
              title={t("sidebar.administration", "Administration")}
              items={data.navAdmin}
            />
          )}
        </CustomScroller>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={t("sidebar.documentation", "Documentation")}
              onClick={() =>
                openDocs({ slug: "pd_root" })
              }
            >
              <BookOpen />
              <span>{t("sidebar.documentation", "Documentation")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export default AppSidebar;