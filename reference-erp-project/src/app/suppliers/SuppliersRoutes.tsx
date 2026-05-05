import { Navigate, Route, Routes, useParams } from "react-router-dom";
import SuppliersPage from "./SuppliersPage";
import { SupplierProvider } from "./contexts/SupplierContext";
import SupplierDetailPage from "./SupplierDetailPage/SupplierDetailPage";

const SuppliersDetailRoutes = () => {
    const { orgId, supplierId } = useParams<{ orgId: string, supplierId: string }>();
    return (
        <Routes>
            <Route path="" element={<SupplierDetailPage />} />
            <Route path="*" element={<Navigate to={`/${orgId}/suppliers/${supplierId}`} replace />} />
        </Routes>
    );
};

const SuppliersRoutes = () => {
    return (
        <Routes>
            <Route path="" element={<SuppliersPage />} />
            <Route
                path=":supplierId/*"
                element={
                    <SupplierProvider>
                        <SuppliersDetailRoutes />
                    </SupplierProvider>
                }
            />
        </Routes>)
};

export default SuppliersRoutes;

