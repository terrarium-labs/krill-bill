import { Navigate, Route, Routes, useParams } from "react-router-dom";
import EmployeesPage from "./EmployeesPage";
import { EmployeeProvider } from "./contexts/EmployeeContext";
import EmployeeDetailPage from "./EmployeeDetailPage/EmployeeDetailPage";

const EmployeesDetailRoutes = () => {
    const { orgId, employeeId } = useParams<{ orgId: string, employeeId: string }>();
    return (
        <Routes>
            <Route path="" element={<EmployeeDetailPage />} />
            <Route path="*" element={<Navigate to={`/${orgId}/employees/${employeeId}`} replace />} />
        </Routes>
    );
};

const EmployeesRoutes = () => {
    return (
        <Routes>
            <Route index element={<EmployeesPage />} />
            <Route
                path=":employeeId/*"
                element={
                    <EmployeeProvider>
                        <EmployeesDetailRoutes />
                    </EmployeeProvider>
                }
            />
        </Routes>
    );
};

export default EmployeesRoutes;

