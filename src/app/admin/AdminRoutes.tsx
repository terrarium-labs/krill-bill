import { Routes, Route } from 'react-router';
import SettingsSerialNumbers from '../pages/SettingsSerialNumbers';
import SettingsGeneral from '../pages/SettingsGeneral';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="serial-numbers" element={<SettingsSerialNumbers />} />
      <Route path="settings" element={<SettingsGeneral />} />
    </Routes>
  );
}
