import { useState } from "react";
import { Employee } from "@/types/employees/employees";
import ManagerTimeRecordsSection from "@/app/employees/EmployeeDetailPage/pages/EmployeeDetailPageManager/components/manager-time-records-section";
import ManagerAbsencesSection from "@/app/employees/EmployeeDetailPage/pages/EmployeeDetailPageManager/components/manager-absences-section";
import ManagerEmployeesCard from "@/app/employees/EmployeeDetailPage/pages/EmployeeDetailPageManager/components/manager-employees-card";
import { Separator } from "@/components/ui/separator";

const DashboardEmployeePageManager = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="flex flex-col gap-4 mb-4 lg:col-span-1">
        <ManagerEmployeesCard
          managerId={"me"}
          selectedEmployee={selectedEmployee}
          setSelectedEmployee={setSelectedEmployee}
        />
      </div>
      <div className="lg:col-span-2">
        <ManagerTimeRecordsSection
          managerId={"me"}
          maxRecords={3}
          employeeId={selectedEmployee?.id}
        />
        <Separator className="my-6" />
        <ManagerAbsencesSection
          managerId={"me"}
          maxRecords={3}
          employeeId={selectedEmployee?.id}
        />
      </div>
    </div>
  );
};

export default DashboardEmployeePageManager;
