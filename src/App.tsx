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
import SettingsProfilePage from '@/app/pages/settings/SettingsProfilePage';

// Loading fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen">
    <Loader2Icon className="w-8 h-8 animate-spin text-[color:var(--accent-600)]" />
  </div>
);

// Root component that checks auth and org selection
const RootApp = () => {
  const { user, loading } = useAuth();
  const selectedOrgId = localStorage.getItem('selectedOrgId');

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!selectedOrgId) {
    return <Navigate to="/orgs" replace />;
  }

  // User is authenticated and has selected an org, render the protected layout
  return (
    <OrgProvider orgId={selectedOrgId} key={selectedOrgId}>
      <UserProvider>
        <MainLayout />
      </UserProvider>
    </OrgProvider>
  );
};

// Import pages for routing
import DashboardPage from '@/app/pages/DashboardPage';
import InvoicesPage from '@/app/pages/invoices/InvoicesPage';
import ClientsPage from '@/app/pages/clients/ClientsPage';
import ProvidersPage from '@/app/pages/providers/ProvidersPage';
import SettingsGeneralPage from '@/app/pages/settings/SettingsGeneralPage';
import SettingsSerialNumbersPage from '@/app/pages/settings/SettingsSerialNumbersPage';

// Create router with all routes and error boundaries
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AuthProvider>
        <AuthGuard requireAuth>
          <RootApp />
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
        path: 'invoices/:id',
        element: <InvoicesPage />,
        errorElement: <RouteErrorFallback />,
      },
      {
        path: 'clients',
        element: <ClientsPage />,
        errorElement: <RouteErrorFallback />,
      },
      {
        path: 'clients/:id',
        element: <ClientsPage />,
        errorElement: <RouteErrorFallback />,
      },
      {
        path: 'providers',
        element: <ProvidersPage />,
        errorElement: <RouteErrorFallback />,
      },
      {
        path: 'providers/:id',
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
