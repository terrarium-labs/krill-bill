import { Navigate, Route, Routes, useParams } from "react-router-dom";
import WarehousesPage from "./WarehousesPage";
import WarehouseDetailPage from "./WarehouseDetailPage/WarehouseDetailPage";
import { LocationProvider } from "./contexts/LocationContext";

const LocationsRoutes = () => {
    const { orgId } = useParams<{ orgId: string }>();

    return (
        <Routes>
            <Route path="" element={<WarehousesPage />} />
            <Route
                path=":locationId/*"
                element={
                    <LocationProvider>
                        <WarehouseDetailPage />
                    </LocationProvider>
                }
            />
            <Route path="*" element={<Navigate to={`/${orgId}/locations`} replace />} />
        </Routes>
    );
};

export default LocationsRoutes;

