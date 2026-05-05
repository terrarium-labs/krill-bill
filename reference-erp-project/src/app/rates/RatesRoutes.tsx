import { Navigate, Route, Routes, useParams } from "react-router-dom";
import RatesPage from "./RatesPage";
import { RateProvider } from "./contexts/RateContext";
import RateDetailPage from "./pages/ItemRatesPage/ItemRateDetailPage/ItemRateDetailPage";

const RatesDetailRoutes = () => {
    const { orgId, rateId } = useParams<{ orgId: string, rateId: string }>();
    return (
        <Routes>
            <Route path="" element={<RateDetailPage />} />
            <Route path="*" element={<Navigate to={`/${orgId}/rates/${rateId}`} replace />} />
        </Routes>
    );
};

const RatesRoutes = () => {
    return (
        <Routes>
            <Route path="" element={<RatesPage />} />
            <Route
                path=":rateId/*"
                element={
                    <RateProvider>
                        <RatesDetailRoutes />
                    </RateProvider>
                }
            />
        </Routes>
    );
};

export default RatesRoutes;

