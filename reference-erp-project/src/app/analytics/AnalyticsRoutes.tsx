import { Navigate, Route, Routes, useParams } from "react-router";
import ReportsPage from "./pages/ReportsPage/ReportsPage";

function AnalyticsUnknownRedirect() {
    const { orgId } = useParams<{ orgId: string }>();
    return <Navigate to={orgId ? `/${orgId}/analytics/reports` : "/"} replace />;
}

export default function AnalyticsRoutes() {
    return (
        <Routes>
            <Route index element={<Navigate to="reports" replace />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="*" element={<AnalyticsUnknownRedirect />} />
        </Routes>
    );
}
