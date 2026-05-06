import { BrowserRouter, Routes, Route } from 'react-router';
import MainLayout from '@/app/MainLayout';
import AppRoutes from '@/app/AppRoutes';
import { AppProvider } from '@/contexts/app-context';
import { Toaster } from 'sonner';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/*" element={<AppRoutes />} />
          </Route>
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
