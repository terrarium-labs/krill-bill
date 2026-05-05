import { Route, Routes } from "react-router";
import { useParams } from "react-router";
import { Navigate } from "react-router";
import SalesInvoicesRoutes from "./pages/InvoicesPages/SalesInvoicesRoutes";
import { StatusesProvider } from "../contexts/StatusesContext";

const SalesRoutes = () => {
    const { orgId } = useParams<{ orgId: string }>();
    return (
        <Routes>
            <Route path="/invoices/*" element={
                <StatusesProvider>
                    <SalesInvoicesRoutes />
                </StatusesProvider>
            } />
            <Route path="*" element={<Navigate to={`/${orgId}`} replace />} />
        </Routes>
    );
};

export default SalesRoutes;
