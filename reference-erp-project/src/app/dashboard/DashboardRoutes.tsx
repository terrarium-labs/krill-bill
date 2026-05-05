import { Route, Routes } from "react-router-dom";
import { useOrgMe } from "@/app/contexts/OrgMeContext";
import { DashboardEmployeeProvider } from "./contexts/DashboardEmployeeContext";
import DashboardEmployeePage from "./pages/DashboardEmployeePage/DashboardEmployeePage";
import { DashboardClientProvider } from "./contexts/DashboardClientContext";
import DashboardClientPage from "./pages/DashboardClientPage/DashboardClientPage";

const SupplierDashboardPlaceholder = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
        <h2 className="text-xl font-semibold">Supplier Dashboard</h2>
        <p className="text-muted-foreground text-center">
            Supplier dashboard is coming soon.
        </p>
    </div>
);

const DashboardRoutes = () => {
    const { me } = useOrgMe();

    // Determine user type: priority is employee > client > supplier
    const isEmployee = !!me?.employee;
    const isClient = !!me?.client;
    const isSupplier = !!me?.supplier;

    return (
        <Routes>
            <Route
                index
                element={
                    isEmployee ? (
                        <DashboardEmployeeProvider>
                            <DashboardEmployeePage />
                        </DashboardEmployeeProvider>
                    ) : isClient ? (
                        <DashboardClientProvider>
                            <DashboardClientPage />
                        </DashboardClientProvider>
                    ) : isSupplier ? (
                        <SupplierDashboardPlaceholder />
                    ) : null
                }
            />
        </Routes>
    );
};

export default DashboardRoutes;