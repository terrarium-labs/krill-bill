import ReactDOM from "react-dom/client";
import "./lib/i18n";
import "./styles/globals.css";
import "./styles/custom_scrollbar.css";
import "mapbox-gl/dist/mapbox-gl.css";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { Suspense } from "react";
import { Loader2Icon } from "lucide-react";
import LogInPage from "./auth/pages/LogInPage";
import RecoverPasswordPage from "./auth/pages/RecoverPasswordPage";
import ResetPasswordPage from "./auth/pages/ResetPasswordPage";
import SignUpPage from "./auth/pages/SignUpPage";
import MainLayout from "./app/MainLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RouteErrorFallback } from "./components/RouteErrorFallback";
import { AuthProvider } from "./auth/AuthContext";
import { AuthGuard } from "./auth/AuthGuard";
import OrgsPage from "./app/orgs/OrgsPage";
import { DocsModalProvider } from "./app/components/modals/docs-modal";
import CallbackPage from "./app/oauth/CallbackPage";
import { UserProvider } from "./contexts/UserContext";
import { useAuth } from "./auth/AuthContext";
import { Navigate } from "react-router";

// Component to handle root path redirect
const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2Icon className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check for last organization in localStorage
  const lastOrgId = localStorage.getItem("last-org-id");
  if (lastOrgId) {
    return <Navigate to={`/${lastOrgId}`} replace />;
  }

  // No last org, redirect to orgs page to select one
  return <Navigate to="/orgs" replace />;
};

const OrgsRoutesLayout = () => {
  return (
    <UserProvider>
      <MainLayout />
    </UserProvider>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthProvider>
        <RootRedirect />
      </AuthProvider>
    ),
    errorElement: <RouteErrorFallback />,
  },
  {
    path: "/login",
    element: (
      <AuthProvider>
        <AuthGuard requireAuth={false}>
          <LogInPage />
        </AuthGuard>
      </AuthProvider>
    ),
    errorElement: <RouteErrorFallback />,
  },
  {
    path: "/recover-password",
    element: (
      <AuthProvider>
        <AuthGuard requireAuth={false}>
          <RecoverPasswordPage />
        </AuthGuard>
      </AuthProvider>
    ),
    errorElement: <RouteErrorFallback />,
  },
  {
    path: "/reset-password",
    element: (
      <AuthProvider>
        <AuthGuard requireAuth={true}>
          <ResetPasswordPage />
        </AuthGuard>
      </AuthProvider>
    ),
    errorElement: <RouteErrorFallback />,
  },
  {
    path: "/signup",
    element: (
      <AuthProvider>
        <AuthGuard requireAuth={false}>
          <SignUpPage />
        </AuthGuard>
      </AuthProvider>
    ),
    errorElement: <RouteErrorFallback />,
  },
  {
    path: "/orgs",
    element: (
      <AuthProvider>
        <AuthGuard requireAuth={true}>
          <UserProvider>
            <DocsModalProvider>
              <OrgsPage />
            </DocsModalProvider>
          </UserProvider>
        </AuthGuard>
      </AuthProvider>
    ),
    errorElement: <RouteErrorFallback />,
  },
  {
    path: "/oauth/callback",
    element: <CallbackPage />,
    errorElement: <RouteErrorFallback />,
  },
  {
    path: "/:orgId/*",
    element: (
      <AuthProvider>
        <AuthGuard requireAuth={true}>
          <OrgsRoutesLayout />
        </AuthGuard>
      </AuthProvider>
    ),
    errorElement: <RouteErrorFallback />,
  },
]);

const rootEl = document.getElementById("root");
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <Toaster position="top-right" richColors />
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-screen">
              <Loader2Icon className="w-8 h-8 animate-spin" />
            </div>
          }
        >
          <RouterProvider router={router} />
        </Suspense>
        {/* {DEBUG && <ScreenSizeDisplay />} */}
      </ThemeProvider>
    </ErrorBoundary>
  );
}
