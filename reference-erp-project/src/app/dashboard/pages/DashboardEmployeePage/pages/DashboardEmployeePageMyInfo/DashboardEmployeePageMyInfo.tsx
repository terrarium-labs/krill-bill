import { EmployeeInfoCard } from "./components/employee-info-card";
import EmployeePaymentMethodsCard from "./components/employee-payment-methods-card";
import EmployeeEmergencyContactsCard from "./components/employee-emergency-contacts-card";
import EmployeeContractsCard from "./components/employee-contracts-card";

const DashboardEmployeePageMyInfo = () => {

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="flex flex-col gap-4 mb-24 lg:col-span-1">
                <EmployeeEmergencyContactsCard />
                <EmployeePaymentMethodsCard />
                <EmployeeContractsCard />
            </div>
            <div className="lg:col-span-2">
                <EmployeeInfoCard />
            </div>
        </div>
    );
};

export default DashboardEmployeePageMyInfo;

