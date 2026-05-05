import ManagerEmployeesCard from "./components/manager-employees-card";
import { useState } from "react";
import { Employee } from "@/types/employees/employees";
import ManagerTimeRecordsSection from "./components/manager-time-records-section";
import ManagerAbsencesSection from "@/app/employees/EmployeeDetailPage/pages/EmployeeDetailPageManager/components/manager-absences-section";
import { Separator } from "@/components/ui/separator";
import { useEmployee } from "@/app/employees/contexts/EmployeeContext";

const EmployeeDetailPageManager = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const { employee: manager } = useEmployee();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="flex flex-col gap-4 mb-4 lg:col-span-1">
        <ManagerEmployeesCard
          managerId={manager.id}
          selectedEmployee={selectedEmployee}
          setSelectedEmployee={setSelectedEmployee}
        />
      </div>
      <div className="lg:col-span-2">
        <ManagerTimeRecordsSection
          managerId={manager?.id}
          maxRecords={3}
          employeeId={selectedEmployee?.id}
        />
        <Separator className="my-6" />
        <ManagerAbsencesSection
          managerId={manager?.id}
          maxRecords={3}
          employeeId={selectedEmployee?.id}
        />
      </div>
    </div>
  );
};

export default EmployeeDetailPageManager;
