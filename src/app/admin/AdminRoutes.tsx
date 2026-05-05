import { Routes, Route } from 'react-router';
import SerialNumbersPage from './SerialNumbersPage';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="serial-numbers" element={<SerialNumbersPage />} />
      <Route path="settings" element={<div>Settings Page</div>} />
    </Routes>
  );
}
