import { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
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
import OrgSelectionPage from '@/app/pages/OrgSelectionPage';
import SettingsProfilePage from '@/app/pages/SettingsProfilePage';

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

  // Redirect authenticated users to org selection (to choose which org to work with)
  return <Navigate to="/orgs" replace />;
};

// Layout wrapper for protected routes with Org context
const ProtectedLayoutWithOrg = () => {
  const selectedOrgId = localStorage.getItem('selectedOrgId');

  if (!selectedOrgId) {
    // No org selected, redirect to org selection
    return <Navigate to="/orgs" replace />;
  }

  return (
    <OrgProvider orgId={selectedOrgId}>
      <UserProvider>
        <MainLayout />
      </UserProvider>
    </OrgProvider>
  );
};

// Import pages for routing
import DashboardPage from '@/app/pages/DashboardPage';
import InvoicesPage from '@/app/pages/InvoicesPage';
import ClientsPage from '@/app/pages/ClientsPage';
import ProvidersPage from '@/app/pages/ProvidersPage';
import SettingsGeneralPage from '@/app/pages/SettingsGeneralPage';
import SettingsSerialNumbersPage from '@/app/pages/SettingsSerialNumbersPage';

// Create router with all routes and error boundaries
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
        <AuthGuard>
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
        <AuthGuard>
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
        <AuthGuard>
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
        <AuthGuard requireAuth>
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
        <AuthGuard requireAuth>
          <OrgSelectionLayout />
        </AuthGuard>
      </AuthProvider>
    ),
    errorElement: <RouteErrorFallback />,
    children: [
      {
        index: true,
        element: <OrgSelectionPage />,
        errorElement: <RouteErrorFallback />,
      },
    ],
  },
  {
    path: '/dashboard',
    element: (
      <AuthProvider>
        <AuthGuard requireAuth>
          <ProtectedLayoutWithOrg />
        </AuthGuard>
      </AuthProvider>
    ),
    errorElement: <RouteErrorFallback />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
        errorElement: <RouteErrorFallback />,
      },
      {
        path: 'invoices',
        element: <InvoicesPage />,
        errorElement: <RouteErrorFallback />,
      },
      {
        path: 'clients',
        element: <ClientsPage />,
        errorElement: <RouteErrorFallback />,
      },
      {
        path: 'providers',
        element: <ProvidersPage />,
        errorElement: <RouteErrorFallback />,
      },
      {
        path: 'settings/general',
        element: <SettingsGeneralPage />,
        errorElement: <RouteErrorFallback />,
      },
      {
        path: 'settings/serial-numbers',
        element: <SettingsSerialNumbersPage />,
        errorElement: <RouteErrorFallback />,
      },
      {
        path: 'settings/profile',
        element: <SettingsProfilePage />,
        errorElement: <RouteErrorFallback />,
      },
    ],
  },
  {
    path: '/invoices',
    element: (
      <AuthProvider>
        <AuthGuard requireAuth>
          <ProtectedLayoutWithOrg />
        </AuthGuard>
      </AuthProvider>
    ),
    errorElement: <RouteErrorFallback />,
    children: [
      {
        index: true,
        element: <InvoicesPage />,
        errorElement: <RouteErrorFallback />,
      },
    ],
  },
  {
    path: '/clients',
    element: (
      <AuthProvider>
        <AuthGuard requireAuth>
          <ProtectedLayoutWithOrg />
        </AuthGuard>
      </AuthProvider>
    ),
    errorElement: <RouteErrorFallback />,
    children: [
      {
        index: true,
        element: <ClientsPage />,
        errorElement: <RouteErrorFallback />,
      },
    ],
  },
  {
    path: '/providers',
    element: (
      <AuthProvider>
        <AuthGuard requireAuth>
          <ProtectedLayoutWithOrg />
        </AuthGuard>
      </AuthProvider>
    ),
    errorElement: <RouteErrorFallback />,
    children: [
      {
        index: true,
        element: <ProvidersPage />,
        errorElement: <RouteErrorFallback />,
      },
    ],
  },
  {
    path: '/settings/general',
    element: (
      <AuthProvider>
        <AuthGuard requireAuth>
          <ProtectedLayoutWithOrg />
        </AuthGuard>
      </AuthProvider>
    ),
    errorElement: <RouteErrorFallback />,
    children: [
      {
        index: true,
        element: <SettingsGeneralPage />,
        errorElement: <RouteErrorFallback />,
      },
    ],
  },
  {
    path: '/settings/serial-numbers',
    element: (
      <AuthProvider>
        <AuthGuard requireAuth>
          <ProtectedLayoutWithOrg />
        </AuthGuard>
      </AuthProvider>
    ),
    errorElement: <RouteErrorFallback />,
    children: [
      {
        index: true,
        element: <SettingsSerialNumbersPage />,
        errorElement: <RouteErrorFallback />,
      },
    ],
  },
  {
    path: '/settings/profile',
    element: (
      <AuthProvider>
        <AuthGuard requireAuth>
          <ProtectedLayoutWithOrg />
        </AuthGuard>
      </AuthProvider>
    ),
    errorElement: <RouteErrorFallback />,
    children: [
      {
        index: true,
        element: <SettingsProfilePage />,
        errorElement: <RouteErrorFallback />,
      },
    ],
  },
]);

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AppProvider>
          <Toaster position="top-right" />
          <Suspense fallback={<LoadingSpinner />}>
            <RouterProvider router={router} />
          </Suspense>
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
