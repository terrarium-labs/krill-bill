import { Routes, Route } from 'react-router';
import DashboardPage from '@/app/pages/DashboardPage';
import InvoicesPage from '@/app/pages/invoices/InvoicesPage';
import InvoiceDetailPage from '@/app/pages/invoices/InvoiceDetailPage';
import ClientsPage from '@/app/pages/clients/ClientsPage';
import ClientDetailPage from '@/app/pages/clients/ClientDetailPage';
import SettingsSerialNumbersPage from '@/app/pages/settings/SettingsSerialNumbersPage';
import SettingsGeneralPage from '@/app/pages/settings/SettingsGeneralPage';
import ProvidersPage from './pages/providers/ProvidersPage';
import ProviderDetailPage from './pages/providers/ProviderDetailPage';
import SettingsProfilePage from './pages/settings/SettingsProfilePage';

export function SettingsRoutes() {
  return (
    <Routes>
      <Route path="serial-numbers" element={<SettingsSerialNumbersPage />} />
      <Route path="general" element={<SettingsGeneralPage />} />
      <Route path="profile" element={<SettingsProfilePage />} />
    </Routes>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route index element={<DashboardPage />} />
      
      <Route path="invoices" element={<InvoicesPage />} />
      <Route path="invoices/:id" element={<InvoiceDetailPage />} />
      
      <Route path="clients" element={<ClientsPage />} />
      <Route path="clients/:id" element={<ClientDetailPage />} />
      
      <Route path="providers" element={<ProvidersPage />} />
      <Route path="providers/:id" element={<ProviderDetailPage />} />
      
      <Route path="settings/*" element={<SettingsRoutes />} />
    </Routes>
  );
}
