import { Route, Routes } from "react-router";
import InvoicesPage from "./InvoicesPage";
import InvoiceDetailPage from "./InvoiceDetailPage/InvoiceDetailPage";
import { useParams } from "react-router";
import { Navigate } from "react-router";
import { InvoiceProvider } from "./contexts/InvoiceContext";
import { useInvoice } from "./contexts/InvoiceContext";
import { UnsavedChangesGuard } from "@/app/components/unsaved-changes-guard";

const InvoiceDetailPageWrapper = () => {
    const { hasUnsavedChanges } = useInvoice();
    return (
        <UnsavedChangesGuard hasUnsavedChanges={hasUnsavedChanges}>
            <InvoiceDetailPage />
        </UnsavedChangesGuard>
    );
};

const InvoicesRoutes = () => {
    const { orgId } = useParams<{ orgId: string }>();
    return (
        <Routes>
            <Route path="/" element={<InvoicesPage />} />
            <Route path="/:invoiceId" element={
                <InvoiceProvider>
                    <InvoiceDetailPageWrapper />
                </InvoiceProvider>
            } />
            <Route path="*" element={<Navigate to={`/${orgId}`} replace />} />
        </Routes>
    );
};

export default InvoicesRoutes;
