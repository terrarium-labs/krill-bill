import { Navigate, Route, Routes, useParams } from "react-router";
import SigningRequestDetailPage from "./pages/SigningRequestDetailPage/SigningRequestDetailPage";
import { SigningRequestProvider } from "./contexts/SigningRequestContext";
import SigningRequestsPage from "./SigningRequestsPage";
import SigningRequestCreatePage from "./pages/SigningRequestCreatePage/SigningRequestCreatePage";

const SigningRequestDetailRoutes = () => {
    const { orgId, signingRequestId } = useParams<{ orgId: string; signingRequestId: string }>();
    return (
        <Routes>
            <Route path="" element={<SigningRequestDetailPage />} />
            <Route path="*" element={<Navigate to={`/${orgId}/signing-requests/${signingRequestId}`} replace />} />
        </Routes>
    );
};

const SigningRequestsRoutes = () => {
    return (
        <Routes>
            <Route index element={<SigningRequestsPage />} />
            <Route path="create" element={<SigningRequestCreatePage />} />
            <Route
                path=":signingRequestId/*"
                element={
                    <SigningRequestProvider>
                        <SigningRequestDetailRoutes />
                    </SigningRequestProvider>
                }
            />
        </Routes>
    );
};

export default SigningRequestsRoutes;
