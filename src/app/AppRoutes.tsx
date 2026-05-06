import { Routes, Route } from 'react-router';
import Dashboard from '@/app/pages/Dashboard';
import SettingsSerialNumbers from '@/app/pages/SettingsSerialNumbers';
import SettingsGeneral from '@/app/pages/SettingsGeneral';

export function AdminRoutes() {
  return (
    <Routes>
      <Route path="serial-numbers" element={<SettingsSerialNumbers />} />
      <Route path="settings" element={<SettingsGeneral />} />
    </Routes>
  );
}


export default function AppRoutes() {
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="admin/*" element={<AdminRoutes />} />
    </Routes>
  );
}
