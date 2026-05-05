import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { VerticalMenu, VerticalMenuItem, VerticalMenuSeparator } from "@/components/ui/vertical-menu";
import { ClockIcon, CalendarIcon, CalendarClock } from "lucide-react";
import { useEmployee } from "@/app/dashboard/contexts/DashboardEmployeeContext";
import DashboardEmployeePageTimeAbsences from "./pages/DashboardEmployeePageTimeAbsences";
import DashboardEmployeePageTimeActivity from "./pages/DashboardEmployeePageTimeActivity";
import EmployeeDetailPageTimeSchedule from "@/app/employees/EmployeeDetailPage/pages/EmployeeDetailPageTime/pages/EmployeeDetailPageTimeSchedule/EmployeeDetailPageTimeSchedule";
import EmployeeTimeTipsCard from "@/app/employees/EmployeeDetailPage/pages/EmployeeDetailPageTime/components/employee-time-tips-card";

const scheduleTabValues = ["activity", "absences", "schedule"] as const;
type ScheduleSubTab = (typeof scheduleTabValues)[number];


const DashboardEmployePageTime = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { timePolicy } = useEmployee();

  const currentTab = searchParams.get("tab") || "time";

  useEffect(() => {
    if (currentTab === "schedule") {
      setSearchParams({ tab: "schedule" }, { replace: true });
    }
  }, [currentTab, setSearchParams]);

  const scheduleSubTab: ScheduleSubTab = scheduleTabValues.includes(currentTab as ScheduleSubTab)
    ? (currentTab as ScheduleSubTab)
    : currentTab === "schedule"
      ? "schedule"
      : "activity";

  const handleScheduleSubTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">
      <aside className="w-full shrink-0 lg:w-auto lg:max-w-[min(100%,14rem)]">
        <VerticalMenu value={scheduleSubTab} onValueChange={handleScheduleSubTabChange}>
          <VerticalMenuItem value="activity">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4" />
              {t("employeesDetail.activity", "Activity")}
            </div>
          </VerticalMenuItem>
          <VerticalMenuItem value="absences">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              {t("employeesDetail.absences", "Absences")}
            </div>
          </VerticalMenuItem>
          <VerticalMenuItem value="schedule">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4" />
              {t("employeesDetail.schedule", "Schedule")}
            </div>
          </VerticalMenuItem>
          <VerticalMenuSeparator className="my-2" />
          <div className="min-w-0 pt-1" role="presentation">
            <EmployeeTimeTipsCard variant={scheduleSubTab}/>
          </div>
        </VerticalMenu>
      </aside>
      <div className="flex-1 min-w-0">
        {scheduleSubTab === "activity" ? (
          <DashboardEmployeePageTimeActivity />
        ) : scheduleSubTab === "absences" ? (
          <DashboardEmployeePageTimeAbsences />
        ) : (
          <EmployeeDetailPageTimeSchedule employeeId="me" timePolicy={timePolicy || null} />
        )}
      </div>
    </div>
  );
};

export default DashboardEmployePageTime;
