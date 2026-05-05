import { Navigate, Route, Routes } from "react-router-dom";
import WorkOrdersPage from "./WorkOrdersPage";
import WorkOrderDetailPage from "./WorkOrderDetailPage/WorkOrderDetailPage";
import { WorkOrderProvider } from "./contexts/WorkOrderContext";
import { StatusesProvider } from "@/app/contexts/StatusesContext";

const WorkOrdersRoutes = () => {
    return (
        <StatusesProvider>
            <Routes>
                <Route path="" element={<WorkOrdersPage />} />
                <Route path=":workOrderId" element={
                    <WorkOrderProvider>
                        <WorkOrderDetailPage />
                    </WorkOrderProvider>
                } />
                <Route path="*" element={<Navigate to="/work-orders" replace />} />
            </Routes>
        </StatusesProvider>
    );
};

export default WorkOrdersRoutes;

