import { Routes, Route, Navigate } from 'react-router';
import DashboardPage from '@/app/pages/dashboard/DashboardPage';
import InvoicesPage from '@/app/pages/invoices/InvoicesPage';
import InvoiceDetailPage from '@/app/pages/invoices/pages/InvoiceDetailPage';
import ClientsPage from '@/app/pages/clients/ClientsPage';
import ClientDetailPage from '@/app/pages/clients/pages/ClientDetailPage';
import SettingsSerialNumbersPage from '@/app/pages/settings/settings-serial-numbers/SettingsSerialNumbersPage';
import SettingsGeneralPage from '@/app/pages/settings/settings-general/SettingsGeneralPage';
import ProvidersPage from './pages/providers/ProvidersPage';
import ProviderDetailPage from './pages/providers/pages/ProviderDetailPage';
import SettingsProfilePage from './pages/settings/settings-profile/SettingsProfilePage';
import { ClientsProvider } from '@/app/pages/clients/contexts/ClientsContext';
import { InvoicesProvider } from '@/app/pages/invoices/contexts/InvoicesContext';
import { ProvidersProvider } from '@/app/pages/providers/contexts/ProvidersContext';
import { useOrg } from '@/contexts/OrgContext';


export default function AppRoutes() {
  const { org } = useOrg();
  const orgId = org?.id;

  function SettingsRoutes() {
    return (
      <Routes>
        <Route path="serial-numbers" element={<SettingsSerialNumbersPage />} />
        <Route path="general" element={<SettingsGeneralPage />} />
        <Route path="profile" element={<SettingsProfilePage />} />
        <Route path="*" element={<Navigate to={`/orgs/${orgId}/settings/general`} replace />} />
      </Routes>
    );
  }

  function InvoicesRoutes() {
    return (
      <Routes>
        <Route path="/" element={<InvoicesPage />} />
        <Route path="/:invoiceId" element={<InvoiceDetailPage />} />
        <Route path="*" element={<Navigate to={`/orgs/${orgId}/invoices`} replace />} />
      </Routes>
    );
  }

  function ClientRoutes() {
    return (
      <Routes>
        <Route path="/" element={<ClientsPage />} />
        <Route path="/:clientId" element={<ClientDetailPage />} />
        <Route path="*" element={<Navigate to={`/orgs/${orgId}/clients`} replace />} />
      </Routes>
    );
  }

  function ProviderRoutes() {
    return (
      <Routes>
        <Route path="/" element={<ProvidersPage />} />
        <Route path="/:providerId" element={<ProviderDetailPage />} />
        <Route path="*" element={<Navigate to={`/orgs/${orgId}/providers`} replace />} />
      </Routes>
    );
  }

  if (!orgId) {
    // If orgId is not available, we can either show a loading state or redirect to a "No Organization" page
    return <div>Loading...</div>;
  }
  return (
    <Routes>
      <Route index element={<DashboardPage />} />
      <Route path="invoices/*" element={<InvoicesProvider><InvoicesRoutes /></InvoicesProvider>} />
      <Route path="clients/*" element={<ClientsProvider><ClientRoutes /></ClientsProvider>} />
      <Route path="providers/*" element={<ProvidersProvider><ProviderRoutes /></ProvidersProvider>} />
      <Route path="settings/*" element={<SettingsRoutes />} />
      <Route path="*" element={<Navigate to={`/orgs/${orgId}`} replace />} />
    </Routes>
  );
}
