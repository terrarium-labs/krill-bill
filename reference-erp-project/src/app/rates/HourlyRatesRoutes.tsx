import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { HourlyRateProvider } from "./contexts/HourlyRateContext";
import HourlyRateDetailPage from "./pages/HourlyRatesPage/HourlyRateDetailPage/HourlyRateDetailPage";

const HourlyRatesDetailRoutes = () => {
    const { orgId, hourlyRateId } = useParams<{ orgId: string, hourlyRateId: string }>();
    return (
        <Routes>
            <Route path="" element={<HourlyRateDetailPage />} />
            <Route path="*" element={<Navigate to={`/${orgId}/hourly-rates/${hourlyRateId}`} replace />} />
        </Routes>
    );
};

const HourlyRatesRoutes = () => {
    const { orgId } = useParams<{ orgId: string }>();
    return (
        <Routes>
            <Route
                path=":hourlyRateId/*"
                element={
                    <HourlyRateProvider>
                        <HourlyRatesDetailRoutes />
                    </HourlyRateProvider>
                }
            />
            <Route path="" element={<Navigate to={`/${orgId}/rates`} replace />} />
        </Routes>
    );
};

export default HourlyRatesRoutes;

