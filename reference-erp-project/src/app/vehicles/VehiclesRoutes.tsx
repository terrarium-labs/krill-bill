import { Navigate, Route, Routes, useParams } from "react-router-dom";
import VehiclesPage from "./VehiclesPage";
import VehicleDetailPage from "./VehicleDetailPage/VehicleDetailPage";
import { VehicleProvider } from "./contexts/VehicleContext";

const VehiclesDetailRoutes = () => {
    const { orgId, vehicleId } = useParams<{ orgId: string, vehicleId: string }>();
    return (
        <Routes>
            <Route path="" element={<VehicleDetailPage />} />
            <Route path="*" element={<Navigate to={`/${orgId}/vehicles/${vehicleId}`} replace />} />
        </Routes>
    );
};

const VehiclesRoutes = () => {
    return (
        <Routes>
            <Route index element={<VehiclesPage />} />
            <Route
                path=":vehicleId/*"
                element={
                    <VehicleProvider>
                        <VehiclesDetailRoutes />
                    </VehicleProvider>
                }
            />
        </Routes>
    );
};

export default VehiclesRoutes;

