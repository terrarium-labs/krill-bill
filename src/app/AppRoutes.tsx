import { Routes, Route } from 'react-router';
import Dashboard from '@/app/pages/Dashboard';
import Invoices from '@/app/pages/Invoices';
import Clients from '@/app/pages/Clients';
import SettingsSerialNumbers from '@/app/pages/SettingsSerialNumbers';
import SettingsGeneral from '@/app/pages/SettingsGeneral';

export function SettingsRoutes() {
  return (
    <Routes>
      <Route path="serial-numbers" element={<SettingsSerialNumbers />} />
      <Route path="general" element={<SettingsGeneral />} />
    </Routes>
  );
}


export default function AppRoutes() {
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="invoices" element={<Invoices />} />
      <Route path="clients" element={<Clients />} />
      <Route path="settings/*" element={<SettingsRoutes />} />
    </Routes>
  );
}
