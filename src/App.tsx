import { BrowserRouter, Routes, Route } from 'react-router';
import MainLayout from './app/MainLayout';
import AppRoutes from './app/AppRoutes';
import { Toaster } from 'sonner';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/*" element={<AppRoutes />} />
        </Route>
      </Routes>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
