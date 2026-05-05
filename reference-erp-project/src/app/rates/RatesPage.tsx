import PageHeader from "@/app/components/page-header";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/shadcn-io/tabs";
import ItemRatesPage from "./pages/ItemRatesPage/ItemRatesPage";
import HourlyRatesPage from "./pages/HourlyRatesPage/HourlyRatesPage";
import CommutingRatesPage from "./pages/CommutingRatesPage/CommutingRatesPage";

const VALID_TABS = ["items", "hourly", "commuting"] as const;

const RatesPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = VALID_TABS.includes(searchParams.get("tab") as any)
    ? searchParams.get("tab")!
    : "items";

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t("rates.title", "Rates")}
        description={t("rates.description", "Manage your organization's price rates")}
        showBackButton={false}
      />

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setSearchParams({ tab: v })}>
        <TabsList className="w-full justify-start border-b-2 border-border bg-background" activeClassName='border-b-2 border-primary -mb-1.5'>
          <TabsTrigger className="py-0" value="items">{t("rates.tabs.items", "Items Rates")}</TabsTrigger>
          <TabsTrigger className="py-0" value="hourly">{t("rates.tabs.hourly", "Hourly Rates")}</TabsTrigger>
          <TabsTrigger className="py-0" value="commuting">{t("rates.tabs.commuting", "Commuting Rates")}</TabsTrigger>
        </TabsList>
        <TabsContents transition={{ duration: 0 }}>
          <TabsContent value="items" transition={{ duration: 0 }}>
            <ItemRatesPage />
          </TabsContent>
          <TabsContent value="hourly" transition={{ duration: 0 }}>
            <HourlyRatesPage />
          </TabsContent>
          <TabsContent value="commuting" transition={{ duration: 0 }}>
            <CommutingRatesPage />
          </TabsContent>
        </TabsContents>
      </Tabs>
    </div>
  );
};

export default RatesPage;
