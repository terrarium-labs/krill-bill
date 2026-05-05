import { useTranslation } from "react-i18next";
import NewsFeedList from "@/app/dashboard/pages/DashboardEmployeePage/pages/DashboardEmployeePageHome/components/news-feed-list";
import QuickActionsClient from "./components/quick-actions-client";

const DashboardClientPageHome = () => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Sidebar - left side (1 column on large screens) */}
      <div className="flex flex-col gap-8 lg:col-span-1">
        <NewsFeedList />
      </div>

      {/* Main Content Area - Right Side (2 columns on large screens) */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <QuickActionsClient />
        <div className="flex items-center justify-center h-64 border border-dashed border-border rounded-lg">
          <div className="text-center">
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              {t("clientsDetail.homeTodo", "Home Tab")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("clientsDetail.homeTodoDescription", "This tab is under construction")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardClientPageHome;
