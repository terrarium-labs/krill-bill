import { Route, Routes } from "react-router-dom";
import SickLeavesPage from "./SickLeavesPage";
import { Navigate } from "react-router-dom";

const SickLeavesRoutes = () => {
    return (
        <Routes>
            <Route path="" element={<SickLeavesPage />} />
            <Route path="*" element={<Navigate to="/sick-leaves" replace />} />
        </Routes>
    );
};

export default SickLeavesRoutes;

