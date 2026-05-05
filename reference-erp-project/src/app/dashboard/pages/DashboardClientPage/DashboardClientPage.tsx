import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import PageHeader from "@/app/components/page-header";
import { useClient } from "@/app/dashboard/contexts/DashboardClientContext";
import IdBadge from "@/app/components/id-badge";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/shadcn-io/tabs";
import DashboardClientPageMyInfo from "./pages/DashboardClientPageMyInfo/DashboardClientPageMyInfo";
import DashboardClientPageLocations from "./pages/DashboardClientPageLocations/DashboardClientPageLocations";
import DashboardClientPageRates from "./pages/DashboardClientPageRates/DashboardClientPageRates";
import DashboardClientPageFiles from "./pages/DashboardClientPageFiles/DashboardClientPageFiles";
import { ClientAvatar } from "@/app/components/avatars/client-avatar";
import DashboardClientPageHome from "./pages/DashboardClientPageHome/DashboardClientPageHome";
import { Badge } from "@/components/ui/badge";

const validTabs = ["home", "my-info", "rates", "locations", "files"];
const ratesTabValues = ["rates", "items-rates", "hourly-rates", "commuting-rates"] as const;
// Sub-tab params that keep the main "Files" tab selected
const filesTabValues = ['files', 'pending-signatures'] as const;

const DashboardClientPage = () => {
  const { t } = useTranslation();
  const { client, refreshClient, pendingSignatures } = useClient();
  const pendingSignatureCount = pendingSignatures.length;
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = searchParams.get("tab") || "home";
  const activeTab = ratesTabValues.includes(currentTab as (typeof ratesTabValues)[number])
    ? "rates"
    : filesTabValues.includes(currentTab as (typeof filesTabValues)[number])
      ? 'files' :
      validTabs.includes(currentTab)
        ? currentTab
        : "home";

  const handleTabChange = (value: string) => {
    if (validTabs.includes(value) || filesTabValues.includes(value as (typeof filesTabValues)[number])) {
      setSearchParams({ tab: value });
    }
  };

  const clientDisplayName = `${client.trade_name}${client.client_name ? ` (${client.client_name})` : ""}`.trim();

  return (
    <>
      <PageHeader
        beforeTextChildren={
          <ClientAvatar
            client={client}
            size="2xl"
            showName={false}
            imageEditable={true}
            onImageChange={refreshClient}
          />
        }
        title={t("dashboard.welcome", "Welcome back, {{name}}!", { name: clientDisplayName })}
        description={client.tax_code}
        showBackButton={false}
        action={
          <div className="flex items-center gap-2">
            <IdBadge id={client.id || ""} className="h-6 px-4 text-xs" />
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList
          className="w-full justify-start border-b-2 border-border bg-background mb-4"
          activeClassName="border-b-2 border-primary -mb-1.5"
        >
          <TabsTrigger className="py-0" value="home">
            {t("clientsDetail.home", "Home")}
          </TabsTrigger>
          <TabsTrigger className="py-0" value="my-info">
            {t("clientsDetail.myInfo", "My Info")}
          </TabsTrigger>
          <TabsTrigger className="py-0" value="rates">
            {t("clientsDetail.rates", "Rates")}
          </TabsTrigger>
          <TabsTrigger className="py-0" value="locations">
            {t("clientsDetail.locations", "Locations")}
          </TabsTrigger>
          <TabsTrigger className="relative py-0 pr-1" value="files">
            <span className="relative inline-flex items-center">
              {t("clientsDetail.files", "Files")}
              {pendingSignatureCount > 0 && (
                <Badge
                  variant="destructive"
                  className="pointer-events-none absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 py-0 text-[10px] leading-none tabular-nums"
                  aria-hidden
                >
                  {pendingSignatureCount > 99 ? "99+" : pendingSignatureCount}
                </Badge>
              )}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContents transition={{ duration: 0 }}>
          <TabsContent value="home" transition={{ duration: 0 }}>
            <DashboardClientPageHome />
          </TabsContent>
          <TabsContent value="my-info" transition={{ duration: 0 }}>
            <DashboardClientPageMyInfo />
          </TabsContent>
          <TabsContent value="rates" transition={{ duration: 0 }}>
            <DashboardClientPageRates />
          </TabsContent>
          <TabsContent value="locations" transition={{ duration: 0 }}>
            <DashboardClientPageLocations />
          </TabsContent>
          <TabsContent value="files" transition={{ duration: 0 }}>
            <DashboardClientPageFiles />
          </TabsContent>
        </TabsContents>
      </Tabs>
    </>
  );
};

export default DashboardClientPage;
