import { BrowserRouter, Routes, Route } from 'react-router';
import MainLayout from '@/app/MainLayout';
import AppRoutes from '@/app/AppRoutes';
import { AppProvider } from '@/contexts/app-context';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
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
    </ThemeProvider>
  );
}

export default App;
