import { Navigate, Route, Routes, useParams } from "react-router";
import StatusTemplateDetailPage from "./StatusTemplateDetailPage/StatusTemplateDetailPage";
import { StatusTemplateProvider } from "./contexts/StatusTemplateContext";
import StatusTemplatesPage from "./StatusTemplatesPage";


const StatusTemplatesRoutes = () => {
    const { orgId } = useParams<{ orgId: string }>();
    return (
        <Routes>
            <Route path="/" element={<StatusTemplatesPage />} />
            <Route
                path="/:statusTemplateId"
                element={
                    <StatusTemplateProvider>
                        <StatusTemplateDetailPage />
                    </StatusTemplateProvider>
                }
            />
            <Route path="*" element={<Navigate to={`/${orgId}/status-templates/`} replace />} />
        </Routes>
    );
};

export default StatusTemplatesRoutes;

