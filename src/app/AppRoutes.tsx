import { Routes, Route } from 'react-router';
import Dashboard from './pages/Dashboard';
import SettingsSerialNumbers from './pages/SettingsSerialNumbers';
import SettingsGeneral from './pages/SettingsGeneral';

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
