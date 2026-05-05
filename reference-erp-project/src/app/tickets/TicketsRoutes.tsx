import { Navigate, Route, Routes, useParams } from "react-router";
import TicketsPage from "./TicketsPage";

const TicketsRoutes = () => {
  const { orgId } = useParams<{ orgId: string }>();
  return (
    <Routes>
      <Route path="" element={<TicketsPage />} />
      <Route
        path="*"
        element={<Navigate to={`/${orgId}/tickets`} replace />}
      />
    </Routes>
  );
};

export default TicketsRoutes;
