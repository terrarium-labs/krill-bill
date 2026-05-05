import { Navigate, Route, Routes, useParams } from "react-router-dom";
import TrainingsPage from "./TrainingsPage";
import { TrainingProvider } from "./contexts/TrainingContext";
import TrainingsDetailPage from "./TrainingsDetailPage/TrainingsDetailPage";

const TrainingsDetailRoutes = () => {
    const { orgId, trainingId } = useParams<{
        orgId: string;
        trainingId: string;
    }>();
    return (
        <Routes>
            <Route path="" element={<TrainingsDetailPage />} />
            <Route
                path="*"
                element={
                    <Navigate
                        to={`/${orgId}/trainings/${trainingId}`}
                        replace
                    />
                }
            />
        </Routes>
    );
};

const TrainingsRoutes = () => {
    return (
        <Routes>
            <Route index element={<TrainingsPage />} />
            <Route
                path=":trainingId/*"
                element={
                    <TrainingProvider>
                        <TrainingsDetailRoutes />
                    </TrainingProvider>
                }
            />
            <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
    );
};

export default TrainingsRoutes;
