import { Routes, Route } from 'react-router';
import DashboardPage from '@/app/pages/DashboardPage';
import InvoicesPage from '@/app/pages/InvoicesPage';
import ClientsPage from '@/app/pages/ClientsPage';
import SettingsSerialNumbersPage from '@/app/pages/SettingsSerialNumbersPage';
import SettingsGeneralPage from '@/app/pages/SettingsGeneralPage';
import ProvidersPage from './pages/ProvidersPage';

export function SettingsRoutes() {
  return (
    <Routes>
      <Route path="serial-numbers" element={<SettingsSerialNumbersPage />} />
      <Route path="general" element={<SettingsGeneralPage />} />
    </Routes>
  );
}


export default function AppRoutes() {
  return (
    <Routes>
      <Route index element={<DashboardPage />} />
      <Route path="invoices" element={<InvoicesPage />} />
      <Route path="clients" element={<ClientsPage />} />
      <Route path="providers" element={<ProvidersPage />} />
      <Route path="settings/*" element={<SettingsRoutes />} />
    </Routes>
  );
}
