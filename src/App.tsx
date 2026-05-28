import { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, useParams } from 'react-router';
import { Loader2Icon } from 'lucide-react';
import { AppProvider } from '@/contexts/app-context';
import { AuthProvider } from '@/auth/AuthContext';
import { UserProvider } from '@/contexts/user-context';
import { OrgProvider } from '@/contexts/OrgContext';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthGuard } from '@/auth/AuthGuard';
import { ErrorBoundary } from '@/components/error-boundary';
import { RouteErrorFallback } from '@/components/error-router-fallback';
import { Toaster } from 'sonner';
import { useAuth } from '@/auth/AuthContext';

// Layout
import MainLayout from '@/app/MainLayout';
import OrgSelectionLayout from '@/app/OrgSelectionLayout';

// Auth pages
import LogInPage from '@/auth/pages/LogInPage';
import SignUpPage from '@/auth/pages/SignUpPage';
import RecoverPasswordPage from '@/auth/pages/RecoverPasswordPage';
import ResetPasswordPage from '@/auth/pages/ResetPasswordPage';

// Pages and routes

// Loading fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen">
    <Loader2Icon className="w-8 h-8 animate-spin text-[color:var(--accent-600)]" />
  </div>
);

// Component to handle root path redirect
const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check for selected org in localStorage
  const selectedOrgId = localStorage.getItem('selectedOrgId');
  if (selectedOrgId) {
    return <Navigate to={`/orgs/${selectedOrgId}`} replace />;
  }

  // No selected org, redirect to orgs page to select one
  return <Navigate to="/orgs" replace />;
};

// Layout for org routes with OrgProvider and UserProvider
const OrgRoutesLayout = () => {
  const { orgId } = useParams<{ orgId: string }>();
  
  if (!orgId) {
    return <Navigate to="/orgs" replace />;
  }

  return (
    <OrgProvider orgId={orgId}>
      <UserProvider>
        <MainLayout />
      </UserProvider>
    </OrgProvider>
  );
};

// Create router with explicit routes and AuthProvider wrapping
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AuthProvider>
        <RootRedirect />
      </AuthProvider>
    ),
    errorElement: <RouteErrorFallback />,
  },
  {
    path: '/login',
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
    path: '/signup',
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
    path: '/recover-password',
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
    path: '/reset-password',
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
    path: '/orgs',
    element: (
      <AuthProvider>
        <AuthGuard requireAuth={true}>
          <UserProvider>
            <OrgSelectionLayout />
          </UserProvider>
        </AuthGuard>
      </AuthProvider>
    ),
    errorElement: <RouteErrorFallback />,
  },
  {
    path: '/orgs/:orgId/*',
    element: (
      <AuthProvider>
        <AuthGuard requireAuth={true}>
          <AppProvider>
            <OrgRoutesLayout />
          </AppProvider>
        </AuthGuard>
      </AuthProvider>
    ),
    errorElement: <RouteErrorFallback />,
  },
]);

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Toaster position="top-right" richColors />
        <Suspense fallback={<LoadingSpinner />}>
          <RouterProvider router={router} />
        </Suspense>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
