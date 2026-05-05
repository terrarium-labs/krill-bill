import { Route, Routes } from "react-router";
import SalesInvoicesPage from "./SalesInvoicesPage";
import SaleInvoiceDetailPage from "./InvoiceDetailPage/SaleInvoiceDetailPage";
import { useParams } from "react-router";
import { Navigate } from "react-router";
import { SaleInvoiceProvider } from "./contexts/SaleInvoiceContext";
import { useSaleInvoice } from "./contexts/SaleInvoiceContext";
import { UnsavedChangesGuard } from "@/app/components/unsaved-changes-guard";

const SaleInvoiceDetailPageWrapper = () => {
    const { hasUnsavedChanges } = useSaleInvoice();
    return (
        <UnsavedChangesGuard hasUnsavedChanges={hasUnsavedChanges}>
            <SaleInvoiceDetailPage />
        </UnsavedChangesGuard>
    );
};

const SalesInvoicesRoutes = () => {
    const { orgId } = useParams<{ orgId: string }>();
    return (
        <Routes>
            <Route path="/" element={<SalesInvoicesPage />} />
            <Route path="/:invoiceId" element={
                <SaleInvoiceProvider>
                    <SaleInvoiceDetailPageWrapper />
                </SaleInvoiceProvider>
            } />
            <Route path="*" element={<Navigate to={`/${orgId}`} replace />} />
        </Routes>
    );
};

export default SalesInvoicesRoutes;
