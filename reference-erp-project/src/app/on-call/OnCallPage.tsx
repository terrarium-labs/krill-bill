import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import PageHeader from "@/app/components/page-header";
import OnCallPageSchedule from "./pages/OnCallPageSchedule/OnCallPageSchedule";
import OnCallPageGroups from "./pages/OnCallPageGroups/OnCallPageGroups";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/shadcn-io/tabs";
import OnCallPageHistory from "./pages/OnCallPageHistory/OnCallPageHistory";

const OnCallPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = searchParams.get("tab") || "schedule";
  const validTabs = ["schedule", "groups", "history"];
  const activeTab = validTabs.includes(currentTab) ? currentTab : "schedule";

  const handleTabChange = (value: string) => {
    if (validTabs.includes(value)) {
      setSearchParams({ tab: value });
    }
  };

  return (
    <>
      <PageHeader
        title={t("on-call.onCall", "On Call")}
        description={t("on-call.onCallDescription", "Manage on call shifts for field service employees throughout the year")}
        showBackButton={false}
      />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full justify-start border-b-2 border-border bg-background mb-4" activeClassName="border-b-2 border-primary -mb-1.5">
          <TabsTrigger className="py-0" value="schedule">
            {t("on-call.schedule", "Schedule")}
          </TabsTrigger>
          <TabsTrigger className="py-0" value="groups">
            {t("on-call.groups", "Groups")}
          </TabsTrigger>
          <TabsTrigger className="py-0" value="history">
            {t("on-call.history", "History")}
          </TabsTrigger>
        </TabsList>

        <TabsContents>
          <TabsContent value="schedule">
            <OnCallPageSchedule />
          </TabsContent>
          <TabsContent value="groups">
            <OnCallPageGroups />
          </TabsContent>
          <TabsContent value="history">
            <OnCallPageHistory />
          </TabsContent>
        </TabsContents>
      </Tabs>
    </>
  );
};

export default OnCallPage;
