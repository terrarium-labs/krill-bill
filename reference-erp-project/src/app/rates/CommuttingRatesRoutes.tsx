import { Navigate, Route, Routes, useParams } from "react-router-dom";
import CommutingRatesPage from "./pages/CommutingRatesPage/CommutingRatesPage";
import { CommutingRateProvider } from "./contexts/CommutingRateContext";
import CommutingRateDetailPage from "./pages/CommutingRatesPage/CommutingRateDetailPage/CommutingRateDetailPage";

const CommutingRatesDetailRoutes = () => {
    const { orgId, commutingRateId } = useParams<{ orgId: string, commutingRateId: string }>();
    return (
        <Routes>
            <Route path="" element={<CommutingRateDetailPage />} />
            <Route path="*" element={<Navigate to={`/${orgId}/commuting-rates/${commutingRateId}`} replace />} />
        </Routes>
    );
};

const CommutingRatesRoutes = () => {
    return (
        <Routes>
            <Route path="" element={<CommutingRatesPage />} />
            <Route
                path=":commutingRateId/*"
                element={
                    <CommutingRateProvider>
                        <CommutingRatesDetailRoutes />
                    </CommutingRateProvider>
                }
            />
        </Routes>
    );
};

export default CommutingRatesRoutes;
