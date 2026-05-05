import { Route, Routes } from "react-router";
import { useParams } from "react-router";
import { Navigate } from "react-router";
import InvoicesRoutes from "./pages/InvoicesPages/InvoicesRoutes";
import OrdersRoutes from "./pages/OrdersPages/OrdersRoutes";

const PurchasesRoutes = () => {
    const { orgId } = useParams<{ orgId: string }>();
    return (
        <Routes>
            <Route path="/invoices/*" element={<InvoicesRoutes />} />
            <Route path="/orders/*" element={<OrdersRoutes />} />
            <Route path="*" element={<Navigate to={`/${orgId}`} replace />} />
        </Routes>
    );
};

export default PurchasesRoutes; 