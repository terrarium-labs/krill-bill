import { Navigate, Route, Routes } from "react-router-dom";
import AbsencesPage from "./AbsencesPage";

const AbsencesRoutes = () => {
    return (
        <Routes>
            <Route path="" element={<AbsencesPage />} />
            <Route path="*" element={<Navigate to="/absences" replace />} />
        </Routes>
    );
};

export default AbsencesRoutes;

