import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { VerticalMenu, VerticalMenuItem, VerticalMenuSeparator } from "@/components/ui/vertical-menu";
import { ClockIcon, CalendarIcon, CalendarClock } from "lucide-react";
import { useEmployee } from "@/app/employees/contexts/EmployeeContext";
import EmployeeDetailPageTimeSchedule from "./pages/EmployeeDetailPageTimeSchedule/EmployeeDetailPageTimeSchedule";
import EmployeeDetailPageTimeActivity from "./pages/EmployeeDetailPageTimeActivity/EmployeeDetailPageTimeActivity";
import EmployeeDetailPageTimeAbsences from "./pages/EmployeeDetailPageTimeAbsences/EmployeeDetailPageTimeAbsences";
import EmployeeTimeTipsCard from "./components/employee-time-tips-card";

const timeTabValues = ["activity", "absences", "schedule"] as const;
type TimeSubTab = (typeof timeTabValues)[number];

const EmployeeDetailPageTime = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { employee, timePolicy } = useEmployee();

  const currentTab = searchParams.get("tab") || "time";

  useEffect(() => {
    if (currentTab === "schedule") {
      setSearchParams({ tab: "schedule" }, { replace: true });
    }
  }, [currentTab, setSearchParams]);

  const timeSubTab: TimeSubTab = timeTabValues.includes(currentTab as TimeSubTab)
    ? (currentTab as TimeSubTab)
    : currentTab === "schedule"
      ? "schedule"
      : "activity";

  const handleTimeSubTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">
      <aside className="w-full shrink-0 lg:w-auto lg:max-w-[min(100%,14rem)]">
        <VerticalMenu value={timeSubTab} onValueChange={handleTimeSubTabChange}>
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
            <EmployeeTimeTipsCard variant={timeSubTab} />
          </div>
        </VerticalMenu>
      </aside>
      <div className="flex-1 min-w-0">
        {timeSubTab === "schedule" ? (
          <EmployeeDetailPageTimeSchedule
            employeeId={employee?.id || ""}
            timePolicy={timePolicy || null}
          />
        ) : timeSubTab === "activity" ? (
          <EmployeeDetailPageTimeActivity />
        ) : timeSubTab === "absences" ? (
          <EmployeeDetailPageTimeAbsences />
        ) : (
          <EmployeeDetailPageTimeActivity />
        )}
      </div>
    </div>
  );
};

export default EmployeeDetailPageTime;
