import { Navigate, Route, Routes, useParams } from "react-router";
import PayrollsPage from "./PayrollsPage";

const PayrollsRoutes = () => {
  const { orgId } = useParams<{ orgId: string }>();
  return (
    <Routes>
      <Route path="" element={<PayrollsPage />} />
      <Route
        path="*"
        element={<Navigate to={`/${orgId}/payrolls`} replace />}
      />
    </Routes>
  );
};

export default PayrollsRoutes;
