import { Routes, Route } from 'react-router';
import Dashboard from './pages/Dashboard';
import AdminRoutes from './admin/AdminRoutes';

export default function AppRoutes() {
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="admin/*" element={<AdminRoutes />} />
    </Routes>
  );
}
