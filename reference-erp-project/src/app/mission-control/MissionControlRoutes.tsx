import { Navigate, Route, Routes, useParams } from "react-router";
import MissionControlMainPage from "./pages/MainPage/MissionControlMainPage";
import MissionControlTimelinePage from "./pages/TimelinePage/MissionControlTimelinePage";
import MissionControlOrdersPage from "./pages/OrdersPage/MissionControlOrdersPage";

function MissionControlUnknownRedirect() {
    const { orgId } = useParams<{ orgId: string }>();
    return <Navigate to={orgId ? `/${orgId}/mission-control` : "/"} replace />;
}

/** Nested under `/:orgId/mission-control/*` from `MainRoutes`. */
export default function MissionControlRoutes() {
    return (
        <Routes>
            <Route index element={<MissionControlMainPage />} />
            <Route path="orders" element={<MissionControlOrdersPage />} />
            <Route path="plan" element={<div>TODO: Add plan page </div>} />
            <Route path="timeline" element={<MissionControlTimelinePage />} />
            <Route path="analytics" element={<div>TODO: Add analytics page </div>} />
            <Route path="settings" element={<div>TODO: Add settings page </div>} />
            <Route path="*" element={<MissionControlUnknownRedirect />} />
        </Routes>
    );
}  
