import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { ManagerProvider } from "./contexts/ManagerContext";
import ManagersPageAbsences from "./pages/ManagersPageAbsences/ManagersPageAbsences"
import ManagersPageTimeRecords from "./pages/ManagersPageTimeRecords/ManagersPageTimeRecords";

const ManagersDetailRoutes = () => {
    const { orgId } = useParams<{ orgId: string }>();
    return (
        <Routes>
            <Route path="absences" element={<ManagersPageAbsences />} />
            <Route path="time-records" element={<ManagersPageTimeRecords />} />
            <Route path="*" element={<Navigate to={`/${orgId}/`} replace />} />
        </Routes>
    );
};

const ManagersRoutes = () => {
    const { orgId } = useParams<{ orgId: string }>();
    return (
        <Routes>
            <Route
                path=":managerId/*"
                element={
                    <ManagerProvider>
                        <ManagersDetailRoutes />
                    </ManagerProvider>
                }
            />

            <Route path="*" element={<Navigate to={`/${orgId}/`} replace />} />
        </Routes>
    );
};

export default ManagersRoutes;

