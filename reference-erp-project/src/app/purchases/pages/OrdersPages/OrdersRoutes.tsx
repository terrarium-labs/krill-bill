import { Route, Routes } from "react-router";
import OrdersPage from "./OrdersPage";
import OrderDetailPage from "./OrderDetailPage/OrderDetailPage";
import { useParams } from "react-router";
import { Navigate } from "react-router";
import { OrderProvider } from "./contexts/OrderContext";

const OrdersRoutes = () => {
    const { orgId } = useParams<{ orgId: string }>();
    return (
        <Routes>
            <Route path="/" element={<OrdersPage />} />
            <Route path="/:orderId" element={<OrderProvider><OrderDetailPage /></OrderProvider>} />
            <Route path="*" element={<Navigate to={`/${orgId}`} replace />} />
        </Routes>
    );
};

export default OrdersRoutes;

