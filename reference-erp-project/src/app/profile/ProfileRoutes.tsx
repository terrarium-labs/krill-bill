import { Navigate, Route, Routes, useParams } from "react-router-dom";
import ProfilePage from "./ProfilePage";
import ApiKeysPage from "./pages/ApiKeysPage/ApiKeysPage";
import IntegrationsPage from "./pages/IntegrationsPage/IntegrationsPage";

const ProfileRoutes = () => {
    const { orgId } = useParams<{ orgId: string }>();

    return (
        <Routes>
            <Route index element={<ProfilePage />} />
            <Route path="api-keys" element={<ApiKeysPage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
            <Route path="*" element={<Navigate to={`/${orgId}/profile`} replace />} />
        </Routes>
    );
};

export default ProfileRoutes;
