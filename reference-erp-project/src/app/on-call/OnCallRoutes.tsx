import { Navigate, Route, Routes, useParams } from "react-router-dom";
import OnCallPage from "./OnCallPage";
import { OnCallGroupProvider } from "./contexts/OnCallGroupContext";
import OnCallPageGroupDetailPage from "./pages/OnCallPageGroups/OnCallPageGroupDetailPage/OnCallPageGroupDetailPage";

const OnCallGroupDetailRoutes = () => {
  const { orgId, groupId } = useParams<{ orgId: string; groupId: string }>();
  return (
    <Routes>
      <Route path="" element={<OnCallPageGroupDetailPage />} />
      <Route path="*" element={<Navigate to={`/${orgId}/on-call/groups/${groupId}`} replace />} />
    </Routes>
  );
};

const OnCallRoutes = () => {
  const { orgId } = useParams<{ orgId: string }>();
  return (
    <Routes>
      <Route index element={<OnCallPage />} />
      <Route
        path="groups/:groupId/*"
        element={
          <OnCallGroupProvider>
            <OnCallGroupDetailRoutes />
          </OnCallGroupProvider>
        }
      />
      <Route path="*" element={<Navigate to={`/${orgId}/on-call`} replace />} />
    </Routes>
  );
};

export default OnCallRoutes;

