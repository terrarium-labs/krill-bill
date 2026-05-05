import { useEmployee } from "../../../contexts/EmployeeContext";
import { EmployeeInfoCard } from "./components/employee-info-card";
import { useTranslation } from "react-i18next";
import EmployeePaymentMethodsCard from "./components/employee-payment-methods-card";
import EmployeeEmergencyContactsCard from "./components/employee-emergency-contacts-card";

interface EmployeeDetailPageSummaryProps {
    onEdit?: () => void;
}

const EmployeeDetailPageSummary: React.FC<EmployeeDetailPageSummaryProps> = ({ onEdit }) => {
    const { employee } = useEmployee();
    const { t } = useTranslation();
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="flex flex-col gap-4 mb-24 lg:col-span-1">
                <EmployeeInfoCard onEdit={onEdit} />
                {employee?.id && (
                    <>
                       <EmployeeEmergencyContactsCard />
                       <EmployeePaymentMethodsCard />
                    </>
                )}
            </div>
            <div className="lg:col-span-2">
                {/* TODO: Implement summary */}
                <div className="flex items-center justify-center h-64 border border-dashed border-border rounded-lg">
                    <div className="text-center">
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">
                            {t('employeesDetail.summaryTodo', 'Summary Tab')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {t('employeesDetail.summaryTodoDescription', 'This tab is under construction')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDetailPageSummary;

